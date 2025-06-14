import { useState } from "react";
import { cn } from "@/lib/utils";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Edit, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { formatDate, formatUser, formatImageUrl } from "@/utils/formatters";

export function LayoutDetails() {
  const { id } = useParams();
  const [jsonExpanded, setJsonExpanded] = useState(false);

  const { data: layout, isLoading, error } = useQuery({
    queryKey: ['layout', id],
    queryFn: () => apiService.getLayout(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !layout) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load layout</p>
          <Link to="/layouts">
            <Button>Back to Layouts</Button>
          </Link>
        </div>
      </div>
    );
  }

  const elementCount = Array.isArray(layout.layout_json?.elements)
    ? layout.layout_json.elements.length
    : Object.keys(layout.layout_json || {}).length;

  const isTwoPager = layout.layout_metadata?.type_of_layout === 'two_pager';

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
            <h1 className="text-3xl font-bold text-foreground">Layout #{layout.layout_id}</h1>
            <p className="text-muted-foreground">Layout ID: {layout.layout_id}</p>
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
              <p className="text-sm font-medium">{formatUser(layout.created_by)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="text-sm font-medium">{formatDate(layout.created_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Updated</label>
              <p className="text-sm font-medium">{formatDate(layout.updated_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Updated By</label>
              <p className="text-sm font-medium">{formatUser(layout.updated_by)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Merge Level</label>
              <p className="text-sm font-medium">Level {layout.layout_json?.merge_level || 2}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Page Number</label>
              <p className="text-sm font-medium">{layout.layout_json?.page_number || 1}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Elements</label>
              <p className="text-sm font-medium">{elementCount}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Confidence</label>
              <p className="text-sm font-medium">
                {layout.layout_json?.extraction_confidence 
                  ? `${(layout.layout_json.extraction_confidence * 100).toFixed(1)}%`
                  : 'N/A'}
              </p>
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
          <div className={isTwoPager ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}>
            <div className="space-y-3">
              <h3 className="font-medium text-center">Original Page</h3>
              <div
                className={cn(
                  isTwoPager
                    ? "bg-muted rounded-lg overflow-hidden border border-input hover:shadow-md transition-shadow max-w-xl mx-auto"
                    : "aspect-[3/4] bg-muted rounded-lg overflow-hidden border border-input hover:shadow-md transition-shadow"
                )}
              >
                {layout.page_image ? (
                  <img
                    src={formatImageUrl(layout.page_image) || ''}
                    alt="Original page"
                    className={isTwoPager ? "w-full h-auto object-contain" : "w-full h-full object-cover"}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No original image available</p>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-center">Extracted Layout (Bounding Boxes)</h3>
              <div
                className={cn(
                  isTwoPager
                    ? "bg-muted rounded-lg overflow-hidden border border-input hover:shadow-md transition-shadow max-w-xl mx-auto"
                    : "aspect-[3/4] bg-muted rounded-lg overflow-hidden border border-input hover:shadow-md transition-shadow"
                )}
              >
                {layout.bounding_box_image ? (
                  <img
                    src={formatImageUrl(layout.bounding_box_image) || ''}
                    alt="Layout with bounding boxes"
                    className={isTwoPager ? "w-full h-auto object-contain" : "w-full h-full object-cover"}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No bounding box image available</p>
                  </div>
                )}
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
                  <Badge variant="secondary">{elementCount} elements</Badge>
                  {jsonExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  <code>{JSON.stringify(layout.layout_json, null, 2)}</code>
                </pre>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Metadata JSON */}
      {layout.layout_metadata && Object.keys(layout.layout_metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Layout Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 overflow-auto">
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                <code>{JSON.stringify(layout.layout_metadata, null, 2)}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
