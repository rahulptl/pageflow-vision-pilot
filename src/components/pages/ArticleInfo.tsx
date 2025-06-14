
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Article } from "@/types/api";
import { formatDate, formatUser } from "@/utils/formatters";

interface ArticleInfoProps {
  article: Article;
}

export function ArticleInfo({ article }: ArticleInfoProps) {
  return (
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
  );
}
