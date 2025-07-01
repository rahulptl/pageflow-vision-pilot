import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Calendar, User, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { formatShortDate, formatUser } from "@/utils/formatters";

export function Articles() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: articles = [], isLoading, error } = useQuery({
    queryKey: ['articles'],
    queryFn: () => apiService.getArticles(),
  });

  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="content-container py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-muted rounded-lg w-1/3"></div>
          <div className="flex gap-4">
            <div className="h-10 bg-muted rounded-lg flex-1 max-w-md"></div>
            <div className="h-10 bg-muted rounded-lg w-32"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-xl"></div>
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
            <FileText className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Failed to load articles</h3>
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
          <h1 className="page-title">Articles</h1>
          <p className="page-description">Manage your stitched layout collections ({articles.length} total)</p>
        </div>
        <Link to="/user/articles/create">
          <Button size="lg" className="gap-2 shadow-lg">
            <Plus className="w-5 h-5" />
            Create Article
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <Card className="p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </Card>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <Link key={article.article_id} to={`/user/articles/${article.article_id}`}>
            <Card className="group card-hover cursor-pointer overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2 text-lg">
                      {article.title}
                    </h3>
                    <Badge variant="default" className="text-xs shrink-0 ml-2">
                      {article.page_count} pages
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span className="truncate">{formatUser(article.created_by)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatShortDate(article.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">
                      {article.layout_pages.length} layouts stitched
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {filteredArticles.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No articles found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {searchTerm ? 
              "Try adjusting your search terms to find what you're looking for." :
              "Get started by creating your first article from existing layouts."
            }
          </p>
          <Link to="/user/articles/create">
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Create Your First Article
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
