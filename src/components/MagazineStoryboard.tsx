import { useState } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, RefreshCw, Check, GripVertical, Trash2 } from "lucide-react";
import { Layout } from "@/types/api";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  onSwapLayout: (pageIndex: number, newLayoutId: number | number[]) => void;
  onEditPage: (page: PagePlan) => void;
  onReorderPages: (pages: PagePlan[]) => void;
  onRemovePage: (pageIndex: number) => void;
}
interface SortablePageCardProps {
  page: PagePlan;
  index: number;
  allLayouts: Layout[];
  onSwapLayout: (pageIndex: number, newLayoutId: number | number[]) => void;
  onEditPage: (page: PagePlan) => void;
  onRemovePage: (pageIndex: number) => void;
}
function SortablePageCard({
  page,
  index,
  allLayouts,
  onSwapLayout,
  onEditPage,
  onRemovePage
}: SortablePageCardProps) {
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [selectedOnePagers, setSelectedOnePagers] = useState<number[]>([]);
  const [layoutFilter, setLayoutFilter] = useState<'all' | '1-pager' | '2-pager'>('all');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: page.pageNumber.toString(),
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    }
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 50 : 'auto'
  };
  const is2Pager = page.typeOfPage === '2 pager';

  // Reset selection when dialog opens/closes
  React.useEffect(() => {
    if (!swapDialogOpen) {
      setSelectedOnePagers([]);
    }
  }, [swapDialogOpen]);
  const handleOnePagerClick = (layoutId: number) => {
    if (is2Pager) {
      // For 2-pagers, allow selecting up to 2 one-pagers
      setSelectedOnePagers(prev => {
        if (prev.includes(layoutId)) {
          return prev.filter(id => id !== layoutId);
        } else if (prev.length < 2) {
          return [...prev, layoutId];
        }
        return prev;
      });
    } else {
      // For 1-pagers, immediate swap
      onSwapLayout(index, layoutId);
      setSwapDialogOpen(false);
    }
  };
  const handleConfirmOnePagers = () => {
    if (selectedOnePagers.length === 2) {
      onSwapLayout(index, selectedOnePagers);
      setSwapDialogOpen(false);
      setSelectedOnePagers([]);
    }
  };
  return <Card ref={setNodeRef} style={style} className={`relative transition-all duration-200 ${isDragging ? 'shadow-2xl scale-[1.02] rotate-1' : 'hover:shadow-md'} ${is2Pager ? 'ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-md transition-colors duration-150" title="Drag to reorder">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div>
              <h3 className="font-medium">
                {is2Pager ? `Pages ${page.pageNumber}-${page.pageNumber + 1}` : `Page ${page.pageNumber}`}
              </h3>
            </div>
          </div>
          
          {page.isCompleted && <Badge variant="secondary" className="gap-1">
              <Check className="h-3 w-3" />
              Done
            </Badge>}
        </div>

        {/* Layout Preview */}
        <div className="mb-4 bg-muted rounded-lg p-2 min-h-[120px] flex items-center justify-center">
          {page.layout?.bounding_box_image ? <img src={page.layout.bounding_box_image} alt={`Layout ${page.layoutId} preview`} className="max-w-full max-h-full object-contain rounded transition-transform duration-200 hover:scale-105" /> : <div className="text-center text-muted-foreground">
              <div className="text-lg font-medium">Layout {page.layoutId}</div>
              <div className="text-sm">Preview not available</div>
            </div>}
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="transition-transform duration-150 hover:scale-[1.02]">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Swap Layout
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Choose Layout for Page {page.pageNumber}</DialogTitle>
                  {is2Pager && <p className="text-sm text-muted-foreground">
                      Select a 2-page layout or two 1-page layouts to fill this spread
                    </p>}
                  <div className="flex gap-2 mt-3">
                    <Button variant={layoutFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setLayoutFilter('all')}>
                      All Layouts
                    </Button>
                    <Button variant={layoutFilter === '1-pager' ? 'default' : 'outline'} size="sm" onClick={() => setLayoutFilter('1-pager')}>
                      1-Page Only
                    </Button>
                    <Button variant={layoutFilter === '2-pager' ? 'default' : 'outline'} size="sm" onClick={() => setLayoutFilter('2-pager')}>
                      2-Page Only
                    </Button>
                  </div>
                </DialogHeader>
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-6 p-4 pb-20">
                    {/* For 2-pagers: Show both 2-page layouts and 1-page layouts */}
                    {is2Pager ? <>
                        {/* Preview section for selected 1-pagers */}
                        {selectedOnePagers.length > 0 && <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 rounded-lg p-4">
                            <h3 className="text-sm font-medium mb-3 text-blue-700 dark:text-blue-300">
                              Preview: This will create {selectedOnePagers.length === 2 ? '2 separate pages' : '1 page (need 1 more)'}
                            </h3>
                            <div className="flex gap-3">
                              {selectedOnePagers.map((layoutId, idx) => {
                          const layout = allLayouts.find(l => l.layout_id === layoutId);
                          return <div key={layoutId} className="flex-1">
                                    <Card className="border-blue-300">
                                      <CardContent className="p-2">
                                        <div className="aspect-square bg-muted rounded mb-1 flex items-center justify-center overflow-hidden">
                                          {layout?.bounding_box_image ? <img src={layout.bounding_box_image} alt={`Layout ${layoutId}`} className="w-full h-full object-contain" /> : <div className="text-xs text-center text-muted-foreground">
                                              Layout {layoutId}
                                            </div>}
                                        </div>
                                        <div className="text-xs text-center">
                                          <div className="font-medium">Page {page.pageNumber + idx}</div>
                                          <Badge variant="secondary" className="text-xs">
                                            Layout #{layoutId}
                                          </Badge>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>;
                        })}
                              {selectedOnePagers.length === 1 && <div className="flex-1">
                                  <Card className="border-dashed border-2 border-gray-300">
                                    <CardContent className="p-2">
                                      <div className="aspect-square bg-gray-100 rounded mb-1 flex items-center justify-center">
                                        <div className="text-xs text-center text-gray-400">
                                          Select 2nd layout
                                        </div>
                                      </div>
                                      <div className="text-xs text-center">
                                        <div className="font-medium text-gray-400">Page {page.pageNumber + 1}</div>
                                        <Badge variant="outline" className="text-xs">
                                          Pending
                                        </Badge>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>}
                            </div>
                          </div>}

                        {/* 2-Page Layouts Section */}
                        {(layoutFilter === 'all' || layoutFilter === '2-pager') && <div>
                            <h3 className="text-sm font-medium mb-3">2-Page Layouts</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {allLayouts.filter(layout => layout.layout_metadata?.type_of_page === '2 pager').map(layout => <Card key={layout.layout_id} className={`cursor-pointer transition-all duration-200 hover:bg-muted hover:scale-[1.02] ${layout.layout_id === page.layoutId ? 'ring-2 ring-primary' : ''}`} onClick={() => {
                          onSwapLayout(index, layout.layout_id);
                          setSwapDialogOpen(false);
                        }}>
                                  <CardContent className="p-3">
                                    <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
                                      {layout.bounding_box_image ? <img src={layout.bounding_box_image} alt={`Layout ${layout.layout_id}`} className="w-full h-full object-contain transition-transform duration-200 hover:scale-110" /> : <div className="text-xs text-center text-muted-foreground">
                                          Layout {layout.layout_id}
                                        </div>}
                                    </div>
                                    <div className="text-xs text-center">
                                      <div className="font-medium">#{layout.layout_id}</div>
                                      <div className="text-muted-foreground">
                                        {layout.layout_metadata?.layout_category}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>)}
                            </div>
                          </div>}

                        {/* 1-Page Layouts Section for 2-pagers */}
                        {(layoutFilter === 'all' || layoutFilter === '1-pager') && <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-medium">1-Page Layouts (Choose exactly 2)</h3>
                              <Badge variant="outline" className="text-xs">
                                {selectedOnePagers.length}/2 selected
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {allLayouts.filter(layout => layout.layout_metadata?.type_of_page === '1 pager').map(layout => {
                          const isSelected = selectedOnePagers.includes(layout.layout_id);
                          const canSelect = selectedOnePagers.length < 2 || isSelected;
                          return <Card key={layout.layout_id} className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${isSelected ? 'ring-2 ring-orange-500 bg-orange-50/50 border-orange-300' : canSelect ? 'hover:bg-muted border-orange-200/50 hover:border-orange-300' : 'opacity-50 cursor-not-allowed border-gray-200'}`} onClick={() => canSelect && handleOnePagerClick(layout.layout_id)}>
                                    <CardContent className="p-3">
                                      <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center overflow-hidden relative">
                                        {layout.bounding_box_image ? <img src={layout.bounding_box_image} alt={`Layout ${layout.layout_id}`} className="w-full h-full object-contain transition-transform duration-200 hover:scale-110" /> : <div className="text-xs text-center text-muted-foreground">
                                            Layout {layout.layout_id}
                                          </div>}
                                        {isSelected && <div className="absolute top-1 right-1 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                            {selectedOnePagers.indexOf(layout.layout_id) + 1}
                                          </div>}
                                      </div>
                                      <div className="text-xs text-center">
                                        <div className="font-medium">#{layout.layout_id}</div>
                                        <div className="text-muted-foreground">
                                          {layout.layout_metadata?.layout_category}
                                        </div>
                                        <Badge variant={isSelected ? "default" : "outline"} className="text-xs mt-1">
                                          1-Page {isSelected && `(${selectedOnePagers.indexOf(layout.layout_id) + 1})`}
                                        </Badge>
                                      </div>
                                    </CardContent>
                                  </Card>;
                        })}
                            </div>
                          </div>}
                      </> : (/* For 1-pagers: Show both 1-page and 2-page layouts */
                  <div className="space-y-6">
                        {/* 1-Page Layouts Section */}
                        {(layoutFilter === 'all' || layoutFilter === '1-pager') && (
                          <div>
                            <h3 className="text-sm font-medium mb-3">1-Page Layouts</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {allLayouts.filter(layout => layout.layout_metadata?.type_of_page === '1 pager').map(layout => (
                                <Card key={layout.layout_id} className={`cursor-pointer transition-all duration-200 hover:bg-muted hover:scale-[1.02] ${layout.layout_id === page.layoutId ? 'ring-2 ring-primary' : ''}`} onClick={() => handleOnePagerClick(layout.layout_id)}>
                                  <CardContent className="p-3">
                                    <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
                                      {layout.bounding_box_image ? (
                                        <img src={layout.bounding_box_image} alt={`Layout ${layout.layout_id}`} className="w-full h-full object-contain transition-transform duration-200 hover:scale-110" />
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
                          </div>
                        )}

                        {/* 2-Page Layouts Section with Warning */}
                        {(layoutFilter === 'all' || layoutFilter === '2-pager') && (
                          <div>
                            <div className="mb-3">
                              <h3 className="text-sm font-medium mb-2">2-Page Layouts</h3>
                              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs font-bold">!</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                      Page Count Warning
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                      Replacing this 1-page layout with a 2-page layout will increase your total page count and shift subsequent page numbers.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {allLayouts.filter(layout => layout.layout_metadata?.type_of_page === '2 pager').map(layout => (
                                <Card key={layout.layout_id} className={`cursor-pointer transition-all duration-200 hover:bg-muted hover:scale-[1.02] ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20`} onClick={() => {
                                  onSwapLayout(index, layout.layout_id);
                                  setSwapDialogOpen(false);
                                }}>
                                  <CardContent className="p-3">
                                    <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
                                      {layout.bounding_box_image ? (
                                        <img src={layout.bounding_box_image} alt={`Layout ${layout.layout_id}`} className="w-full h-full object-contain transition-transform duration-200 hover:scale-110" />
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
                                      <Badge variant="secondary" className="text-xs mt-1 bg-blue-100 text-blue-700 border-blue-300">
                                        2-Page
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>)}
                  </div>
                </ScrollArea>

                {/* Sticky confirmation button */}
                {is2Pager && selectedOnePagers.length === 2 && <div className="absolute bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-center">
                    <Button onClick={handleConfirmOnePagers} className="animate-fade-in min-w-[200px]" size="lg">
                      Confirm Selection ({selectedOnePagers.length} layouts)
                    </Button>
                  </div>}
              </DialogContent>
            </Dialog>

            <Button size="sm" className="transition-transform duration-150 hover:scale-[1.02]" onClick={() => onEditPage(page)}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            
            <Button variant="destructive" size="sm" className="transition-transform duration-150 hover:scale-[1.02]" onClick={() => onRemovePage(index)}>
              <Trash2 className="h-3 w-3 mr-1" />
              Remove
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Layout #{page.layoutId} - {page.layout?.layout_metadata?.layout_category}
          </div>
        </div>
      </CardContent>
    </Card>;
}
export function MagazineStoryboard({
  pages,
  allLayouts,
  onSwapLayout,
  onEditPage,
  onReorderPages,
  onRemovePage
}: MagazineStoryboardProps) {
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8 // 8px movement required to start drag
    }
  }), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));
  function handleDragEnd(event: DragEndEvent) {
    const {
      active,
      over
    } = event;
    if (active.id !== over?.id) {
      const oldIndex = pages.findIndex(page => page.pageNumber.toString() === active.id);
      const newIndex = pages.findIndex(page => page.pageNumber.toString() === over?.id);
      const reorderedPages = arrayMove(pages, oldIndex, newIndex);
      onReorderPages(reorderedPages);
    }
  }
  return <div className="space-y-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={pages.map(page => page.pageNumber.toString())} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-200">
            {pages.map((page, index) => <SortablePageCard key={page.pageNumber} page={page} index={index} allLayouts={allLayouts} onSwapLayout={onSwapLayout} onEditPage={onEditPage} onRemovePage={onRemovePage} />)}
          </div>
        </SortableContext>
      </DndContext>
    </div>;
}