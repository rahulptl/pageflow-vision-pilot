import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Save, X, Image as ImageIcon, FileText, Type, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import { LayoutRenderer } from "@/components/LayoutRenderer";
import { VivaDesignerIntegration } from "./VivaDesignerIntegration";

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
  vivaDocumentName?: string; // Track document name in VIVA
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
  const [currentStep, setCurrentStep] = useState<'text' | 'image'>('text');
  const [showLayoutGuideModal, setShowLayoutGuideModal] = useState(false);
  const [zoom, setZoom] = useState(100);

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
      console.log("🚀 DEBUGGING: About to call patchPageLayout with:");
      console.log("article_id:", article.article_id);
      console.log("page.pageUid:", page.pageUid);
      console.log("updatedLayoutData:", updatedLayoutData);
      
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

  const textFields = formFields.filter(field => field.type === 'text');
  const imageFields = formFields.filter(field => field.type === 'image');

  return (
    <>
      {/* Layout Guide Modal */}
      <Dialog open={showLayoutGuideModal} onOpenChange={setShowLayoutGuideModal}>
        <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-none max-h-none w-auto h-auto">
          {page.layoutJson || page.layout?.layout_json ? (() => {
            const layoutData = page.layoutJson || page.layout?.layout_json;
            const pageSize = layoutData?.document?.settings?.pageSize || { width: 612, height: 792 };
            const numPages = layoutData?.document?.pages?.length || 1;
            const isSpread = numPages === 2;

            const totalWidth = isSpread ? pageSize.width * 2 : pageSize.width;
            const totalHeight = pageSize.height;
            const scale = zoom / 100;

            const scaledWidth = totalWidth * scale;
            const scaledHeight = totalHeight * scale;

            return (
              <div className="relative bg-white rounded-lg shadow-xl border">
                <div 
                  className="p-4 bg-gray-50 rounded-b-lg flex justify-center items-center"
                  style={{
                    width: Math.max(scaledWidth + 32, 400), // Add padding and min width
                    height: scaledHeight + 32, // Add padding
                  }}
                >
                  <div
                    style={{
                      width: totalWidth,
                      height: totalHeight,
                      transform: `scale(${scale})`,
                      transformOrigin: 'center center',
                    }}
                  >
                    <LayoutRenderer
                      layoutJson={layoutData}
                      width={totalWidth}
                      height={totalHeight}
                      className="bg-white shadow-md"
                    />
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="bg-white rounded-lg p-8 shadow-xl border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Layout Guide</h3>
                <button
                  onClick={() => setShowLayoutGuideModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">No layout guide available</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Edit Page {page.pageNumber}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{page.typeOfPage}</Badge>
                <Badge variant="secondary">Layout #{page.layoutId}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowLayoutGuideModal(true)}>
                View Layout Guide
              </Button>
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

          {/* Step Navigation */}
          <div className="flex items-center gap-4 border-b pb-4">
            <Button 
              variant={currentStep === 'text' ? 'default' : 'outline'} 
              onClick={() => setCurrentStep('text')}
              className="gap-2"
            >
              <Type className="h-4 w-4" />
              Step 1: Text Content ({textFields.length})
            </Button>
            <Button 
              variant={currentStep === 'image' ? 'default' : 'outline'} 
              onClick={() => setCurrentStep('image')}
              className="gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Step 2: Images ({imageFields.length})
            </Button>
          </div>

          {/* Step Content */}
          {currentStep === 'text' ? (
            // Text Fields Step
            textFields.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Type className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No text content found in this layout</p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(fieldsByPage).map(([pageNumber, fields]) => {
                const pageTextFields = fields.filter(field => field.type === 'text');
                if (pageTextFields.length === 0) return null;
                
                return (
                  <Card key={pageNumber}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        Page {pageNumber} - Text Content
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {pageTextFields.map((field) => (
                        <div key={field.id} className="space-y-2">
                          <Label className="font-medium text-sm flex items-center gap-2">
                            {formatTextType(field.textType || 'Text')}
                            <Badge variant="secondary" className="text-xs">ID: {field.objectId}</Badge>
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
                    </CardContent>
                  </Card>
                );
              })
            )
          ) : (
            // Image Fields Step
            imageFields.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No images found in this layout</p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(fieldsByPage).map(([pageNumber, fields]) => {
                const pageImageFields = fields.filter(field => field.type === 'image');
                if (pageImageFields.length === 0) return null;
                
                return (
                  <Card key={pageNumber}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Page {pageNumber} - Images
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {pageImageFields.map((field) => {
                        const hasUploadedImage = fieldValues[field.id];
                        const hasExistingImage = field.content && field.content.startsWith('http');

                        return (
                          <div key={field.id} className="border rounded-lg p-4 space-y-3">
                            <Label className="font-medium text-sm flex items-center gap-2">
                              {formatTextType(field.imageType || 'Image')}
                              <Badge variant="secondary" className="text-xs">ID: {field.objectId}</Badge>
                            </Label>
                            
                            {hasUploadedImage || hasExistingImage ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-green-600 font-medium">
                                    {hasUploadedImage ? `✓ New image uploaded` : 'Using existing image'}
                                  </span>
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
                     </CardContent>
                   </Card>
                 );
               })
             )
           )}
         </div>
       </div>
     </>
   );
 }