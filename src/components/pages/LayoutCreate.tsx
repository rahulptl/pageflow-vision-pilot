import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { Upload, Plus } from "lucide-react";

interface CreateLayoutFormData {
  layout_json: File | null;
  page_image: File | null;
  created_by: string;
  magazine_title: string;
  magazine_category: string;
  type_of_page: "1 pager" | "2 pager";
}

export function LayoutCreate() {
  const [formData, setFormData] = useState<CreateLayoutFormData>({
    layout_json: null,
    page_image: null,
    created_by: "",
    magazine_title: "",
    magazine_category: "",
    type_of_page: "1 pager",
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const createLayoutMutation = useMutation({
    mutationFn: async (data: CreateLayoutFormData) => {
      if (!data.layout_json || !data.page_image) {
        throw new Error("Both JSON file and page image are required");
      }
      return apiService.createLayout(data);
    },
    onSuccess: (result) => {
      toast({
        title: "Layout created successfully",
        description: `Layout ID: ${result.layout_id}`,
      });
      navigate("/admin/layouts");
    },
    onError: (error) => {
      toast({
        title: "Failed to create layout",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (field: "layout_json" | "page_image") => (file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const handleInputChange = (field: keyof CreateLayoutFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLayoutMutation.mutate(formData);
  };

  const isFormValid = formData.layout_json && formData.page_image;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Manual Layout</h1>
          <p className="text-muted-foreground">
            Upload a layout JSON file and corresponding page image to create a new layout template.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Layout Details
            </CardTitle>
            <CardDescription>
              Fill in the layout information and upload the required files.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Uploads */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Layout JSON File */}
                <FileUpload
                  onFileSelect={handleFileChange("layout_json")}
                  accept={{ 'application/json': ['.json'] }}
                  fileType="json"
                  selectedFile={formData.layout_json}
                  title="Layout JSON File *"
                  description="Upload the layout configuration file"
                />

                {/* Page Image */}
                <FileUpload
                  onFileSelect={handleFileChange("page_image")}
                  accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }}
                  fileType="image"
                  selectedFile={formData.page_image}
                  title="Page Image *"
                  description="Upload the page preview image"
                />
              </div>

              {/* Layout Type */}
              <div className="space-y-2">
                <Label htmlFor="type-of-page">Page Type *</Label>
                <Select
                  value={formData.type_of_page}
                  onValueChange={(value: "1 pager" | "2 pager") => handleInputChange("type_of_page")(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select page type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 pager">1 Pager</SelectItem>
                    <SelectItem value="2 pager">2 Pager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Optional Fields */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="magazine-title">Magazine Title</Label>
                  <Input
                    id="magazine-title"
                    value={formData.magazine_title}
                    onChange={(e) => handleInputChange("magazine_title")(e.target.value)}
                    placeholder="Enter magazine title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="magazine-category">Magazine Category</Label>
                  <Input
                    id="magazine-category"
                    value={formData.magazine_category}
                    onChange={(e) => handleInputChange("magazine_category")(e.target.value)}
                    placeholder="Enter magazine category"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="created-by">Created By</Label>
                <Input
                  id="created-by"
                  value={formData.created_by}
                  onChange={(e) => handleInputChange("created_by")(e.target.value)}
                  placeholder="Enter creator name"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={!isFormValid || createLayoutMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {createLayoutMutation.isPending ? "Creating..." : "Create Layout"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/layouts")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}