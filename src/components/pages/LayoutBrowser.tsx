import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Calendar, User, Plus, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { formatShortDate, formatUser, formatImageUrl } from "@/utils/formatters";

export function LayoutBrowser() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [filterBy, setFilterBy] = useState("all");

  const { data: layouts = [], isLoading, error } = useQuery({
    queryKey: ['layouts'],
    queryFn: () => apiService.getLayouts(),
  });

  const filteredLayouts = layouts.filter(layout => {
    const layoutName = `Layout #${layout.layout_id}`;
    const creator = formatUser(layout.created_by);
    const matchesSearch = layoutName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterBy === "all";
    return matchesSearch && matchesFilter;
  });

  // Sort layouts
  const sortedLayouts = [...filteredLayouts].sort((a, b) => {
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
      default:
        return 0;
    }
  });

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
        <Link to="/generate">
          <Button size="lg" className="gap-2 shadow-lg">
            <Plus className="w-5 h-5" />
            Generate New
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search layouts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 h-11">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Newest First</SelectItem>
                <SelectItem value="layout_id">Layout ID</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="merge_level">Merge Level</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-40 h-11">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Layouts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedLayouts.map((layout) => (
          <Link key={layout.layout_id} to={`/layouts/${layout.layout_id}`}>
            <Card className="group card-hover cursor-pointer overflow-hidden">
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
                    <Badge variant="default" className="text-xs shrink-0 ml-2">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span className="truncate">{formatUser(layout.created_by)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{formatShortDate(layout.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">
                      Page {layout.layout_json?.page_number || 1}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Level {layout.layout_json?.merge_level || 2}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

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
          <Link to="/generate">
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
