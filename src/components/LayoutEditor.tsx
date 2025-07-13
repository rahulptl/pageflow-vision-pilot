import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Save, X, Image as ImageIcon } from "lucide-react";

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

interface TextBlock {
  id: string;
  content: string;
  type: string;
}

interface ImageBlock {
  id: string;
  src: string | null;
  alt: string;
}

export function LayoutEditor({ page, onSave, onCancel }: LayoutEditorProps) {
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([
    { id: '1', content: 'Your headline here...', type: 'headline' },
    { id: '2', content: 'Subheadline content...', type: 'subheadline' },
    { id: '3', content: 'Body content goes here. This is where you can write your main article text...', type: 'body' },
  ]);

  const [imageBlocks, setImageBlocks] = useState<ImageBlock[]>([
    { id: '1', src: null, alt: 'Feature image' },
    { id: '2', src: null, alt: 'Secondary image' },
  ]);

  const handleTextChange = (id: string, content: string) => {
    setTextBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, content } : block
    ));
  };

  const handleImageUpload = (id: string, file: File) => {
    const url = URL.createObjectURL(file);
    setImageBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, src: url } : block
    ));
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-screen">
        {/* Editor Panel */}
        <div className="space-y-6">
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

          {/* Text Blocks */}
          <Card>
            <CardHeader>
              <CardTitle>Text Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {textBlocks.map((block) => (
                <div key={block.id}>
                  <Label className="capitalize">{block.type}</Label>
                  {block.type === 'body' ? (
                    <Textarea
                      value={block.content}
                      onChange={(e) => handleTextChange(block.id, e.target.value)}
                      rows={4}
                    />
                  ) : (
                    <Input
                      value={block.content}
                      onChange={(e) => handleTextChange(block.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Image Uploads */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {imageBlocks.map((block) => (
                <div key={block.id} className="border rounded-lg p-4">
                  <Label>{block.alt}</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {block.src ? (
                      <img
                        src={block.src}
                        alt={block.alt}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(block.id, file);
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Panel */}
        <div className="border rounded-lg bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Live Preview</h2>
            <p className="text-sm text-muted-foreground">Real-time preview of your layout</p>
          </div>

          {/* Layout Preview */}
          <div className="bg-gray-50 rounded-lg p-6 min-h-[600px] relative">
            {page.layout?.bounding_box_image && (
              <div className="absolute inset-0 opacity-20">
                <img
                  src={page.layout.bounding_box_image}
                  alt="Layout guide"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Simulated content layout */}
            <div className="relative z-10 space-y-4">
              {textBlocks.map((block) => (
                <div key={block.id} className={`
                  ${block.type === 'headline' ? 'text-2xl font-bold' : ''}
                  ${block.type === 'subheadline' ? 'text-lg font-medium text-gray-600' : ''}
                  ${block.type === 'body' ? 'text-sm leading-relaxed' : ''}
                `}>
                  {block.content}
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4 mt-6">
                {imageBlocks.map((block) => (
                  <div key={block.id} className="aspect-video bg-gray-200 rounded overflow-hidden">
                    {block.src ? (
                      <img
                        src={block.src}
                        alt={block.alt}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs">{block.alt}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}