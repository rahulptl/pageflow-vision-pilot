import { useState } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, RefreshCw, Check, GripVertical, Trash2, Save, Plus } from "lucide-react";
import { Layout } from "@/types/api";
import { LayoutRenderer } from "@/components/LayoutRenderer";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PagePlan {
  pageNumber: number;
  typeOfPage: string;
  layoutId: number;
  layout?: Layout;
  layoutJson?: any;
  isCompleted: boolean;
  xmlUploaded: boolean;
}

interface MagazineStoryboardProps {
  pages: PagePlan[];
  allLayouts: Layout[];
  article?: {
    layout_order: number[];
    article_json: Record<string, any>;
    article_id?: number;
    status?: string;
  };
  onSwapLayout: (pageIndex: number, newLayoutId: number | number[]) => void;
  onEditPage: (page: PagePlan) => void;
  onReorderPages: (pages: PagePlan[]) => void;
  onRemovePage: (pageIndex: number) => void;
  onAddPage?: (layoutId: number) => void;
  onSave?: () => void;
  onRegenerateRecommendations?: () => void;
  magazineTitle?: string;
  magazineCategory?: string;
  isSwapRecommending?: boolean;
}

interface SortablePageCardProps {
  page: PagePlan;
  index: number;
  allLayouts: Layout[];
  onSwapLayout: (pageIndex: number, newLayoutId: number | number[]) => void;
  onEditPage: (page: PagePlan) => void;
  onRemovePage: (pageIndex: number) => void;
  isPublished?: boolean;
}

function SortablePageCard({
  page,
  index,
  allLayouts,
  onSwapLayout,
  onEditPage,
  onRemovePage,
  isPublished = false
}: SortablePageCardProps) {
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [swapWarningOpen, setSwapWarningOpen] = useState(false);
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

  return (
    <Card ref={setNodeRef} style={style} className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${
      isDragging ? 'shadow-xl' : ''
    } ${isPublished ? 'border-amber-200 bg-amber-50/30' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isPublished && <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">Published</Badge>}
            <div {...attributes} {...listeners} className={`${isPublished ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} p-1 hover:bg-muted rounded-md transition-colors duration-150`} title={isPublished ? 'View Only' : 'Drag to reorder'}>
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div>
              <h3 className="font-medium text-sm">
                {is2Pager ? `Pages ${page.pageNumber}-${page.pageNumber + 1}` : `Page ${page.pageNumber}`}
              </h3>
              <p className="text-xs text-muted-foreground">Layout #{page.layoutId}</p>
            </div>
          </div>
          
          {page.isCompleted && (
            <Badge variant="secondary" className="gap-1">
              <Check className="h-3 w-3" />
              Done
            </Badge>
          )}
        </div>

        {/* Layout Preview - Clickable only if not published */}
        <div 
          className={`mb-4 bg-muted rounded-lg p-2 min-h-[200px] flex items-center justify-center transition-all duration-200 ${
            isPublished ? 'cursor-default' : 'cursor-pointer hover:bg-muted/80'
          }`}
          onClick={() => !isPublished && onEditPage(page)}
        >
          {page.layoutJson ? (
            <LayoutRenderer 
              layoutJson={page.layoutJson} 
              width={200} 
              height={200}
              className="transition-transform duration-200 hover:scale-105"
            />
          ) : page.layout?.layout_json ? (
            <LayoutRenderer 
              layoutJson={page.layout.layout_json} 
              width={200} 
              height={200}
              className="transition-transform duration-200 hover:scale-105"
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <div className="text-lg font-medium">Layout {page.layoutId}</div>
              <div className="text-sm">No layout data available</div>
            </div>
          )}
        </div>
        
        {/* Action buttons at bottom - only show if not published */}
        <div className="flex justify-center gap-1 h-6 items-center">
          {!isPublished && (
            <>
              {/* Swap Layout Warning Dialog */}
              <AlertDialog open={swapWarningOpen} onOpenChange={setSwapWarningOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-6 w-6 p-0 transition-transform duration-150 hover:scale-[1.02]" title="Swap Layout">
                    <RefreshCw className="h-2.5 w-2.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base">Swap Layout?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                      Any content edits for this page will be lost. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      setSwapWarningOpen(false);
                      setSwapDialogOpen(true);
                    }}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Actual Swap Dialog */}
              <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
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
                                           {layout?.layout_json ? (
                                             <LayoutRenderer 
                                               layoutJson={layout.layout_json} 
                                               width={80} 
                                               className="w-full h-full object-contain" 
                                             />
                                           ) : (
                                             <div className="text-xs text-center text-muted-foreground">
                                               Layout {layoutId}
                                             </div>
                                           )}
                                         </div>
                                        <div className="text-xs text-center">
                                          <div className="font-medium">Page {page.pageNumber + idx}</div>
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
                                       {layout.layout_json ? (
                                         <LayoutRenderer 
                                           layoutJson={layout.layout_json} 
                                           width={80} 
                                           className="w-full h-full object-contain transition-transform duration-200 hover:scale-110" 
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
                                         {layout.layout_json ? (
                                           <LayoutRenderer 
                                             layoutJson={layout.layout_json} 
                                             width={80} 
                                             className="w-full h-full object-contain transition-transform duration-200 hover:scale-110" 
                                           />
                                          ) : (
                                            <div className="text-xs text-center text-muted-foreground">
                                              Layout {layout.layout_id}
                                            </div>
                                          )}
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
                                       {layout.layout_json ? (
                                         <LayoutRenderer 
                                           layoutJson={layout.layout_json} 
                                           width={80} 
                                           className="w-full h-full object-contain transition-transform duration-200 hover:scale-110" 
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
                                       {layout.layout_json ? (
                                         <LayoutRenderer 
                                           layoutJson={layout.layout_json} 
                                           width={80} 
                                           className="w-full h-full object-contain transition-transform duration-200 hover:scale-110" 
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

              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 w-6 p-0 transition-transform duration-150 hover:scale-[1.02]" 
                title="Remove Page"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePage(index);
                }}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MagazineStoryboard({
  pages,
  allLayouts,
  article,
  onSwapLayout,
  onEditPage,
  onReorderPages,
  onRemovePage,
  onAddPage,
  onSave,
  onRegenerateRecommendations,
  magazineTitle,
  magazineCategory,
  isSwapRecommending = false
}: MagazineStoryboardProps) {
  const [addPageDialogOpen, setAddPageDialogOpen] = useState(false);
  const isPublished = article && 'status' in article ? article.status !== 'DRAFT' : false;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // 8px movement required to start drag
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    if (isPublished) return; // Don't allow drag for published articles
    
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = pages.findIndex(page => page.pageNumber.toString() === active.id);
      const newIndex = pages.findIndex(page => page.pageNumber.toString() === over?.id);
      const reorderedPages = arrayMove(pages, oldIndex, newIndex);
      onReorderPages(reorderedPages);
    }
  }

  // Calculate total pages considering 2-pagers take 2 pages
  const totalPages = pages.reduce((total, page) => {
    return total + (page.typeOfPage === '2 pager' ? 2 : 1);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Top navigation bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className={`text-2xl font-bold transition-all duration-500 ${
          isSwapRecommending ? 'animate-pulse-slow text-blue-600' : ''
        }`}>
          Magazine Storyboard
          {isPublished && <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800">View Only</Badge>}
          {isSwapRecommending && (
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 animate-bounce">
              Updating...
            </Badge>
          )}
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Total pages: {totalPages}
          </div>
          {onSave && !isPublished && (
            <Button onClick={onSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Magazine
            </Button>
          )}
        </div>
      </div>

      {/* New Recommendations Button - Only show for draft articles */}
      {onRegenerateRecommendations && !isPublished && (
        <div className="flex justify-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2 border-brand-purple/20 text-brand-purple hover:border-brand-purple/30"
              >
                <RefreshCw className="h-4 w-4" />
                Generate New Recommendations
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Generate New Recommendations?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will generate a completely new set of layout recommendations. Any edits you've made to the current layouts will be overwritten and replaced. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onRegenerateRecommendations}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={pages.map(page => page.pageNumber.toString())} strategy={rectSortingStrategy}>
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500 ${
          isSwapRecommending ? 'animate-fade-in opacity-80 scale-[0.98]' : 'opacity-100 scale-100'
        }`}>
            {pages.map((page, index) => (
              <SortablePageCard 
                key={page.pageNumber} 
                page={page} 
                index={index} 
                allLayouts={allLayouts} 
                onSwapLayout={onSwapLayout} 
                onEditPage={onEditPage} 
                onRemovePage={onRemovePage}
                isPublished={isPublished}
              />
            ))}
            
            {/* Add Page Card - Only show for draft articles */}
            {onAddPage && !isPublished && (
              <Dialog open={addPageDialogOpen} onOpenChange={setAddPageDialogOpen}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-dashed border-2 border-muted-foreground/30 bg-muted/20">
                    <CardContent className="p-4 h-full flex flex-col items-center justify-center min-h-[200px]">
                      <Plus className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">Add Page</p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Select Layout for New Page</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh]">
                    <div className="space-y-6 p-4">
                      <div>
                        <h3 className="text-sm font-medium mb-3">Available Layouts</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {allLayouts.map(layout => (
                            <Card 
                              key={layout.layout_id} 
                              className="cursor-pointer transition-all duration-200 hover:bg-muted hover:scale-[1.02]"
                              onClick={() => {
                                onAddPage(layout.layout_id);
                                setAddPageDialogOpen(false);
                              }}
                            >
                              <CardContent className="p-3">
                                <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
                                  {layout.layout_json ? (
                                    <LayoutRenderer 
                                      layoutJson={layout.layout_json} 
                                      width={80} 
                                      className="w-full h-full object-contain transition-transform duration-200 hover:scale-110" 
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
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {layout.layout_metadata?.type_of_page || '1-Page'}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
