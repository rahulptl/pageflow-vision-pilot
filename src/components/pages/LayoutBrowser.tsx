import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Calendar, User, Plus, SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { formatShortDate, formatUser, formatImageUrl } from "@/utils/formatters";
import { EditLayoutDialog } from "@/components/layout/EditLayoutDialog";

export function LayoutBrowser() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [quickFilter, setQuickFilter] = useState("all");

  const skip = (currentPage - 1) * itemsPerPage;

  // Check if active search term is a valid layout ID (number)
  const isLayoutIdSearch = /^\d+$/.test(activeSearchTerm.trim());
  const layoutId = isLayoutIdSearch ? parseInt(activeSearchTerm.trim()) : null;

  // Query for specific layout by ID
  const { data: specificLayout, isLoading: isLoadingSpecific, error: specificLayoutError } = useQuery({
    queryKey: ['layout', layoutId],
    queryFn: () => apiService.getLayout(layoutId!),
    enabled: isLayoutIdSearch && layoutId !== null && activeSearchTerm.length > 0,
    retry: false, // Don't retry on 404
  });

  // Query for paginated layouts
  const { data: layouts = [], isLoading: isLoadingLayouts, error } = useQuery({
    queryKey: ['layouts', skip, itemsPerPage, sortBy],
    queryFn: () => apiService.getLayouts(skip, itemsPerPage),
    enabled: !isLayoutIdSearch || activeSearchTerm.length === 0,
  });

  const isLoading = isLoadingLayouts || isLoadingSpecific;

  // Handle manual search
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  // Handle clearing search
  const handleClearSearch = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setCurrentPage(1);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Determine which layouts to display
  const allLayouts = isLayoutIdSearch && specificLayout ? [specificLayout] : layouts;

  // Apply quick filters
  const quickFilteredLayouts = allLayouts.filter(layout => {
    switch (quickFilter) {
      case "recent":
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(layout.created_at) >= oneWeekAgo;
      case "two_pager":
        return layout.layout_metadata?.type_of_page === "2 pager";
      case "one_pager":
        return layout.layout_metadata?.type_of_page === "1 pager";
      case "high_confidence":
        return (layout.layout_json?.extraction_confidence || 0) > 0.8;
      default:
        return true;
    }
  });

  // Sort layouts (only if not searching by specific ID)
  const sortedLayouts = isLayoutIdSearch ? quickFilteredLayouts : [...quickFilteredLayouts].sort((a, b) => {
    switch (sortBy) {
      case "created_at":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "layout_id":
        return b.layout_id - a.layout_id;
      case "creator":
        return formatUser(a.created_by).localeCompare(formatUser(b.created_by));
      case "merge_level":
        const aMerge = a.layout_json?.merge_level || 2;
        const bMerge = b.layout_json?.merge_level || 2;
        return bMerge - aMerge;
      case "confidence":
        const aConf = a.layout_json?.extraction_confidence || 0;
        const bConf = b.layout_json?.extraction_confidence || 0;
        return bConf - aConf;
      default:
        return 0;
    }
  });

  const hasNextPage = !isLayoutIdSearch && layouts.length === itemsPerPage;
  const hasPrevPage = !isLayoutIdSearch && currentPage > 1;

  if (isLoading) {
    return (
      <div className="content-container py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-muted rounded-lg w-1/3"></div>
          <div className="flex gap-4">
            <div className="h-10 bg-muted rounded-lg flex-1 max-w-md"></div>
            <div className="h-10 bg-muted rounded-lg w-32"></div>
            <div className="h-10 bg-muted rounded-lg w-32"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-container py-8">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Failed to load layouts</h3>
          <p className="text-muted-foreground mb-6">There was an error connecting to the server</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="page-header">
          <h1 className="page-title">All Layouts</h1>
          <p className="page-description">Browse and manage your layout collection ({layouts.length} total)</p>
        </div>
        <Link to="/admin/generate">
          <Button size="lg" className="gap-2 shadow-lg">
            <Plus className="w-5 h-5" />
            Generate New
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex flex-1 max-w-md gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Enter Layout ID or search term..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-11"
                />
              </div>
              <Button onClick={handleSearch} className="h-11 px-4">
                Search
              </Button>
              {activeSearchTerm && (
                <Button variant="outline" onClick={handleClearSearch} size="sm" className="h-11 px-3">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Select value={sortBy} onValueChange={(value) => {
                setSortBy(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-48 h-11">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Newest First</SelectItem>
                  <SelectItem value="layout_id">Layout ID</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="merge_level">Merge Level</SelectItem>
                  <SelectItem value="confidence">Confidence</SelectItem>
                </SelectContent>
              </Select>

              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-40 h-11">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Per Page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 per page</SelectItem>
                  <SelectItem value="12">12 per page</SelectItem>
                  <SelectItem value="24">24 per page</SelectItem>
                  <SelectItem value="48">48 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={quickFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setQuickFilter("all")}
            >
              All Layouts
            </Button>
            <Button
              variant={quickFilter === "recent" ? "default" : "outline"}
              size="sm"
              onClick={() => setQuickFilter("recent")}
            >
              Recent (7 days)
            </Button>
            <Button
              variant={quickFilter === "two_pager" ? "default" : "outline"}
              size="sm"
              onClick={() => setQuickFilter("two_pager")}
            >
              Two Pager
            </Button>
            <Button
              variant={quickFilter === "one_pager" ? "default" : "outline"}
              size="sm"
              onClick={() => setQuickFilter("one_pager")}
            >
              One Pager
            </Button>
            <Button
              variant={quickFilter === "high_confidence" ? "default" : "outline"}
              size="sm"
              onClick={() => setQuickFilter("high_confidence")}
            >
              High Confidence
            </Button>
          </div>
        </div>
      </Card>

      {/* Search Not Found State */}
      {isLayoutIdSearch && activeSearchTerm && specificLayoutError && (
        <Card className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Layout Not Found</h3>
            <p className="text-muted-foreground mb-4">
              Layout ID "{activeSearchTerm}" could not be found.
            </p>
            <Button variant="outline" onClick={handleClearSearch}>
              Clear Search
            </Button>
          </div>
        </Card>
      )}

      {/* Layout Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedLayouts.map((layout) => (
          <Link key={layout.layout_id} to={`/admin/layouts/${layout.layout_id}`}>
            <Card className="group card-hover overflow-hidden cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                {layout.bounding_box_image ? (
                  <img
                    src={formatImageUrl(layout.bounding_box_image) || ''}
                    alt={`Layout #${layout.layout_id}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      Layout #{layout.layout_id}
                    </h3>
                    {layout.layout_metadata?.type_of_page && (
                      <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                        {layout.layout_metadata.type_of_page}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{formatShortDate(layout.created_at)}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <div className="flex-1">
                      <div className="w-full h-9 bg-muted/50 rounded-md flex items-center justify-center text-sm text-muted-foreground">
                        Click to view details
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <EditLayoutDialog layout={layout} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pagination Controls */}
      {layouts.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {skip + 1}-{Math.min(skip + layouts.length, skip + itemsPerPage)} of page {currentPage}
              {sortedLayouts.length !== layouts.length && ` (${sortedLayouts.length} filtered)`}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!hasPrevPage}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="text-sm text-muted-foreground px-4">
                Page {currentPage}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!hasNextPage}
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {sortedLayouts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No layouts found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {searchTerm ? 
              "Try adjusting your search terms or filters to find what you're looking for." :
              "Get started by generating your first layout from a PDF document."
            }
          </p>
          <Link to="/admin/generate">
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Generate Your First Layout
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
