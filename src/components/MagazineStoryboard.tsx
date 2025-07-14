import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, RefreshCw, Check, GripVertical } from "lucide-react";
import { Layout } from "@/types/api";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
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
  onSwapLayout: (pageIndex: number, newLayoutId: number) => void;
  onEditPage: (page: PagePlan) => void;
  onReorderPages: (pages: PagePlan[]) => void;
}

interface SortablePageCardProps {
  page: PagePlan;
  index: number;
  allLayouts: Layout[];
  onSwapLayout: (pageIndex: number, newLayoutId: number) => void;
  onEditPage: (page: PagePlan) => void;
}

function SortablePageCard({ page, index, allLayouts, onSwapLayout, onEditPage }: SortablePageCardProps) {
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.pageNumber.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`relative transition-all duration-200 animate-fade-in ${
        isDragging ? 'shadow-2xl scale-105 rotate-2' : 'hover:shadow-md'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div 
              {...attributes} 
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-md transition-colors duration-150 hover-scale"
              title="Drag to reorder"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
              {page.pageNumber}
            </div>
            <div>
              <h3 className="font-medium">Page {page.pageNumber}</h3>
              <p className="text-xs text-muted-foreground">{page.typeOfPage}</p>
            </div>
          </div>
          
          {page.isCompleted && (
            <Badge variant="secondary" className="gap-1 animate-scale-in">
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
              className="max-w-full max-h-full object-contain rounded transition-transform duration-200 hover:scale-105"
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
            <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 hover-scale">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Swap Layout
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] animate-scale-in">
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
                        className={`cursor-pointer transition-all duration-200 hover:bg-muted hover-scale ${
                          layout.layout_id === page.layoutId ? 'ring-2 ring-primary animate-scale-in' : ''
                        }`}
                        onClick={() => {
                          onSwapLayout(index, layout.layout_id);
                          setSwapDialogOpen(false);
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
                            {layout.bounding_box_image ? (
                              <img
                                src={layout.bounding_box_image}
                                alt={`Layout ${layout.layout_id}`}
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
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Button 
              size="sm" 
              className="flex-1 hover-scale"
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
  );
}

export function MagazineStoryboard({ pages, allLayouts, onSwapLayout, onEditPage, onReorderPages }: MagazineStoryboardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = pages.findIndex(page => page.pageNumber.toString() === active.id);
      const newIndex = pages.findIndex(page => page.pageNumber.toString() === over?.id);
      
      const reorderedPages = arrayMove(pages, oldIndex, newIndex);
      onReorderPages(reorderedPages);
    }
  }

  return (
    <div className="space-y-6">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={pages.map(page => page.pageNumber.toString())}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-200">
            {pages.map((page, index) => (
              <SortablePageCard
                key={page.pageNumber}
                page={page}
                index={index}
                allLayouts={allLayouts}
                onSwapLayout={onSwapLayout}
                onEditPage={onEditPage}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}