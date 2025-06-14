import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, FileText, Calendar, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { formatDate, formatUser, formatImageUrl } from "@/utils/formatters";

export function ArticleDetails() {
  const { id } = useParams();

  const { data: article, isLoading: articleLoading, error: articleError } = useQuery({
    queryKey: ['article', id],
    queryFn: () => apiService.getArticle(Number(id)),
    enabled: !!id,
  });

  const { data: layouts = [], isLoading: layoutsLoading } = useQuery({
    queryKey: ['layouts-for-article', article?.layout_pages],
    queryFn: async () => {
      if (!article?.layout_pages) return [];
      const layoutPromises = article.layout_pages.map(layoutId => 
        apiService.getLayout(layoutId)
      );
      return Promise.all(layoutPromises);
    },
    enabled: !!article?.layout_pages,
  });

  const isLoading = articleLoading || layoutsLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (articleError || !article) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load article</p>
          <Link to="/articles">
            <Button>Back to Articles</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/articles">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Articles
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{article.title}</h1>
            <p className="text-muted-foreground">Article ID: {article.article_id}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <FileText className="w-3 h-3" />
            {article.page_count} pages
          </Badge>
          <Button size="sm" className="gap-2">
            <Edit className="w-4 h-4" />
            Edit Article
          </Button>
        </div>
      </div>

      {/* Article Info */}
      <Card>
        <CardHeader>
          <CardTitle>Article Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Creator</label>
              <p className="text-sm font-medium">{formatUser(article.created_by)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="text-sm font-medium">{formatDate(article.created_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Updated</label>
              <p className="text-sm font-medium">{formatDate(article.updated_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Layouts Count</label>
              <p className="text-sm font-medium">{article.layout_pages.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stitched Layouts */}
      <Card>
        <CardHeader>
          <CardTitle>Stitched Layouts (Page Order)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {layouts.map((layout, index) => (
              <div key={layout.layout_id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      Page {index + 1}
                    </Badge>
                    <h3 className="font-medium">Layout #{layout.layout_id}</h3>
                  </div>
                  <Link to={`/layouts/${layout.layout_id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Original Image */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Original Page</h4>
                    <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden border">
                      {layout.page_image ? (
                        <img
                          src={formatImageUrl(layout.page_image) || ''}
                          alt={`Layout ${layout.layout_id} original`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-muted-foreground text-sm">No image available</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Bounding Box Image */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Layout Detection</h4>
                    <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden border">
                      {layout.bounding_box_image ? (
                        <img
                          src={formatImageUrl(layout.bounding_box_image) || ''}
                          alt={`Layout ${layout.layout_id} bounding boxes`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-muted-foreground text-sm">No detection image available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{formatUser(layout.created_by)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(layout.created_at)}</span>
                  </div>
                  <div>
                    Page {layout.layout_json?.page_number || 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
