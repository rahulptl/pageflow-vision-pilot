import { useState } from "react";
import { ArticleWithLayout } from "@/types/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Images, FileText, Calendar, User } from "lucide-react";
import { formatImageUrl } from "@/utils/formatters";

interface ArticleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articles: ArticleWithLayout[];
  onSelectArticle: (article: ArticleWithLayout) => void;
  isLoading?: boolean;
}

export function ArticleSelectionDialog({
  open,
  onOpenChange,
  articles,
  onSelectArticle,
  isLoading
}: ArticleSelectionDialogProps) {
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);

  const handleSelect = () => {
    const selectedArticle = articles.find(a => a.article_id === selectedArticleId);
    if (selectedArticle) {
      onSelectArticle(selectedArticle);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select an Article</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading articles...</div>
            </div>
          ) : articles.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">No articles found matching your criteria</div>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <Card
                  key={article.article_id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedArticleId === article.article_id
                      ? 'ring-2 ring-primary bg-muted/50'
                      : ''
                  }`}
                  onClick={() => setSelectedArticleId(article.article_id)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Article Preview */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg line-clamp-2">
                            {article.title}
                          </h3>
                          <Badge variant="secondary" className="ml-2">
                            {article.article_category}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {article.approximate_number_of_words} words
                          </div>
                          <div className="flex items-center gap-1">
                            <Images className="w-4 h-4" />
                            {article.number_of_images} images
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {article.created_by}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(article.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-3">
                          Magazine: {article.magazine_name} • {article.page_count} pages
                        </p>
                      </div>

                      {/* Layout Preview - Show horizontal stitched bounding box images */}
                      <div className="w-48 h-32 flex-shrink-0">
                        <div className="flex gap-1 h-full overflow-x-auto">
                          {article.layout_pages.map((layoutPage, index) => (
                            <div
                              key={index}
                              className="flex-shrink-0 h-full"
                              style={{ width: `${100 / article.layout_pages.length}%` }}
                            >
                              {layoutPage.layout?.bounding_box_image ? (
                                <img
                                  src={formatImageUrl(layoutPage.layout.bounding_box_image) || ''}
                                  alt={`Page ${layoutPage.page} layout`}
                                  className="w-full h-full object-cover rounded border"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted rounded border flex items-center justify-center text-xs">
                                  P{layoutPage.page}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSelect} 
            disabled={!selectedArticleId}
          >
            Use Selected Article
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}