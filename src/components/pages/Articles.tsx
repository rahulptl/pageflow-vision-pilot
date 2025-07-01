
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Grid, List } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService, ArticleSearchParams } from "@/services/api";
import { Article } from "@/types/api";
import { toast } from "sonner";
import { ArticleSearch } from "@/components/articles/ArticleSearch";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { DeleteArticleDialog } from "@/components/articles/DeleteArticleDialog";

export function Articles() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState<ArticleSearchParams>({});
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteArticle, setDeleteArticle] = useState<Article | null>(null);

  // Fetch articles based on search params
  const { data: articles = [], isLoading, error } = useQuery({
    queryKey: ['articles', searchParams],
    queryFn: () => {
      const hasSearchParams = Object.values(searchParams).some(value => 
        value !== undefined && value !== null && value !== ''
      );
      
      if (hasSearchParams) {
        return apiService.searchArticles(searchParams);
      }
      return apiService.getArticles();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (articleId: number) => apiService.deleteArticle(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success("Article deleted successfully");
      setDeleteArticle(null);
    },
    onError: () => {
      toast.error("Failed to delete article");
    },
  });

  const handleSearch = (params: ArticleSearchParams) => {
    setIsSearching(true);
    setSearchParams(params);
    // Reset searching state after a brief delay
    setTimeout(() => setIsSearching(false), 500);
  };

  const handleClearSearch = () => {
    setSearchParams({});
  };

  const handleEdit = (article: Article) => {
    // For now, just navigate to view page - edit functionality can be added later
    window.open(`/user/articles/${article.article_id}`, '_blank');
  };

  const handleDelete = (articleId: number) => {
    const article = articles.find(a => a.article_id === articleId);
    if (article) {
      setDeleteArticle(article);
    }
  };

  const hasActiveSearch = Object.values(searchParams).some(value => 
    value !== undefined && value !== null && value !== ''
  );

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
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="page-header">
          <h1 className="page-title">Articles</h1>
          <p className="page-description">
            Manage your magazine articles
            {hasActiveSearch && (
              <span className="text-primary font-medium"> • {articles.length} results found</span>
            )}
            {!hasActiveSearch && (
              <span> • {articles.length} total articles</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Link to="/user/articles/create">
            <Button size="lg" className="gap-2 shadow-lg">
              <Plus className="w-5 h-5" />
              Create Article
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Section */}
      <ArticleSearch 
        onSearch={handleSearch}
        onClear={handleClearSearch}
        isLoading={isSearching}
      />

      {/* Loading State */}
      {(isLoading || isSearching) && (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      )}

      {/* Articles Grid/List */}
      {!isLoading && !isSearching && (
        <>
          {articles.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {articles.map((article) => (
                <ArticleCard
                  key={article.article_id}
                  article={article}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {hasActiveSearch ? 'No articles found' : 'No articles yet'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {hasActiveSearch ? 
                  "Try adjusting your search criteria to find what you're looking for." :
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
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteArticleDialog
        article={deleteArticle}
        isOpen={!!deleteArticle}
        onClose={() => setDeleteArticle(null)}
        onConfirm={() => deleteArticle && deleteMutation.mutate(deleteArticle.article_id)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
