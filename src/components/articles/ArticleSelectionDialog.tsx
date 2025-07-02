import { useState } from "react";
import { ArticleWithLayout } from "@/types/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Images, FileText, Calendar, User, Tag, Sparkles } from "lucide-react";
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
      <DialogContent className="max-w-6xl max-h-[85vh]">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            AI-Curated Layout Suggestions
          </DialogTitle>
          <p className="text-muted-foreground">Choose a layout that AI will intelligently adapt to your content</p>
        </DialogHeader>
        
        <ScrollArea className="h-[600px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">AI is crafting personalized layouts...</div>
            </div>
          ) : articles.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">AI couldn't find suitable layouts for your vision</div>
            </div>
          ) : (
            <div className="grid gap-6">
              {articles.map((article) => (
                <Card
                  key={article.article_id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                    selectedArticleId === article.article_id
                      ? 'ring-2 ring-primary shadow-lg bg-primary/5'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedArticleId(article.article_id)}
                >
                  <CardContent className="p-0">
                    {/* Layout Preview Section - Prominent */}
                    <div className="relative">
                      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-t-lg">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold text-primary">AI Layout Preview</span>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex gap-2 overflow-x-auto">
                              {article.layout_pages
                                .sort((a, b) => a.page - b.page)
                                .map((layoutPage, index) => (
                                <div
                                  key={`${layoutPage.page}-${index}`}
                                  className="flex-shrink-0 relative"
                                  style={{ 
                                    width: `${Math.max(150, 500 / article.layout_pages.length)}px`,
                                    minWidth: '120px'
                                  }}
                                >
                                  {layoutPage.layout?.bounding_box_image ? (
                                    <div className="space-y-2">
                                      <div className="relative group">
                                        <img
                                          src={formatImageUrl(layoutPage.layout.bounding_box_image) || ''}
                                          alt={`Page ${layoutPage.page} layout`}
                                          className="w-full h-32 object-cover rounded-lg border-2 border-border shadow-sm group-hover:border-primary/50 transition-colors"
                                        />
                                        <div className="absolute inset-0 bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                      <div className="text-xs text-center font-medium bg-muted/80 rounded px-2 py-1">
                                        Page {layoutPage.page}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="w-full h-32 bg-muted rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                        <div className="text-xs text-muted-foreground font-medium">
                                          Page {layoutPage.page}
                                        </div>
                                      </div>
                                      <div className="text-xs text-center font-medium bg-muted/80 rounded px-2 py-1">
                                        Page {layoutPage.page}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            {article.layout_pages.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground text-sm">
                                <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-2 flex items-center justify-center">
                                  <Images className="w-6 h-6" />
                                </div>
                                No layout preview available
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Selection indicator */}
                      {selectedArticleId === article.article_id && (
                        <div className="absolute top-3 right-3">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="p-6 space-y-4">
                      {/* Title and Category */}
                      <div className="space-y-3">
                        <h3 className="font-bold text-lg leading-tight line-clamp-2">
                          {article.article_title}
                        </h3>
                        
                        {/* Metadata Tags */}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                            <Tag className="w-3 h-3 mr-1" />
                            {article.article_category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {article.magazine_name}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {article.page_count} Pages
                          </Badge>
                          {article.approximate_number_of_words && (
                            <Badge variant="outline" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {article.approximate_number_of_words.toLocaleString()} words
                            </Badge>
                          )}
                          {article.number_of_images && (
                            <Badge variant="outline" className="text-xs">
                              <Images className="w-3 h-3 mr-1" />
                              {article.number_of_images} images
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {article.created_by || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(article.created_at).toLocaleDateString()}
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
            Adapt This Layout with AI
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}