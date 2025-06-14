
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { ArticleHeader } from "./ArticleHeader";
import { ArticleInfo } from "./ArticleInfo";
import { LayoutPageDisplay } from "./LayoutPageDisplay";

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
      const layoutPromises = article.layout_pages.map(layoutPage => 
        apiService.getLayout(layoutPage.layout_id)
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
      <ArticleHeader article={article} />
      <ArticleInfo article={article} />

      {/* Magazine Article Layout */}
      <Card>
        <CardHeader>
          <CardTitle>Magazine Article Layout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8 max-w-6xl mx-auto">
            {article.layout_pages
              .sort((a, b) => a.page - b.page)
              .map((layoutPage) => {
                const layout = layouts.find(l => l.layout_id === layoutPage.layout_id);
                if (!layout) return null;
                
                return (
                  <LayoutPageDisplay
                    key={layout.layout_id}
                    layoutPage={layoutPage}
                    layout={layout}
                  />
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
