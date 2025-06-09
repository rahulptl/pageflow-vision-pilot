
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";

export function LayoutBrowser() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [filterBy, setFilterBy] = useState("all");

  const layouts = [
    {
      id: "layout-001",
      name: "Magazine Cover - June",
      creator: "Sarah Johnson",
      created_at: "2024-06-08T10:30:00Z",
      merge_level: 2,
      page_no: 1,
      thumbnail: `https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop`,
      status: "completed"
    },
    {
      id: "layout-002", 
      name: "Product Catalog Page",
      creator: "Mike Chen",
      created_at: "2024-06-08T08:15:00Z",
      merge_level: 3,
      page_no: 2,
      thumbnail: `https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop`,
      status: "completed"
    },
    {
      id: "layout-003",
      name: "Newsletter Template",
      creator: "Emma Davis", 
      created_at: "2024-06-08T06:45:00Z",
      merge_level: 1,
      page_no: 1,
      thumbnail: `https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop`,
      status: "processing"
    },
    {
      id: "layout-004",
      name: "Event Flyer Layout",
      creator: "Tom Wilson",
      created_at: "2024-06-07T16:20:00Z",
      merge_level: 2,
      page_no: 1,
      thumbnail: `https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=300&fit=crop`,
      status: "completed"
    },
    {
      id: "layout-005",
      name: "Book Chapter Design",
      creator: "Lisa Park",
      created_at: "2024-06-07T14:10:00Z",
      merge_level: 4,
      page_no: 3,
      thumbnail: `https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop`,
      status: "completed"
    },
    {
      id: "layout-006",
      name: "Business Card Template",
      creator: "Alex Rivera",
      created_at: "2024-06-07T11:30:00Z",
      merge_level: 1,
      page_no: 1,
      thumbnail: `https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop`,
      status: "completed"
    }
  ];

  const filteredLayouts = layouts.filter(layout => {
    const matchesSearch = layout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         layout.creator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterBy === "all" || layout.status === filterBy;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
            <SelectItem value="name">Name</SelectItem>
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
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredLayouts.map((layout) => (
          <Link key={layout.id} to={`/layouts/${layout.id}`}>
            <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
                <img
                  src={layout.thumbnail}
                  alt={layout.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                      {layout.name}
                    </h3>
                    <Badge variant={
                      layout.status === 'completed' ? 'default' :
                      layout.status === 'processing' ? 'secondary' : 'destructive'
                    } className="text-xs">
                      {layout.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span className="truncate">{layout.creator}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(layout.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Page {layout.page_no}</span>
                    <span className="bg-muted px-2 py-1 rounded text-muted-foreground">
                      Level {layout.merge_level}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredLayouts.length === 0 && (
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
