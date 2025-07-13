import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Edit, RefreshCw, Check, GripVertical, Plus, AlertTriangle } from "lucide-react";
import { Layout } from "@/types/api";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
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

interface SlotData {
  id: string;
  slotNumber: number;
  isOccupied: boolean;
  pageData?: PagePlan;
  isSecondSlot?: boolean;
}

interface MagazineStoryboardProps {
  pages: PagePlan[];
  allLayouts: Layout[];
  onSwapLayout: (pageIndex: number, newLayoutId: number) => void;
  onEditPage: (page: PagePlan) => void;
  onSlotsChange: (slots: SlotData[]) => void;
}

function SortableSlot({ slot, allLayouts, onSwapLayout, onEditPage, onFillSlot }: {
  slot: SlotData;
  allLayouts: Layout[];
  onSwapLayout: (slotNumber: number, newLayoutId: number) => void;
  onEditPage: (page: PagePlan) => void;
  onFillSlot: (slotNumber: number) => void;
}) {
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!slot.isOccupied) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 min-h-[200px] flex flex-col items-center justify-center bg-muted/20 ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        <Plus className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground text-center">
          Slot {slot.slotNumber} - Empty
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => onFillSlot(slot.slotNumber)}
        >
          Fill Slot
        </Button>
      </div>
    );
  }

  if (slot.isSecondSlot) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`border border-muted rounded-lg p-2 min-h-[100px] flex items-center justify-center bg-muted/50 ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        <p className="text-xs text-muted-foreground text-center">
          Part of 2-pager above
        </p>
      </div>
    );
  }

  const page = slot.pageData!;
  const is2Pager = page.typeOfPage.includes('2 pager');

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'opacity-50' : ''} ${
        is2Pager ? 'row-span-2' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
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
          
          <div className="flex items-center gap-2">
            {page.isCompleted && (
              <Badge variant="secondary" className="gap-1">
                <Check className="h-3 w-3" />
                Done
              </Badge>
            )}
            {is2Pager && (
              <Badge variant="outline" className="text-xs">
                2-Slot
              </Badge>
            )}
          </div>
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
            <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
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
                          onSwapLayout(slot.slotNumber, layout.layout_id);
                          setSwapDialogOpen(false);
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
  );
}

export function MagazineStoryboard({ pages, allLayouts, onSwapLayout, onEditPage, onSlotsChange }: MagazineStoryboardProps) {
  // Convert pages to slots
  const createSlotsFromPages = (pages: PagePlan[]): SlotData[] => {
    const slots: SlotData[] = [];
    let slotNumber = 1;
    
    pages.forEach((page, pageIndex) => {
      const is2Pager = page.typeOfPage.includes('2 pager');
      
      // First slot for the page
      slots.push({
        id: `slot-${slotNumber}`,
        slotNumber,
        isOccupied: true,
        pageData: page,
        isSecondSlot: false,
      });
      
      if (is2Pager) {
        // Second slot for 2-pager
        slots.push({
          id: `slot-${slotNumber + 1}`,
          slotNumber: slotNumber + 1,
          isOccupied: true,
          pageData: page,
          isSecondSlot: true,
        });
        slotNumber += 2;
      } else {
        slotNumber += 1;
      }
    });
    
    // Add empty slots to reach the total page count (assuming pageCount is available)
    const targetSlots = Math.max(10, slotNumber + 2); // Add some buffer
    while (slotNumber <= targetSlots) {
      slots.push({
        id: `slot-${slotNumber}`,
        slotNumber,
        isOccupied: false,
      });
      slotNumber++;
    }
    
    return slots;
  };

  const [slots, setSlots] = useState<SlotData[]>(() => createSlotsFromPages(pages));
  const [dragError, setDragError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDragError(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeIndex = slots.findIndex(slot => slot.id === active.id);
    const overIndex = slots.findIndex(slot => slot.id === over.id);
    
    const activeSlot = slots[activeIndex];
    const overSlot = slots[overIndex];

    // Validate the move
    if (activeSlot.pageData && overSlot.isOccupied && !overSlot.isSecondSlot) {
      const activeIs2Pager = activeSlot.pageData.typeOfPage.includes('2 pager');
      const overIs2Pager = overSlot.pageData?.typeOfPage.includes('2 pager');

      // If moving a 1-pager to a 2-pager position, or vice versa, show error
      if (activeIs2Pager && !overIs2Pager) {
        setDragError("Cannot move 2-pager to 1-pager position. You need 2 consecutive empty slots.");
        return;
      }
      
      if (!activeIs2Pager && overIs2Pager) {
        setDragError("Moving 1-pager to 2-pager position will leave an empty slot that needs to be filled.");
      }
    }

    // Perform the move
    const newSlots = arrayMove(slots, activeIndex, overIndex);
    setSlots(newSlots);
    onSlotsChange(newSlots);
  };

  const handleSwapLayout = (slotNumber: number, newLayoutId: number) => {
    const slotIndex = slots.findIndex(slot => slot.slotNumber === slotNumber);
    const pageIndex = pages.findIndex(page => 
      slots[slotIndex].pageData?.pageNumber === page.pageNumber
    );
    
    if (pageIndex !== -1) {
      onSwapLayout(pageIndex, newLayoutId);
    }
  };

  const handleFillSlot = (slotNumber: number) => {
    // This would open a dialog to select a layout to fill the empty slot
    console.log('Fill slot', slotNumber);
  };

  const occupiedSlots = slots.filter(slot => slot.isOccupied && !slot.isSecondSlot);

  return (
    <div className="space-y-6">
      {dragError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{dragError}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Magazine Layout</h3>
        <div className="text-sm text-muted-foreground">
          {occupiedSlots.length} pages • {slots.filter(s => s.isOccupied).length} slots used
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={slots.map(slot => slot.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slots.slice(0, 20).map((slot) => ( // Limit to first 20 slots for display
              <SortableSlot
                key={slot.id}
                slot={slot}
                allLayouts={allLayouts}
                onSwapLayout={handleSwapLayout}
                onEditPage={onEditPage}
                onFillSlot={handleFillSlot}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}