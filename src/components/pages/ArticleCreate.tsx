import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { ArticleCreate, LayoutPage } from "@/types/api";
import { formatImageUrl, formatShortDate } from "@/utils/formatters";
import { toast } from "sonner";

interface FormData {
  title: string;
}

export function ArticleCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedLayouts, setSelectedLayouts] = useState<number[]>([]);

  const form = useForm<FormData>({
    defaultValues: {
      title: "",
    },
  });

  const { data: layouts = [], isLoading } = useQuery({
    queryKey: ['layouts'],
    queryFn: () => apiService.getLayouts(),
  });

  // Returns the layout object given a layoutId
  const getLayoutById = (layoutId: number) => layouts.find(l => l.layout_id === layoutId);

  // Helper: compute page spans and total pages for selected layouts
  function computePageLabels(selectedLayouts: number[]) {
    let currentPage = 1;
    const labels: { layoutId: number; label: string }[] = [];
    selectedLayouts.forEach(layoutId => {
      const layout = getLayoutById(layoutId);
      const type = layout?.layout_metadata?.type_of_layout === "two_pager" ? "two_pager" : "one_pager";
      const span = type === "two_pager" ? 2 : 1;
      const from = currentPage;
      const to = currentPage + span - 1;
      let label = "";
      if (span === 2) label = `Pages ${from}-${to}`;
      else label = `Page ${from}`;
      labels.push({ layoutId, label });
      currentPage += span;
    });
    return labels;
  }
  const pageLabels = computePageLabels(selectedLayouts);
  const totalPages = pageLabels.length
    ? (pageLabels[pageLabels.length - 1].label.match(/\d+$/)
        ? Number(pageLabels[pageLabels.length - 1].label.match(/\d+$/)![0])
        : 0)
    : 0;

  const createMutation = useMutation({
    mutationFn: (data: ArticleCreate) => apiService.createArticle(data),
    onSuccess: (article) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success("Article created successfully!");
      navigate(`/articles/${article.article_id}`);
    },
    onError: () => {
      toast.error("Failed to create article");
    },
  });

  // Update onSubmit to use computed totalPages and update layoutPages accordingly
  const onSubmit = (data: FormData) => {
    if (selectedLayouts.length === 0) {
      toast.error("Please select at least one layout");
      return;
    }

    // Compute correct page numbers and spans for database
    let pageCounter = 1;
    const layoutPages: LayoutPage[] = selectedLayouts.map((layoutId) => {
      const layout = getLayoutById(layoutId);
      const isTwoPager = layout?.layout_metadata?.type_of_layout === "two_pager";
      const page_span = isTwoPager ? 2 : 1;
      const layoutPage = {
        page: pageCounter,
        layout_id: layoutId,
        page_span: page_span
      };
      pageCounter += page_span;
      return layoutPage;
    });

    createMutation.mutate({
      title: data.title,
      page_count: totalPages,
      layout_pages: layoutPages,
    });
  };

  const toggleLayout = (layoutId: number) => {
    setSelectedLayouts(prev => 
      prev.includes(layoutId) 
        ? prev.filter(id => id !== layoutId)
        : [...prev, layoutId]
    );
  };

  const moveLayout = (fromIndex: number, toIndex: number) => {
    const newOrder = [...selectedLayouts];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setSelectedLayouts(newOrder);
  };

  if (isLoading) {
    return (
      <div className="content-container py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/articles">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Article</h1>
          <p className="text-muted-foreground">
            Stitch together layouts to create an article. <br />
            <span className="font-medium">Total Pages: {totalPages}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Article Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    rules={{ required: "Title is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Article Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter article title..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <label className="text-sm font-medium">Selected Layouts</label>
                    <div className="mt-2 space-y-2">
                      {selectedLayouts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No layouts selected</p>
                      ) : (
                        pageLabels.map(({ layoutId, label }, index) => {
                          const layout = getLayoutById(layoutId);
                          return (
                            <div key={layoutId} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {label}
                                </Badge>
                                <span className="text-sm">Layout #{layoutId}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleLayout(layoutId)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createMutation.isPending || selectedLayouts.length === 0}
                    >
                      {createMutation.isPending ? "Creating..." : "Create Article"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Layout Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Select Layouts ({selectedLayouts.length} selected) <br />
                <span className="font-normal text-sm">Total Pages: {totalPages}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {layouts.map((layout) => {
                  // Pre-calculate what page/spans this layout would have if added
                  const previewLabels = computePageLabels([
                    ...selectedLayouts.filter(id => id !== layout.layout_id),
                    layout.layout_id
                  ]);
                  const isSelected = selectedLayouts.includes(layout.layout_id);
                  return (
                    <div
                      key={layout.layout_id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleLayout(layout.layout_id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleLayout(layout.layout_id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">Layout #{layout.layout_id}</h3>
                            {isSelected && (
                              <Badge variant="default" className="text-xs">
                                {pageLabels.find(lbl => lbl.layoutId === layout.layout_id)?.label}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="aspect-[3/4] bg-muted rounded overflow-hidden mb-2">
                            {layout.bounding_box_image ? (
                              <img
                                src={formatImageUrl(layout.bounding_box_image) || ''}
                                alt={`Layout ${layout.layout_id}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-muted-foreground text-xs">No preview</span>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            Created {formatShortDate(layout.created_at)}
                          </p>
                          {isSelected && (
                            <p className="text-xs mt-1 text-foreground/70">{pageLabels.find(lbl => lbl.layoutId === layout.layout_id)?.label}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {layouts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No layouts available</p>
                  <Link to="/generate">
                    <Button variant="outline" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Generate Layouts First
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
