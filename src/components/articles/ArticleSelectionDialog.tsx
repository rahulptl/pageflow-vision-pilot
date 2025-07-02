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
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Article Metadata - Formatted at the top */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-bold text-xl line-clamp-2 flex-1">
                            {article.article_title}
                          </h3>
                          <Badge variant="secondary" className="ml-3 text-sm font-medium">
                            {article.article_category}
                          </Badge>
                        </div>
                        
                        {/* Magazine and Basic Info */}
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">Magazine:</span>
                            <span className="font-semibold text-primary">{article.magazine_name}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">Pages:</span>
                            <span className="font-semibold">{article.page_count}</span>
                          </div>
                        </div>
                        
                        {/* Detailed Stats */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Words:</span>
                            <span className="font-medium">{article.approximate_number_of_words?.toLocaleString() || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Images className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Images:</span>
                            <span className="font-medium">{article.number_of_images || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Created by:</span>
                            <span className="font-medium">{article.created_by || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-medium">{new Date(article.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Layout Preview - Stitched Bounding Box Images */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">Layout Preview:</h4>
                        <div className="border rounded-lg p-2 bg-background">
                          <div className="flex gap-1 overflow-x-auto">
                            {article.layout_pages
                              .sort((a, b) => a.page - b.page) // Ensure proper order
                              .map((layoutPage, index) => (
                              <div
                                key={`${layoutPage.page}-${index}`}
                                className="flex-shrink-0 relative"
                                style={{ 
                                  width: `${Math.max(120, 400 / article.layout_pages.length)}px`,
                                  minWidth: '80px'
                                }}
                              >
                                {layoutPage.layout?.bounding_box_image ? (
                                  <div className="space-y-1">
                                    <img
                                      src={formatImageUrl(layoutPage.layout.bounding_box_image) || ''}
                                      alt={`Page ${layoutPage.page} layout`}
                                      className="w-full h-24 object-cover rounded border shadow-sm"
                                    />
                                    <div className="text-xs text-center text-muted-foreground font-medium">
                                      Page {layoutPage.page}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <div className="w-full h-24 bg-muted rounded border flex items-center justify-center">
                                      <div className="text-xs text-muted-foreground font-medium">
                                        P{layoutPage.page}
                                      </div>
                                    </div>
                                    <div className="text-xs text-center text-muted-foreground font-medium">
                                      Page {layoutPage.page}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {article.layout_pages.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                              No layout data available
                            </div>
                          )}
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