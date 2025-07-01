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

  // Helper to get layout by ID
  const getLayoutById = (layoutId: number) => layouts.find(l => l.layout_id === layoutId);

  // Compute spans and pretty labels
  let currentPage = 1;
  const layoutPageLabels: { key: number, label: string, layoutPage: any, layout: any }[] = [];
  if (article && article.layout_pages && layouts.length) {
    article.layout_pages.forEach((layoutPage) => {
      const layout = getLayoutById(layoutPage.layout_id);
      if (!layout) return;
      const pageType = layout.layout_metadata?.type_of_layout === "two_pager" ? "two_pager" : "one_pager";
      const span = pageType === "two_pager" ? 2 : 1;
      const from = currentPage;
      const to = currentPage + span - 1;
      let label = "";
      if (span === 2) {
        label = `Pages ${from}-${to}`;
      } else {
        label = `Page ${from}`;
      }
      layoutPageLabels.push({ key: layout.layout_id, label, layoutPage, layout });
      currentPage += span;
    });
  }

  // Calculate actual total pages ("page_count" in DB may become outdated)
  const totalPages = layoutPageLabels.length
    ? (layoutPageLabels[layoutPageLabels.length - 1].label.match(/\d+$/)
        ? Number(layoutPageLabels[layoutPageLabels.length - 1].label.match(/\d+$/)![0])
        : 0)
    : 0;

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
      {/* Pass correct page count for display */}
      <ArticleHeader article={{ ...article, page_count: totalPages }} />

      <ArticleInfo article={{ ...article, page_count: totalPages }} />

      {/* Magazine Article Layout */}
      <Card>
        <CardHeader>
          <CardTitle>Magazine Article Layout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8 max-w-6xl mx-auto">
            {layoutPageLabels.map(({ key, layoutPage, layout }) => (
              <div key={key}>
                <LayoutPageDisplay
                  layoutPage={layoutPage}
                  layout={layout}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
