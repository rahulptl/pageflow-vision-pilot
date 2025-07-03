import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { Layout } from "@/types/api";

interface EditLayoutDialogProps {
  layout: Layout;
}

export function EditLayoutDialog({ layout }: EditLayoutDialogProps) {
  const [open, setOpen] = useState(false);
  const [boundingBoxImage, setBoundingBoxImage] = useState<File | null>(null);
  const [layoutJson, setLayoutJson] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ boundingBoxImage, layoutJson }: { boundingBoxImage: File; layoutJson: File }) =>
      apiService.updateLayout(layout.layout_id, boundingBoxImage, layoutJson),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
      queryClient.invalidateQueries({ queryKey: ['layout', layout.layout_id] });
      toast.success("Layout updated successfully!");
      setOpen(false);
      setBoundingBoxImage(null);
      setLayoutJson(null);
    },
    onError: () => {
      toast.error("Failed to update layout");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!boundingBoxImage || !layoutJson) {
      toast.error("Please select both files");
      return;
    }

    updateMutation.mutate({ boundingBoxImage, layoutJson });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Layout #{layout.layout_id}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="boundingBox">Bounding Box Image</Label>
            <div className="flex items-center gap-2">
              <Input
                id="boundingBox"
                type="file"
                accept="image/*"
                onChange={(e) => setBoundingBoxImage(e.target.files?.[0] || null)}
                className="flex-1"
              />
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
            {boundingBoxImage && (
              <p className="text-sm text-muted-foreground">
                Selected: {boundingBoxImage.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="layoutJson">Layout JSON File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="layoutJson"
                type="file"
                accept=".json"
                onChange={(e) => setLayoutJson(e.target.files?.[0] || null)}
                className="flex-1"
              />
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
            {layoutJson && (
              <p className="text-sm text-muted-foreground">
                Selected: {layoutJson.name}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending || !boundingBoxImage || !layoutJson}
            >
              {updateMutation.isPending ? "Updating..." : "Update Layout"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}