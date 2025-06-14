
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, FileText } from "lucide-react";
import { Article } from "@/types/api";

interface ArticleHeaderProps {
  article: Article;
}

export function ArticleHeader({ article }: ArticleHeaderProps) {
  return (
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
  );
}
