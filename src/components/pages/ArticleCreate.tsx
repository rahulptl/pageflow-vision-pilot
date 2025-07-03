import { useState, useMemo } from "react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { ArticleCreate, LayoutPage, Layout } from "@/types/api";
import { formatImageUrl, formatShortDate } from "@/utils/formatters";
import { toast } from "sonner";
import { LayoutFilter, LayoutFilters, LayoutSort } from "@/components/articles/LayoutFilter";

interface FormData {
  article_title: string;
  magazine_name: string;
  approximate_number_of_words: number;
  number_of_images: number;
  article_category: string;
  created_by: string;
}

export function ArticleCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedLayouts, setSelectedLayouts] = useState<number[]>([]);
  const [layoutFilters, setLayoutFilters] = useState<LayoutFilters>({
    search: '',
    type: '',
    dateRange: '',
  });
  const [layoutSort, setLayoutSort] = useState<LayoutSort>({
    field: 'created_at',
    direction: 'desc',
  });

  const form = useForm<FormData>({
    defaultValues: {
      article_title: "",
      magazine_name: "",
      approximate_number_of_words: 0,
      number_of_images: 0,
      article_category: "news", // Set a default value instead of empty string
      created_by: "",
    },
  });

  const { data: allLayouts = [], isLoading } = useQuery({
    queryKey: ['layouts-all'],
    queryFn: () => apiService.getLayouts(0, 1000), // Get a large number of layouts for article creation
  });

  // Filter and sort layouts
  const filteredLayouts = useMemo(() => {
    let filtered = [...allLayouts];

    // Apply search filter
    if (layoutFilters.search) {
      filtered = filtered.filter(layout => 
        layout.layout_id.toString().includes(layoutFilters.search) ||
        JSON.stringify(layout.layout_metadata).toLowerCase().includes(layoutFilters.search.toLowerCase())
      );
    }

    // Apply type filter
    if (layoutFilters.type) {
      filtered = filtered.filter(layout => 
        layout.layout_metadata?.type_of_page === layoutFilters.type
      );
    }

    // Apply date filter
    if (layoutFilters.dateRange) {
      const now = new Date();
      const filterDate = new Date();
      
      switch (layoutFilters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(layout => 
        new Date(layout.created_at) >= filterDate
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      if (layoutSort.field === 'created_at') {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      } else {
        aValue = a.layout_id;
        bValue = b.layout_id;
      }
      
      return layoutSort.direction === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return filtered;
  }, [allLayouts, layoutFilters, layoutSort]);

  // Returns the layout object given a layoutId
  const getLayoutById = (layoutId: number) => allLayouts.find(l => l.layout_id === layoutId);

  // Calculate auto-populated counts from selected layouts
  const calculateCounts = (selectedLayoutIds: number[]) => {
    let totalWords = 0;
    let totalImages = 0;
    
    selectedLayoutIds.forEach(layoutId => {
      const layout = getLayoutById(layoutId);
      if (layout?.layout_metadata) {
        totalWords += layout.layout_metadata.max_number_of_words || 0;
        totalImages += layout.layout_metadata.number_of_images || 0;
      }
    });
    
    return { totalWords, totalImages };
  };

  const { totalWords, totalImages } = calculateCounts(selectedLayouts);

  // Update form fields when layout selection changes
  React.useEffect(() => {
    form.setValue("approximate_number_of_words", totalWords);
    form.setValue("number_of_images", totalImages);
  }, [totalWords, totalImages, form]);

  // Helper: compute page spans and total pages for selected layouts
  function computePageLabels(selectedLayouts: number[]) {
    let currentPage = 1;
    const labels: { layoutId: number; label: string }[] = [];
    selectedLayouts.forEach(layoutId => {
      const layout = getLayoutById(layoutId);
      const type = layout?.layout_metadata?.type_of_page === "2 pager" ? "2 pager" : "1 pager";
      const span = type === "2 pager" ? 2 : 1;
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
      navigate(`/admin/articles/${article.article_id}`);
    },
    onError: () => {
      toast.error("Failed to create article");
    },
  });

  const onSubmit = (data: FormData) => {
    if (selectedLayouts.length === 0) {
      toast.error("Please select at least one layout");
      return;
    }

    // Compute correct page numbers and spans for database
    let pageCounter = 1;
    const layoutPages: LayoutPage[] = selectedLayouts.map((layoutId) => {
      const layout = getLayoutById(layoutId);
      const isTwoPager = layout?.layout_metadata?.type_of_page === "2 pager";
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
      article_title: data.article_title,
      page_count: totalPages,
      layout_pages: layoutPages,
      magazine_name: data.magazine_name,
      approximate_number_of_words: data.approximate_number_of_words,
      number_of_images: data.number_of_images,
      article_category: data.article_category,
      created_by: data.created_by,
    });
  };

  const toggleLayout = (layoutId: number) => {
    setSelectedLayouts(prev => 
      prev.includes(layoutId) 
        ? prev.filter(id => id !== layoutId)
        : [...prev, layoutId]
    );
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
        <Link to="/admin/articles">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Article</h1>
          <p className="text-muted-foreground">
            Create an article with selected layouts. <br />
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
                    name="article_title"
                    rules={{ required: "Article title is required" }}
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

                  <FormField
                    control={form.control}
                    name="magazine_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Magazine Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter magazine name..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="approximate_number_of_words"
                      render={({ field }) => (
                       <FormItem>
                          <FormLabel>Word Count</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Auto-calculated from selected layouts ({totalWords} total). You can edit this value.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="number_of_images"
                      render={({ field }) => (
                       <FormItem>
                          <FormLabel>Image Count</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Auto-calculated from selected layouts ({totalImages} total). You can edit this value.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="article_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "news"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="news">News</SelectItem>
                            <SelectItem value="sports">Sports</SelectItem>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="lifestyle">Lifestyle</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="entertainment">Entertainment</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="created_by"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Created By</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <label className="text-sm font-medium">Selected Layouts ({selectedLayouts.length})</label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {selectedLayouts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No layouts selected</p>
                      ) : (
                        pageLabels.map(({ layoutId, label }) => (
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
                        ))
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
        <div className="lg:col-span-2 space-y-6">
          <LayoutFilter
            onFilterChange={setLayoutFilters}
            onSortChange={setLayoutSort}
          />

          <Card>
            <CardHeader>
              <CardTitle>
                Select Layouts ({selectedLayouts.length} selected)
                <br />
                <span className="font-normal text-sm">
                  Showing {filteredLayouts.length} of {allLayouts.length} layouts
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredLayouts.map((layout) => {
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
                          
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Created {formatShortDate(layout.created_at)}
                            </p>
                            {layout.layout_metadata?.type_of_page && (
                              <Badge variant="secondary" className="text-xs">
                                {layout.layout_metadata.type_of_page}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredLayouts.length === 0 && layoutFilters.search && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No layouts match your search criteria</p>
                  <Button variant="outline" onClick={() => setLayoutFilters({ search: '', type: '', dateRange: '' })}>
                    Clear Filters
                  </Button>
                </div>
              )}

              {allLayouts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No layouts available</p>
                  <p className="text-sm text-muted-foreground">Contact your administrator to generate layouts first.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
