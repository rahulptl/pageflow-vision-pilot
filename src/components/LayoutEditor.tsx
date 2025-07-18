import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Save, X, Image as ImageIcon, FileText, Type } from "lucide-react";

interface PagePlan {
  pageNumber: number;
  typeOfPage: string;
  layoutId: number;
  layout?: any;
  isCompleted: boolean;
  xmlUploaded: boolean;
}

interface LayoutEditorProps {
  page: PagePlan;
  onSave: () => void;
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

export function LayoutEditor({ page, onSave, onCancel }: LayoutEditorProps) {
  // Parse layout JSON to extract objects
  const formFields = useMemo(() => {
    if (!page.layout?.layout_json?.document?.pages) return [];
    
    const fields: FormField[] = [];
    const pages = page.layout.layout_json.document.pages;
    
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
  }, [page.layout]);

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    formFields.forEach(field => {
      initial[field.id] = field.content;
    });
    return initial;
  });

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleImageUpload = (fieldId: string, file: File) => {
    const url = URL.createObjectURL(file);
    setFieldValues(prev => ({ ...prev, [fieldId]: url }));
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

  return (
    <div className="container mx-auto py-8">
      <div className="flex gap-8">
        {/* Sticky Bounding Box */}
        <div className="w-80 sticky top-8 self-start">
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
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={onSave}>
                <Save className="h-4 w-4 mr-1" />
                Save & Continue
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
                          <Label className="capitalize font-medium text-sm">
                            {field.textType?.replace(/([A-Z])/g, ' $1').trim()}
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
                      {fields.filter(field => field.type === 'image').map((field) => (
                        <div key={field.id} className="border rounded-lg p-4 space-y-3">
                          <Label className="capitalize font-medium text-sm">
                            {field.imageType?.replace(/([A-Z])/g, ' $1').trim()}
                          </Label>
                          <div className="flex items-center gap-4">
                            {fieldValues[field.id] ? (
                              <img
                                src={fieldValues[field.id]}
                                alt={field.label}
                                className="w-20 h-20 object-cover rounded border"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-muted rounded border flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(field.id, file);
                                }}
                                className="w-full"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Upload image for {field.imageType}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
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