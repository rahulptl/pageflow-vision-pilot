import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, RefreshCw, Check } from "lucide-react";
import { Layout } from "@/types/api";

interface PagePlan {
  pageNumber: number;
  typeOfPage: string;
  layoutId: number;
  layout?: Layout;
  isCompleted: boolean;
  xmlUploaded: boolean;
}

interface MagazineStoryboardProps {
  pages: PagePlan[];
  allLayouts: Layout[];
  onSwapLayout: (pageIndex: number, newLayoutId: number) => void;
  onEditPage: (page: PagePlan) => void;
}

export function MagazineStoryboard({ pages, allLayouts, onSwapLayout, onEditPage }: MagazineStoryboardProps) {
  const [swapDialogOpen, setSwapDialogOpen] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page, index) => (
          <Card key={page.pageNumber} className="relative">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                    {page.pageNumber}
                  </div>
                  <div>
                    <h3 className="font-medium">Page {page.pageNumber}</h3>
                    <p className="text-xs text-muted-foreground">{page.typeOfPage}</p>
                  </div>
                </div>
                
                {page.isCompleted && (
                  <Badge variant="secondary" className="gap-1">
                    <Check className="h-3 w-3" />
                    Done
                  </Badge>
                )}
              </div>

              {/* Layout Preview */}
              <div className="mb-4 bg-muted rounded-lg p-2 min-h-[120px] flex items-center justify-center">
                {page.layout?.bounding_box_image ? (
                  <img
                    src={page.layout.bounding_box_image}
                    alt={`Layout ${page.layoutId} preview`}
                    className="max-w-full max-h-full object-contain rounded"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <div className="text-lg font-medium">Layout {page.layoutId}</div>
                    <div className="text-sm">Preview not available</div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Dialog open={swapDialogOpen === index} onOpenChange={(open) => setSwapDialogOpen(open ? index : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Swap Layout
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Choose Layout for Page {page.pageNumber}</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-[60vh]">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                          {allLayouts
                            .filter(layout => layout.layout_metadata?.type_of_page === page.typeOfPage)
                            .map((layout) => (
                            <Card 
                              key={layout.layout_id} 
                              className={`cursor-pointer transition-colors hover:bg-muted ${
                                layout.layout_id === page.layoutId ? 'ring-2 ring-primary' : ''
                              }`}
                              onClick={() => {
                                onSwapLayout(index, layout.layout_id);
                                setSwapDialogOpen(null);
                              }}
                            >
                              <CardContent className="p-3">
                                <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
                                  {layout.bounding_box_image ? (
                                    <img
                                      src={layout.bounding_box_image}
                                      alt={`Layout ${layout.layout_id}`}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <div className="text-xs text-center text-muted-foreground">
                                      Layout {layout.layout_id}
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-center">
                                  <div className="font-medium">#{layout.layout_id}</div>
                                  <div className="text-muted-foreground">
                                    {layout.layout_metadata?.layout_category}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => onEditPage(page)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Layout #{page.layoutId} - {page.layout?.layout_metadata?.layout_category}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}