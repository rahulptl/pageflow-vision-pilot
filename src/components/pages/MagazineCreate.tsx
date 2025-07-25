import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Upload, Edit, ArrowRight, Check, Plus, FolderOpen, Calendar, FileText, Save, ExternalLink, Download, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiService } from "@/services/api";
import { Layout, ArticleRecommendationResponse, Article, RecommendationResponse } from "@/types/api";
import { toast } from "sonner";
import { MagazineStoryboard } from "@/components/MagazineStoryboard";
import { LayoutEditor } from "@/components/LayoutEditor";
import { createPagesFromArticle, updateArticleFromPages } from "@/utils/articleHelpers";
import { VivaLayoutStatus } from "@/types/magazine";
import { VivaLayoutTracker } from "@/components/VivaLayoutTracker";
interface MagazineFormData {
  articleName: string;
  magazineTitle: string;
  magazineCategory: string;
  pageCount: number;
}
interface SavedMagazine {
  id: string;
  articleName: string;
  magazineTitle: string;
  magazineCategory: string;
  pageCount: number;
  progress: number;
  lastModified: string;
  pagePlan: PagePlan[];
}
interface PagePlan {
  pageNumber: number;
  typeOfPage: string;
  layoutId: number;
  layout?: Layout;
  layoutJson?: any;
  isCompleted: boolean;
  xmlUploaded: boolean;
  pageUid: string;
  boundingBoxImage?: string;
  createdAt: string;
  updatedAt: string;
  vivaDocumentName?: string; // Track document name in VIVA
  vivaStatus?: VivaLayoutStatus;
}
export function MagazineCreatePage() {
  const [step, setStep] = useState<'workspace' | 'form' | 'storyboard' | 'editing'>('workspace');
  const [formData, setFormData] = useState<MagazineFormData>({
    articleName: '',
    magazineTitle: '',
    magazineCategory: '',
    pageCount: 1
  });
  const [article, setArticle] = useState<(ArticleRecommendationResponse & { article_id?: number }) | Article | null>(null);
  const [pagePlan, setPagePlan] = useState<PagePlan[]>([]);
  const [editingPage, setEditingPage] = useState<PagePlan | null>(null);
  const [activeTab, setActiveTab] = useState('storyboard');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalLayoutOrder, setOriginalLayoutOrder] = useState<number[]>([]);
  const [currentRank, setCurrentRank] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSwapRecommending, setIsSwapRecommending] = useState(false);

  // Fetch articles for dropdown options
  const { data: allArticles = [] } = useQuery({
    queryKey: ['articles-for-dropdowns'],
    queryFn: () => apiService.getArticles(),
  });

  // Extract unique magazine titles and categories
  const uniqueMagazineTitles = [...new Set(allArticles.map(article => article.magazine_title).filter(Boolean))];
  const uniqueMagazineCategories = [...new Set(allArticles.map(article => article.magazine_category).filter(Boolean))];

  // Get layout recommendations
  const getRecommendationsMutation = useMutation({
    mutationFn: ({ rank = 0, articleId }: { rank?: number; articleId?: number } = {}) => {
      console.log("🔥 CALLING getLayoutRecommendations with:");
      console.log("  magazineTitle:", formData.magazineTitle);
      console.log("  magazineCategory:", formData.magazineCategory);
      console.log("  pageCount:", formData.pageCount);
      console.log("  articleName:", formData.articleName);
      console.log("  rank:", rank);
      console.log("  articleId:", articleId);
      
      return apiService.getLayoutRecommendations(
        formData.magazineTitle, 
        formData.magazineCategory, 
        formData.pageCount,
        formData.articleName,
        undefined, // createdBy
        rank,
        articleId
      );
    },
    onSuccess: async (recommendationData: RecommendationResponse) => {
      console.log("✅ Recommendation API Success:", recommendationData);
      const articleData = recommendationData.article;
      setArticle(articleData);
      setCurrentRank(recommendationData.rank);
      setIsSwapRecommending(false);

      // Check if we have the new article structure with article_json array
      if (!articleData.article_json || !Array.isArray(articleData.article_json)) {
        console.error("❌ Invalid article structure - missing or invalid article_json");
        toast.error('Invalid article structure received from API');
        return;
      }

      console.log("🔄 Using article_json data directly:", articleData.article_json);
      
      // Create mock layout objects from article_json data (same as draft article handling)
      const layouts = articleData.article_json.map(pageData => ({
        layout_id: pageData.layout_id,
        layout_metadata: {
          type_of_page: pageData.type_of_page
        },
        layout_json: pageData.layout_json,
        page_image: null,
        bounding_box_image: pageData.bounding_box_image,
        created_by: null,
        updated_by: null,
        created_at: pageData.created_at,
        updated_at: pageData.updated_at
      }));
      
      console.log("🏗️ Creating pages from article data directly");
      const pages = createPagesFromArticle(articleData, layouts);
      console.log("🏗️ Created pages:", pages);
      
      setPagePlan(pages);
      // Extract layout order from article_json
      const layoutOrder = articleData.article_json.map(pageData => pageData.layout_id);
      setOriginalLayoutOrder([...layoutOrder]);
      setHasUnsavedChanges(false);
      console.log("🎯 Setting step to storyboard");
      setStep('storyboard');
      console.log("✅ Successfully transitioned to storyboard");
    },
    onError: (error) => {
      console.error("❌ Recommendation mutation error:", error);
      toast.error('Failed to get layout recommendations: ' + error.message);
      setIsRegenerating(false);
      setIsSwapRecommending(false);
    }
  });

  const handleRegenerateRecommendations = () => {
    const articleId = article && 'article_id' in article ? article.article_id : undefined;
    
    // Calculate current page count from pagePlan instead of using formData.pageCount
    const currentPageCount = pagePlan.reduce((total, page) => {
      return total + (page.typeOfPage === '2 pager' ? 2 : 1);
    }, 0);
    
    // Update formData with current page count
    setFormData(prev => ({ ...prev, pageCount: currentPageCount }));
    
    setIsRegenerating(true);
    getRecommendationsMutation.mutate({ rank: currentRank + 1, articleId });
  };

  // Get all articles
  const { data: articles = [] } = useQuery({
    queryKey: ['articles'],
    queryFn: () => apiService.getArticles(),
    enabled: step === 'workspace'
  });

  // Get all layouts for swapping
  const {
    data: allLayouts = []
  } = useQuery({
    queryKey: ['layouts-all'],
    queryFn: () => apiService.getLayouts(0, 1000),
    enabled: step === 'storyboard'
  });
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.articleName || !formData.magazineTitle || !formData.magazineCategory || formData.pageCount < 1) {
      toast.error('Please fill in all fields');
      return;
    }
    getRecommendationsMutation.mutate({});
  };
  const handleOpenArticle = async (article: any) => {
    try {
      console.log('Opening article:', article);
      
      // Fetch the full article details using the API
      const fullArticle = await apiService.getArticle(article.article_id);
      console.log('Full article from API:', fullArticle);
      
      setFormData({
        articleName: fullArticle.article_title,
        magazineTitle: fullArticle.magazine_title || '',
        magazineCategory: fullArticle.magazine_category || '',
        pageCount: fullArticle.page_count
      });

      // Set the article and create pages from it
      setArticle(fullArticle);
      
      console.log('Article layout_order:', fullArticle.layout_order);
      console.log('Article article_json:', fullArticle.article_json);
      
      // Infer layout_order from article_json if missing
      let layoutOrder = fullArticle.layout_order;
      if ((!layoutOrder || layoutOrder.length === 0) && Array.isArray(fullArticle.article_json) && fullArticle.article_json.length > 0) {
        console.log('Inferring layout_order from article_json');
        layoutOrder = fullArticle.article_json.map(page => page.layout_id);
        console.log('Inferred layout_order:', layoutOrder);
      }
      
      if (layoutOrder && layoutOrder.length > 0) {
        console.log('Article has layout_order, using article_json data...');
        
        // Check if article_json contains layout information
        if (Array.isArray(fullArticle.article_json) && fullArticle.article_json.length > 0) {
          console.log('Using layout information from article_json');
          
          // Create mock layout objects from article_json data
          const layouts = fullArticle.article_json.map(pageData => ({
            layout_id: pageData.layout_id,
            layout_metadata: {
              type_of_page: pageData.type_of_page
            },
            layout_json: pageData.layout_json,
            page_image: null,
            bounding_box_image: pageData.bounding_box_image,
            created_by: null,
            updated_by: null,
            created_at: pageData.created_at,
            updated_at: pageData.updated_at
          }));
          
          console.log('Created layouts from article_json:', layouts);
          
          // Create pages from the article data
          const pages = createPagesFromArticle(fullArticle, layouts);
          console.log('Created pages:', pages);
          
          setPagePlan(pages);
          setStep('storyboard');
        } else {
          // Fallback: fetch layout details if article_json doesn't have the data
          console.log('Article_json missing layout data, fetching from database...');
          const layoutDetailsPromises = layoutOrder.map(layoutId => 
            apiService.getLayout(layoutId)
          );
          
          const layouts = await Promise.all(layoutDetailsPromises);
          console.log('Fetched layouts from database:', layouts);
          
          // Create pages from the article data
          const pages = createPagesFromArticle(fullArticle, layouts);
          console.log('Created pages:', pages);
          
          setPagePlan(pages);
          setStep('storyboard');
        }
      } else {
        console.log('Article has no layout_order, going to form step');
        setStep('form');
      }
    } catch (error) {
      console.error('Error loading article:', error);
      toast.error('Failed to load article details');
    }
  };
  const handleCreateNew = () => {
    setFormData({
      articleName: '',
      magazineTitle: '',
      magazineCategory: '',
      pageCount: 1
    });
    setPagePlan([]);
    setArticle(null);
    setStep('form');
  };
  const handleSwapLayout = async (pageIndex: number, newLayoutId: number | number[]) => {
    setHasUnsavedChanges(true);
    
    // Calculate current total page count before swap
    const currentTotalPages = pagePlan.reduce((total, page) => {
      return total + (page.typeOfPage === '2 pager' ? 2 : 1);
    }, 0);
    
    try {
      // Fetch layout JSON for the new layout(s)
      const fetchLayoutJson = async (layoutId: number) => {
        try {
          const layoutDetails = await apiService.getLayout(layoutId);
          return layoutDetails.layout_json || {};
        } catch (error) {
          console.error(`Failed to fetch layout JSON for layout ${layoutId}:`, error);
          return {};
        }
      };

      setPagePlan(prev => {
        const newPlan = [...prev];
        const currentPage = newPlan[pageIndex];

        // If swapping a 2-pager with two 1-pagers
        if (Array.isArray(newLayoutId) && currentPage.typeOfPage === '2 pager') {
          const layout1 = allLayouts.find(l => l.layout_id === newLayoutId[0]);
          const layout2 = allLayouts.find(l => l.layout_id === newLayoutId[1]);
          if (!layout1 || !layout2) return prev;

          // Fetch layout JSON for both layouts
          Promise.all([
            fetchLayoutJson(newLayoutId[0]),
            fetchLayoutJson(newLayoutId[1])
          ]).then(([layoutJson1, layoutJson2]) => {
            setPagePlan(current => {
              const updated = [...current];
              // Update the first page
              if (updated[pageIndex]) {
                updated[pageIndex] = {
                  ...updated[pageIndex],
                  layoutJson: layoutJson1
                };
              }
              // Update the second page if it exists
              if (updated[pageIndex + 1] && updated[pageIndex + 1].layoutId === newLayoutId[1]) {
                updated[pageIndex + 1] = {
                  ...updated[pageIndex + 1],
                  layoutJson: layoutJson2
                };
              }
              return updated;
            });
          });

          // Replace current 2-pager with first 1-pager
          newPlan[pageIndex] = {
            ...currentPage,
            typeOfPage: '1 pager',
            layoutId: newLayoutId[0],
            layout: layout1,
            layoutJson: {}, // Will be updated by the Promise above
            boundingBoxImage: layout1.bounding_box_image || undefined,
            updatedAt: new Date().toISOString()
          };

          // Insert second 1-pager after current position
          const now = new Date().toISOString();
          const secondPage: PagePlan = {
            pageNumber: currentPage.pageNumber + 1,
            typeOfPage: '1 pager',
            layoutId: newLayoutId[1],
            layout: layout2,
            layoutJson: {}, // Will be updated by the Promise above
            isCompleted: false,
            xmlUploaded: false,
            pageUid: crypto.randomUUID(),
            boundingBoxImage: layout2.bounding_box_image || undefined,
            createdAt: now,
            updatedAt: now
          };
          newPlan.splice(pageIndex + 1, 0, secondPage);

          // Update page numbers for all subsequent pages
          for (let i = pageIndex + 2; i < newPlan.length; i++) {
            newPlan[i] = {
              ...newPlan[i],
              pageNumber: newPlan[i - 1].pageNumber + (newPlan[i - 1].typeOfPage === '2 pager' ? 2 : 1)
            };
          }
          return newPlan;
        }
        // If swapping a 1-pager with a 2-pager
        else if (!Array.isArray(newLayoutId) && currentPage.typeOfPage === '1 pager') {
          const newLayout = allLayouts.find(l => l.layout_id === newLayoutId);
          if (!newLayout) return prev;

          // Check if new layout is a 2-pager
          if (newLayout.layout_metadata?.type_of_page === '2 pager') {
            // Fetch layout JSON for the new layout
            fetchLayoutJson(newLayoutId).then(layoutJson => {
              setPagePlan(current => {
                const updated = [...current];
                if (updated[pageIndex]) {
                  updated[pageIndex] = {
                    ...updated[pageIndex],
                    layoutJson
                  };
                }
                return updated;
              });
            });

            // Replace current 1-pager with 2-pager
            newPlan[pageIndex] = {
              ...currentPage,
              typeOfPage: '2 pager',
              layoutId: newLayoutId,
              layout: newLayout,
              layoutJson: {}, // Will be updated by the Promise above
              boundingBoxImage: newLayout.bounding_box_image || undefined,
              updatedAt: new Date().toISOString()
            };

            // Update page numbers for all subsequent pages (shift by +1)
            for (let i = pageIndex + 1; i < newPlan.length; i++) {
              newPlan[i] = {
                ...newPlan[i],
                pageNumber: newPlan[i].pageNumber + 1
              };
            }
            return newPlan;
          }
        }

        // Regular single layout swap (same page type)
        {
          // Regular single layout swap
          const layoutId = Array.isArray(newLayoutId) ? newLayoutId[0] : newLayoutId;
          const newLayout = allLayouts.find(l => l.layout_id === layoutId);
          if (!newLayout) return prev;
          
          // Fetch layout JSON for the new layout
          fetchLayoutJson(layoutId).then(layoutJson => {
            setPagePlan(current => {
              const updated = [...current];
              if (updated[pageIndex]) {
                updated[pageIndex] = {
                  ...updated[pageIndex],
                  layoutJson
                };
              }
              return updated;
            });
          });

          return newPlan.map((page, index) => index === pageIndex ? {
            ...page,
            layoutId: layoutId,
            layout: newLayout,
            layoutJson: {}, // Will be updated by the Promise above
            boundingBoxImage: newLayout.bounding_box_image || undefined,
            updatedAt: new Date().toISOString()
          } : page);
        }
      });
      
      // Update article page_count after layout swap
      setTimeout(() => {
        setPagePlan(currentPages => {
          // Calculate new total page count
          const newTotalPages = currentPages.reduce((total, page) => {
            return total + (page.typeOfPage === '2 pager' ? 2 : 1);
          }, 0);
          
          // Check if page count has changed and trigger new recommendations
          if (newTotalPages !== currentTotalPages) {
            console.log(`📊 Page count changed from ${currentTotalPages} to ${newTotalPages}, fetching new recommendations...`);
            
            setIsSwapRecommending(true);
            toast.info(`Page count changed to ${newTotalPages}. Generating new recommendations...`);
            
            // Update form data page count first
            setFormData(prev => ({ ...prev, pageCount: newTotalPages }));
            
            // Trigger new recommendations with updated page count
            setTimeout(() => {
              const articleId = article && 'article_id' in article ? article.article_id : undefined;
              getRecommendationsMutation.mutate({ 
                rank: 1, // Start fresh with rank 1 when page count changes
                articleId 
              });
            }, 100);
          }
          
          // Update article with new page count
          setArticle(currentArticle => {
            if (currentArticle) {
              return {
                ...currentArticle,
                page_count: newTotalPages
              };
            }
            return currentArticle;
          });
          
          return currentPages;
        });
      }, 100); // Small delay to ensure page plan is updated first
      
    } catch (error) {
      console.error('Error swapping layout:', error);
      toast.error('Failed to swap layout');
    }
  };
  const handleReorderPages = (reorderedPages: PagePlan[]) => {
    setHasUnsavedChanges(true);
    // Update page numbers based on new order, considering 2-pagers take 2 page slots
    let currentPageNumber = 1;
    const pagesWithUpdatedNumbers = reorderedPages.map(page => {
      const updatedPage = {
        ...page,
        pageNumber: currentPageNumber
      };

      // If this is a 2-pager, increment by 2, otherwise by 1
      if (page.typeOfPage === '2 pager') {
        currentPageNumber += 2;
      } else {
        currentPageNumber += 1;
      }
      return updatedPage;
    });
    setPagePlan(pagesWithUpdatedNumbers);
  };
  const handleRemovePage = (pageIndex: number) => {
    setHasUnsavedChanges(true); // Mark as having unsaved changes
    
    setPagePlan(prev => {
      const newPlan = [...prev];
      newPlan.splice(pageIndex, 1);

      // Update page numbers for all subsequent pages
      let currentPageNumber = 1;
      const updatedPlan = newPlan.map(page => {
        const updatedPage = {
          ...page,
          pageNumber: currentPageNumber
        };
        if (page.typeOfPage === '2 pager') {
          currentPageNumber += 2;
        } else {
          currentPageNumber += 1;
        }
        return updatedPage;
      });

      // Calculate new page count after removal
      const newPageCount = updatedPlan.reduce((total, page) => {
        return total + (page.typeOfPage === '2 pager' ? 2 : 1);
      }, 0);
      
      // Update formData with new page count
      setTimeout(() => {
        setFormData(current => ({ ...current, pageCount: newPageCount }));
      }, 0);

      // Update article page_count after page removal
      setTimeout(() => {
        setArticle(currentArticle => {
          if (currentArticle) {
            return {
              ...currentArticle,
              page_count: newPageCount
            };
          }
          return currentArticle;
        });
      }, 0);

      return updatedPlan;
    });
  };
  const handleEditPage = (page: PagePlan) => {
    // Don't allow editing for published articles
    if (article && 'status' in article && article.status !== 'DRAFT') {
      toast.error("This article is published and cannot be edited");
      return;
    }
    // For new structure, layoutJson is already in the page
    // For legacy structure, try to get it from article_json
    let layoutJson = page.layoutJson;
    if (!layoutJson && article && typeof article.article_json === 'object' && !Array.isArray(article.article_json)) {
      layoutJson = article.article_json[page.layoutId.toString()];
    }
    
    const pageWithJson = {
      ...page,
      layoutJson: layoutJson
    };
    setEditingPage(pageWithJson);
    setStep('editing');
  };
  
  const handleSaveEdit = async (updatedArticle: any) => {
    console.log("🚀 DEBUGGING: handleSaveEdit called with:", updatedArticle);
    if (editingPage && updatedArticle) {
      try {
        // Update local state with the returned article data
        setArticle(updatedArticle);
        
        // Recreate pages from the updated article using article_json data instead of querying DB
        if (Array.isArray(updatedArticle.article_json) && updatedArticle.article_json.length > 0) {
          // Create layout objects from article_json data
          const layouts = updatedArticle.article_json.map(pageData => ({
            layout_id: pageData.layout_id,
            layout_metadata: {
              type_of_page: pageData.type_of_page
            },
            layout_json: pageData.layout_json,
            page_image: null,
            bounding_box_image: pageData.bounding_box_image,
            created_by: null,
            updated_by: null,
            created_at: pageData.created_at,
            updated_at: pageData.updated_at
          }));
          
          const pages = createPagesFromArticle(updatedArticle, layouts);
          setPagePlan(pages);
        }

        toast.success('Page saved successfully!');
        setStep('storyboard');
        setActiveTab('upload');
        setEditingPage(null);
      } catch (error) {
        console.error('Error processing saved page:', error);
        toast.error('Failed to process saved page changes');
      }
    }
  };
  const handleXmlUpload = (pageNumber: number, file: File) => {
    setPagePlan(prev => prev.map(page => page.pageNumber === pageNumber ? {
      ...page,
      xmlUploaded: true
    } : page));
    toast.success(`XML uploaded for page ${pageNumber}`);
  };
  const handleCreateArticle = () => {
    const allPagesReady = pagePlan.every(page => page.isCompleted && page.xmlUploaded);
    if (!allPagesReady) {
      toast.error('Please complete all pages and upload XML files');
      return;
    }
    toast.success('Creating article with all pages stitched together!');
  };

  // Save layout changes mutation
  const saveChangesMutation = useMutation({
    mutationFn: async () => {
      if (!article) {
        throw new Error("Article not found");
      }

      // Check if article has article_id (loaded from existing) or needs to be created first
      const articleId = 'article_id' in article ? article.article_id : undefined;
      
      if (!articleId) {
        throw new Error("Cannot save changes to article without ID");
      }

      // Calculate the current page count
      const currentPageCount = pagePlan.reduce((total, page) => {
        return total + (page.typeOfPage === '2 pager' ? 2 : 1);
      }, 0);

      // Get the article_json from pages
      const { article_json } = updateArticleFromPages(pagePlan);
      
      console.log("🚀 Sending update with:", {
        page_count: currentPageCount,
        article_json
      });

      return apiService.updateArticle(articleId, {
        page_count: currentPageCount,
        article_json
      });
    },
    onSuccess: (updatedArticle) => {
      console.log("🎯 Save successful, updating article state with:", updatedArticle);
      // Update the article state with the returned data from API
      setArticle(updatedArticle);
      setHasUnsavedChanges(false);
      setOriginalLayoutOrder(pagePlan.map(page => page.layoutId));
      toast.success('Layout changes saved successfully!');
    },
    onError: () => {
      toast.error('Failed to save layout changes');
    }
  });

  const handleSaveChanges = () => {
    saveChangesMutation.mutate();
  };

  const handlePublishArticle = () => {
    toast.success('Article published successfully!');
    // Could redirect to workspace or stay on current view
  };
  const progress = pagePlan.length > 0 ? pagePlan.filter(p => p.isCompleted && p.xmlUploaded).length / pagePlan.length * 100 : 0;
  const totalPages = pagePlan.reduce((sum, page) => sum + (page.typeOfPage === '2 pager' ? 2 : 1), 0);
  // Filter articles for different sections
  const draftArticles = articles.filter(article => article.status === 'DRAFT');
  const publishedArticles = articles.filter(article => article.status !== 'DRAFT');

  if (step === 'workspace') {
    return <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Article Workspace</h1>
          <p className="text-muted-foreground">Create new articles or continue working on existing ones</p>
        </div>

        <div className="grid gap-8">
          {/* Create New Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Create New Article</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer" onClick={handleCreateNew}>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Create New Article</h3>
                  <p className="text-sm text-muted-foreground">Start a new article project</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Continue Working Section - Draft Articles */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Continue Working</h2>
            {draftArticles.length === 0 ? (
              <Card className="p-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No draft articles</h3>
                  <p className="text-muted-foreground">Your work-in-progress articles will appear here</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {draftArticles.map(article => (
                  <Card key={article.article_id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpenArticle(article)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{article.article_title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{article.magazine_title}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">{article.magazine_category}</Badge>
                        <Badge variant="outline">{article.page_count} pages</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(article.created_at).toLocaleDateString()}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {article.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Published Articles Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Published Articles</h2>
            {publishedArticles.length === 0 ? (
              <Card className="p-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No published articles</h3>
                  <p className="text-muted-foreground">Your completed articles will appear here</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {publishedArticles.map(article => (
                  <Card key={article.article_id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{article.article_title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{article.magazine_title}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">{article.magazine_category}</Badge>
                        <Badge variant="outline">{article.page_count} pages</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(article.created_at).toLocaleDateString()}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {article.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>;
  }
  if (step === 'form') {
    return <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Article</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <Label htmlFor="articleName">Article Name</Label>
                <Input id="articleName" value={formData.articleName} onChange={e => setFormData(prev => ({
                ...prev,
                articleName: e.target.value
              }))} placeholder="Enter unique article name (e.g., Tech Weekly Issue 6)" />
                <p className="text-xs text-muted-foreground mt-1">This is a unique name for this article</p>
              </div>
              
              <div>
                <Label htmlFor="magazineTitle">Magazine Title</Label>
                <Select value={formData.magazineTitle} onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  magazineTitle: value
                }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select magazine title..." />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueMagazineTitles.map(title => (
                      <SelectItem key={title} value={title}>{title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="magazineCategory">Magazine Category</Label>
                <Select value={formData.magazineCategory} onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  magazineCategory: value
                }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueMagazineCategories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="pageCount">Number of Pages</Label>
                <Input id="pageCount" type="number" min="1" max="50" value={formData.pageCount} onChange={e => setFormData(prev => ({
                ...prev,
                pageCount: parseInt(e.target.value) || 1
              }))} />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setStep('workspace')}>
                  Back to Workspace
                </Button>
                <Button type="submit" className="flex-1" disabled={getRecommendationsMutation.isPending}>
                  {getRecommendationsMutation.isPending ? 'Getting Recommendations...' : 'Create Article Plan'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>;
  }
  if (step === 'editing' && editingPage) {
    return <LayoutEditor page={editingPage} article={article} onSave={handleSaveEdit} onCancel={() => setStep('storyboard')} />;
  }
  return <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{formData.articleName} • {totalPages} pages</h1>
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Button 
                onClick={handleSaveChanges} 
                disabled={saveChangesMutation.isPending}
                className="gap-2"
              >
                {saveChangesMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" onClick={() => setStep('workspace')}>
              Back to Workspace
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            
            
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="storyboard">Storyboard</TabsTrigger>
          <TabsTrigger value="upload">Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="storyboard">
          <MagazineStoryboard 
            pages={pagePlan} 
            allLayouts={allLayouts} 
            article={article} 
            onSwapLayout={handleSwapLayout} 
            onEditPage={handleEditPage} 
            onReorderPages={handleReorderPages} 
            onRemovePage={handleRemovePage}
            onRegenerateRecommendations={handleRegenerateRecommendations}
            magazineTitle={formData.magazineTitle}
            magazineCategory={formData.magazineCategory}
            isSwapRecommending={isSwapRecommending}
          />
        </TabsContent>

        <TabsContent value="upload">
          <VivaLayoutTracker 
            pages={pagePlan} 
            onUpdatePage={async (pageIndex: number, vivaStatus: VivaLayoutStatus, documentName?: string) => {
              console.log("🔄 Updating page with VIVA status:", { pageIndex, vivaStatus, documentName });
              
              // Update local state
              setPagePlan(prev => prev.map((page, index) => 
                index === pageIndex ? { 
                  ...page, 
                  vivaStatus,
                  ...(documentName && { vivaDocumentName: documentName })
                } : page
              ));

              // Update backend via API
              if (article?.article_id) {
                try {
                  const pageToUpdate = pagePlan[pageIndex];
                  const updatedLayoutJson = {
                    ...pageToUpdate.layoutJson,
                    vivaStatus,
                    ...(documentName && { vivaDocumentName: documentName })
                  };

                  console.log("🔄 Making PATCH call to update article:", {
                    articleId: article.article_id,
                    pageUid: pageToUpdate.pageUid,
                    updatedLayoutJson
                  });

                  await apiService.patchPageLayout(
                    article.article_id,
                    pageToUpdate.pageUid,
                    updatedLayoutJson
                  );
                  
                  console.log("✅ Successfully updated article with VIVA status");
                } catch (error) {
                  console.error("❌ Failed to update article with VIVA status:", error);
                  toast.error("Failed to save VIVA status to database");
                }
              }
            }}
            onPublishArticle={handlePublishArticle}
            article={article}
            formData={formData}
          />
        </TabsContent>
      </Tabs>
    </div>;
}