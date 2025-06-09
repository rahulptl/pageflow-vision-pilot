
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Edit, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function LayoutDetails() {
  const { id } = useParams();
  const [jsonExpanded, setJsonExpanded] = useState(false);

  // Mock data - in real app this would come from API
  const layout = {
    id: id,
    name: "Magazine Cover - June",
    creator: "Sarah Johnson",
    created_at: "2024-06-08T10:30:00Z",
    merge_level: 2,
    page_no: 1,
    status: "completed",
    file_size: "2.4 MB",
    dimensions: "8.5 × 11 inches",
    original_image: `https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=600&fit=crop`,
    bbox_image: `https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=600&fit=crop&overlay=bbox`,
    layout_json: {
      page_info: {
        width: 612,
        height: 792,
        page_number: 1
      },
      elements: [
        {
          type: "text",
          bbox: [50, 700, 300, 750],
          content: "Magazine Title",
          font_size: 24,
          font_family: "Arial"
        },
        {
          type: "image", 
          bbox: [50, 400, 500, 680],
          content: "main_image.jpg"
        },
        {
          type: "text",
          bbox: [50, 350, 400, 390],
          content: "Subtitle text content here",
          font_size: 14,
          font_family: "Arial"
        }
      ],
      merge_level: 2,
      extraction_confidence: 0.96
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/layouts">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Layouts
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{layout.name}</h1>
            <p className="text-muted-foreground">Layout ID: {layout.id}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Copy className="w-4 h-4" />
            Duplicate
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2">
            <Edit className="w-4 h-4" />
            Use Layout
          </Button>
        </div>
      </div>

      {/* Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle>Layout Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Creator</label>
              <p className="text-sm font-medium">{layout.creator}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="text-sm font-medium">{formatDate(layout.created_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Badge variant={layout.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                {layout.status}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Merge Level</label>
              <p className="text-sm font-medium">Level {layout.merge_level}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Page Number</label>
              <p className="text-sm font-medium">{layout.page_no}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">File Size</label>
              <p className="text-sm font-medium">{layout.file_size}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Dimensions</label>
              <p className="text-sm font-medium">{layout.dimensions}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Confidence</label>
              <p className="text-sm font-medium">{(layout.layout_json.extraction_confidence * 100).toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Layout Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-center">Original Page</h3>
              <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                <img
                  src={layout.original_image}
                  alt="Original page"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-center">Extracted Layout (Bounding Boxes)</h3>
              <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                <img
                  src={layout.bbox_image}
                  alt="Layout with bounding boxes"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* JSON Viewer */}
      <Card>
        <Collapsible open={jsonExpanded} onOpenChange={setJsonExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle>Layout JSON Data</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{layout.layout_json.elements.length} elements</Badge>
                  {jsonExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 overflow-auto">
                <pre className="text-sm text-muted-foreground">
                  <code>{JSON.stringify(layout.layout_json, null, 2)}</code>
                </pre>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
