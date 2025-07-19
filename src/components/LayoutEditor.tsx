import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Save, X, Image as ImageIcon, FileText, Type, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/services/api";

interface PagePlan {
  pageNumber: number;
  typeOfPage: string;
  layoutId: number;
  layout?: any;
  layoutJson?: any;
  isCompleted: boolean;
  xmlUploaded: boolean;
  pageUid: string;
  boundingBoxImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface LayoutEditorProps {
  page: PagePlan;
  article?: any; // Article data containing article_id
  onSave: (updatedLayoutJson: any) => void;
  onCancel: () => void;
}

interface LayoutObject {
  id: number;
  type: string;
  story?: string;
  textType?: string;
  imageType?: string;
  source?: {
    url?: string;
    fit?: string;
    align?: string;
  };
  geometry?: string;
  transform?: string;
}

interface FormField {
  id: string;
  type: 'text' | 'image';
  label: string;
  content: string;
  objectId: number;
  pageNumber: number;
  textType?: string;
  imageType?: string;
}

export function LayoutEditor({ page, article, onSave, onCancel }: LayoutEditorProps) {
  // Parse layout JSON to extract objects
  const formFields = useMemo(() => {
    // Use layoutJson from article_json if available, otherwise fallback to layout.layout_json
    const layoutData = page.layoutJson || page.layout?.layout_json;
    if (!layoutData?.document?.pages) return [];
    
    const fields: FormField[] = [];
    const pages = layoutData.document.pages;
    
    pages.forEach((pageData: any, pageIndex: number) => {
      if (pageData.objects) {
        Object.keys(pageData.objects).forEach(layerName => {
          const objects = pageData.objects[layerName];
          objects.forEach((obj: LayoutObject) => {
            if (obj.type === 'text' && obj.textType && obj.textType !== 'page number') {
              fields.push({
                id: `${pageIndex}-${obj.id}`,
                type: 'text',
                label: obj.textType,
                content: obj.story ? obj.story.replace(/<[^>]*>/g, '') : '',
                objectId: obj.id,
                pageNumber: pageIndex + 1,
                textType: obj.textType
              });
            } else if (obj.type === 'image' && obj.imageType) {
              fields.push({
                id: `${pageIndex}-${obj.id}`,
                type: 'image',
                label: obj.imageType,
                content: obj.source?.url || '',
                objectId: obj.id,
                pageNumber: pageIndex + 1,
                imageType: obj.imageType
              });
            }
          });
        });
      }
    });
    
    return fields.sort((a, b) => {
      if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
      return a.objectId - b.objectId;
    });
  }, [page.layout, page.layoutJson]);

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    formFields.forEach(field => {
      // Only set initial value for text fields, leave image fields empty
      initial[field.id] = field.type === 'text' ? field.content : '';
    });
    return initial;
  });

  // Track uploaded image files for each field
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleImageUpload = (fieldId: string, file: File) => {
    const url = URL.createObjectURL(file);
    setFieldValues(prev => ({ ...prev, [fieldId]: url }));
    setUploadedFiles(prev => ({ ...prev, [fieldId]: file }));
  };

  const handleDrop = (fieldId: string, e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleImageUpload(fieldId, files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Helper function to format text type labels
  const formatTextType = (textType: string) => {
    return textType
      .replace(/([A-Z])/g, ' $1')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  };

  // Group fields by page
  const fieldsByPage = useMemo(() => {
    const grouped: Record<number, FormField[]> = {};
    formFields.forEach(field => {
      if (!grouped[field.pageNumber]) grouped[field.pageNumber] = [];
      grouped[field.pageNumber].push(field);
    });
    return grouped;
  }, [formFields]);

  // Handle save with image uploads and layout update
  const handleSave = async () => {
    if (!article?.article_id) {
      toast.error("Article ID not found");
      return;
    }

    setIsSaving(true);
    try {
      // Step 1: Check if all required images are uploaded
      const imageFields = formFields.filter(field => field.type === 'image');
      const missingImages = imageFields.filter(field => {
        // Check if no file is uploaded for this field
        const hasUploadedFile = uploadedFiles[field.id];
        const hasExistingValidUrl = field.content && field.content.startsWith('http');
        return !hasUploadedFile && !hasExistingValidUrl;
      });
      
      if (missingImages.length > 0) {
        toast.error(`Please upload ${missingImages.length} missing image(s) before saving`);
        setIsSaving(false);
        return;
      }

      // Step 2: Upload new images and get URLs
      const uploadPromises: Promise<void>[] = [];
      const newImageUrls: Record<string, string> = {};

      for (const fieldId of Object.keys(uploadedFiles)) {
        const file = uploadedFiles[fieldId];
        uploadPromises.push(
          apiService.uploadImage(file).then(response => {
            newImageUrls[fieldId] = response.url;
          })
        );
      }

      await Promise.all(uploadPromises);

      // Step 3: Construct updated layout JSON
      const layoutData = page.layoutJson || page.layout?.layout_json;
      if (!layoutData) {
        toast.error("Layout data not found");
        setIsSaving(false);
        return;
      }

      const updatedLayoutData = JSON.parse(JSON.stringify(layoutData));
      
      // Update text and image content in the layout JSON
      updatedLayoutData.document.pages.forEach((pageData: any, pageIndex: number) => {
        if (pageData.objects) {
          Object.keys(pageData.objects).forEach(layerName => {
            const objects = pageData.objects[layerName];
            objects.forEach((obj: any) => {
              const fieldId = `${pageIndex}-${obj.id}`;
              
              // Update text content
              if (obj.type === 'text' && fieldValues[fieldId] !== undefined) {
                // Preserve HTML tags if they exist, otherwise use plain text
                if (obj.story && obj.story.includes('<')) {
                  // Extract the tag structure and replace content
                  const tagMatch = obj.story.match(/^<([^>]+)>.*<\/([^>]+)>$/);
                  if (tagMatch) {
                    obj.story = `<${tagMatch[1]}>${fieldValues[fieldId]}</${tagMatch[2]}>`;
                  } else {
                    obj.story = fieldValues[fieldId];
                  }
                } else {
                  obj.story = fieldValues[fieldId];
                }
              }
              
              // Update image URLs
              if (obj.type === 'image' && newImageUrls[fieldId]) {
                if (!obj.source) obj.source = {};
                obj.source.url = newImageUrls[fieldId];
              }
            });
          });
        }
      });

      // Step 4: Update the article layout via PATCH API using page_uid
      const updatedArticle = await apiService.patchPageLayout(
        article.article_id,
        page.pageUid,
        updatedLayoutData
      );

      toast.success("Layout saved successfully!");
      onSave(updatedArticle);
      
    } catch (error) {
      console.error("Error saving layout:", error);
      toast.error("Failed to save layout. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex gap-8">
        {/* Sticky Bounding Box */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-4 h-fit">
            <Card>
            <CardHeader>
              <CardTitle>Layout Guide</CardTitle>
              <p className="text-sm text-muted-foreground">Reference for content placement</p>
            </CardHeader>
            <CardContent>
              {page.layout?.bounding_box_image ? (
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={page.layout.bounding_box_image}
                    alt="Layout bounding box"
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">No layout guide available</p>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Content Editor */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Edit Page {page.pageNumber}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{page.typeOfPage}</Badge>
                <Badge variant="secondary">Layout #{page.layoutId}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} disabled={isSaving}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save & Continue
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Form Fields by Page */}
          {Object.keys(fieldsByPage).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No editable content found in this layout</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(fieldsByPage).map(([pageNumber, fields]) => (
              <Card key={pageNumber}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Page {pageNumber} Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Text Fields */}
                  {fields.filter(field => field.type === 'text').length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Text Content
                      </h4>
                      {fields.filter(field => field.type === 'text').map((field) => (
                        <div key={field.id} className="space-y-2">
                          <Label className="font-medium text-sm">
                            {formatTextType(field.textType || 'Text')}
                          </Label>
                          {field.textType?.includes('body') || field.textType?.includes('copy') ? (
                            <Textarea
                              value={fieldValues[field.id] || ''}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              placeholder={`Enter ${field.textType}...`}
                              rows={4}
                              className="min-h-[100px]"
                            />
                          ) : (
                            <Input
                              value={fieldValues[field.id] || ''}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              placeholder={`Enter ${field.textType}...`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Image Fields */}
                  {fields.filter(field => field.type === 'image').length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Images
                      </h4>
                      {fields.filter(field => field.type === 'image').map((field) => {
                        const hasUploadedImage = fieldValues[field.id];
                        const hasExistingImage = field.content && field.content.startsWith('http');
                        const displayImage = hasUploadedImage || hasExistingImage;
                        const imageUrl = hasUploadedImage || field.content;

                        return (
                          <div key={field.id} className="border rounded-lg p-4 space-y-3">
                            <Label className="font-medium text-sm">
                              {formatTextType(field.imageType || 'Image')}
                            </Label>
                            
                            {displayImage ? (
                              <div className="space-y-3">
                                <div className="relative group">
                                  <img
                                    src={imageUrl}
                                    alt={field.label}
                                    className="w-full h-40 object-cover rounded border"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                  <div className="hidden bg-muted rounded border h-40 flex items-center justify-center">
                                    <div className="text-center">
                                      <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                      <p className="text-sm text-muted-foreground">
                                        {formatTextType(field.imageType || 'Image')} Placeholder
                                      </p>
                                    </div>
                                  </div>
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => {
                                        setFieldValues(prev => ({ ...prev, [field.id]: '' }));
                                        setUploadedFiles(prev => {
                                          const updated = { ...prev };
                                          delete updated[field.id];
                                          return updated;
                                        });
                                      }}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      {hasUploadedImage ? 'Remove' : 'Replace'}
                                    </Button>
                                  </div>
                                </div>
                                <div
                                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                                  onDrop={(e) => handleDrop(field.id, e)}
                                  onDragOver={handleDragOver}
                                  onClick={() => document.getElementById(`file-${field.id}`)?.click()}
                                >
                                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">
                                    Drop new image or click to {hasUploadedImage ? 'replace' : 'upload'}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="bg-muted rounded border h-40 flex items-center justify-center">
                                  <div className="text-center">
                                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                      {formatTextType(field.imageType || 'Image')} Placeholder
                                    </p>
                                  </div>
                                </div>
                                <div
                                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                                  onDrop={(e) => handleDrop(field.id, e)}
                                  onDragOver={handleDragOver}
                                  onClick={() => document.getElementById(`file-${field.id}`)?.click()}
                                >
                                  <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                                  <p className="text-sm font-medium mb-1">
                                    Drop image here or click to upload
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatTextType(field.imageType || 'image')}
                                  </p>
                                </div>
                              </div>
                            )}
                          
                          <input
                            id={`file-${field.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(field.id, file);
                            }}
                          />
                        </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}