import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, User, FileText, MoreVertical, Edit, Trash2, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Article } from "@/types/api";
import { formatShortDate, formatUser } from "@/utils/formatters";

interface ArticleCardProps {
  article: Article;
  onDelete?: (article: Article) => void;
  basePath?: string;
}

export function ArticleCard({ article, onDelete, basePath = '/admin' }: ArticleCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/30">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with Actions */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <Link to={`${basePath}/articles/${article.article_id}`}>
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2 cursor-pointer">
                  {article.article_title}
                </h3>
              </Link>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Badge variant="secondary" className="text-xs">
                {article.page_count} pages
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to={`${basePath}/articles/${article.article_id}`} className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(article)}
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Article
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Article Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="truncate">{formatUser(article.created_by)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatShortDate(article.created_at)}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <FileText className="w-3 h-3" />
                <span>{article.layout_pages.length} layouts</span>
              </div>
              <Link to={`${basePath}/articles/${article.article_id}`}>
                <Button variant="ghost" size="sm" className="text-xs">
                  View Article →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}