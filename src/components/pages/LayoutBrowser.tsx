
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { formatShortDate, formatUser, formatBase64Image } from "@/utils/formatters";

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
    
    // For now, we don't have status in Layout, so we'll just filter by "all"
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
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load layouts</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Layouts</h1>
          <p className="text-muted-foreground">Browse and manage your layout collection</p>
        </div>
        <Link to="/generate">
          <Button>Generate New Layout</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search layouts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Date Created</SelectItem>
            <SelectItem value="layout_id">Layout ID</SelectItem>
            <SelectItem value="creator">Creator</SelectItem>
            <SelectItem value="merge_level">Merge Level</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Layouts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedLayouts.map((layout) => (
          <Link key={layout.layout_id} to={`/layouts/${layout.layout_id}`}>
            <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden rounded-t-lg bg-muted">
                {layout.bounding_box_image ? (
                  <img
                    src={formatBase64Image(layout.bounding_box_image) || ''}
                    alt={`Layout #${layout.layout_id}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                      Layout #{layout.layout_id}
                    </h3>
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span className="truncate">{formatUser(layout.created_by)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{formatShortDate(layout.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Page {layout.layout_json?.page_number || 1}
                    </span>
                    <span className="bg-muted px-2 py-1 rounded text-muted-foreground">
                      Level {layout.layout_json?.merge_level || 2}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {sortedLayouts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No layouts found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
          <Link to="/generate">
            <Button>Generate Your First Layout</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
