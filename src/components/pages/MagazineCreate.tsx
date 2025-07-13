import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Upload, Edit, ArrowRight, Check, Plus, FolderOpen, Calendar } from "lucide-react";
import { apiService } from "@/services/api";
import { Layout, LayoutRecommendation } from "@/types/api";
import { toast } from "sonner";
import { MagazineStoryboard } from "@/components/MagazineStoryboard";
import { LayoutEditor } from "@/components/LayoutEditor";

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
  isCompleted: boolean;
  xmlUploaded: boolean;
}

interface SlotData {
  id: string;
  slotNumber: number;
  isOccupied: boolean;
  pageData?: PagePlan;
  isSecondSlot?: boolean; // For 2-pagers, marks the second slot
}

export function MagazineCreatePage() {
  const [step, setStep] = useState<'workspace' | 'form' | 'storyboard' | 'editing'>('workspace');
  const [formData, setFormData] = useState<MagazineFormData>({
    articleName: '',
    magazineTitle: '',
    magazineCategory: '',
    pageCount: 10
  });
  const [recommendations, setRecommendations] = useState<LayoutRecommendation[]>([]);
  const [pagePlan, setPagePlan] = useState<PagePlan[]>([]);
  const [editingPage, setEditingPage] = useState<PagePlan | null>(null);
  const [activeTab, setActiveTab] = useState('storyboard');
  
  // Mock saved magazines - in real app this would come from API
  const [savedMagazines] = useState<SavedMagazine[]>([
    {
      id: '1',
      articleName: 'Tech Weekly Issue 5',
      magazineTitle: 'Latest AI Innovations',
      magazineCategory: 'Technology',
      pageCount: 12,
      progress: 75,
      lastModified: '2 hours ago',
      pagePlan: []
    },
    {
      id: '2', 
      articleName: 'Lifestyle Magazine',
      magazineTitle: 'Summer Fashion Trends',
      magazineCategory: 'Lifestyle',
      pageCount: 8,
      progress: 30,
      lastModified: '1 day ago',
      pagePlan: []
    }
  ]);

  // Get layout recommendations
  const getRecommendationsMutation = useMutation({
    mutationFn: () => apiService.getLayoutRecommendations(
      formData.magazineTitle || 'UNKNOWN',
      formData.magazineCategory || 'UNKNOWN', 
      formData.pageCount
    ),
    onSuccess: async (data) => {
      setRecommendations(data);
      
      // Fetch layout details for each recommendation
      const layoutDetailsPromises = data.map(rec => 
        apiService.getLayout(rec.layout_id)
      );
      
      try {
        const layouts = await Promise.all(layoutDetailsPromises);
        const planWithLayouts: PagePlan[] = data.map((rec, index) => ({
          pageNumber: rec.page_number,
          typeOfPage: rec.type_of_page,
          layoutId: rec.layout_id,
          layout: layouts[index],
          isCompleted: false,
          xmlUploaded: false
        }));
        
        setPagePlan(planWithLayouts);
        setStep('storyboard');
      } catch (error) {
        toast.error('Failed to load layout details');
      }
    },
    onError: () => {
      toast.error('Failed to get layout recommendations');
    }
  });

  // Get all layouts for swapping
  const { data: allLayouts = [] } = useQuery({
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
    getRecommendationsMutation.mutate();
  };

  const handleOpenMagazine = (magazine: SavedMagazine) => {
    setFormData({
      articleName: magazine.articleName,
      magazineTitle: magazine.magazineTitle,
      magazineCategory: magazine.magazineCategory,
      pageCount: magazine.pageCount
    });
    setPagePlan(magazine.pagePlan);
    if (magazine.pagePlan.length > 0) {
      setStep('storyboard');
    } else {
      setStep('form');
    }
  };

  const handleCreateNew = () => {
    setFormData({
      articleName: '',
      magazineTitle: '',
      magazineCategory: '',
      pageCount: 10
    });
    setPagePlan([]);
    setStep('form');
  };

  const handleSwapLayout = (pageIndex: number, newLayoutId: number) => {
    const newLayout = allLayouts.find(l => l.layout_id === newLayoutId);
    if (!newLayout) return;

    setPagePlan(prev => prev.map((page, index) => 
      index === pageIndex 
        ? { ...page, layoutId: newLayoutId, layout: newLayout }
        : page
    ));
  };

  const handleEditPage = (page: PagePlan) => {
    setEditingPage(page);
    setStep('editing');
  };

  const handleSaveEdit = () => {
    // Mark page as completed and redirect
    if (editingPage) {
      setPagePlan(prev => prev.map(page => 
        page.pageNumber === editingPage.pageNumber 
          ? { ...page, isCompleted: true }
          : page
      ));
      
      // Simulate redirect
      toast.success("Redirecting to Viva...", {
        duration: 2000,
      });
      
      setTimeout(() => {
        setStep('storyboard');
        setActiveTab('upload');
        setEditingPage(null);
      }, 2000);
    }
  };

  const handleXmlUpload = (pageNumber: number, file: File) => {
    setPagePlan(prev => prev.map(page => 
      page.pageNumber === pageNumber 
        ? { ...page, xmlUploaded: true }
        : page
    ));
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

  const progress = pagePlan.length > 0 
    ? (pagePlan.filter(p => p.isCompleted && p.xmlUploaded).length / pagePlan.length) * 100 
    : 0;

  if (step === 'workspace') {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Magazine Workspace</h1>
          <p className="text-muted-foreground">Create new magazines or continue working on existing ones</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Create New Magazine Card */}
          <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer" onClick={handleCreateNew}>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Plus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Create New Magazine</h3>
              <p className="text-sm text-muted-foreground">Start a new magazine project</p>
            </CardContent>
          </Card>

          {/* Existing Magazines */}
          {savedMagazines.map((magazine) => (
            <Card key={magazine.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpenMagazine(magazine)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{magazine.articleName}</CardTitle>
                <p className="text-sm text-muted-foreground">{magazine.magazineTitle}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">{magazine.magazineCategory}</Badge>
                  <Badge variant="outline">{magazine.pageCount} pages</Badge>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{magazine.progress}%</span>
                  </div>
                  <Progress value={magazine.progress} className="h-2" />
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{magazine.lastModified}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-auto p-1">
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Magazine</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <Label htmlFor="articleName">Article Name</Label>
                <Input
                  id="articleName"
                  value={formData.articleName}
                  onChange={(e) => setFormData(prev => ({ ...prev, articleName: e.target.value }))}
                  placeholder="Enter unique article name (e.g., Tech Weekly Issue 6)"
                />
                <p className="text-xs text-muted-foreground mt-1">This is a unique name for this article</p>
              </div>
              
              <div>
                <Label htmlFor="magazineTitle">Magazine Title</Label>
                <Input
                  id="magazineTitle"
                  value={formData.magazineTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, magazineTitle: e.target.value }))}
                  placeholder="Enter magazine title"
                />
              </div>
              
              <div>
                <Label htmlFor="magazineCategory">Magazine Category</Label>
                <Input
                  id="magazineCategory"
                  value={formData.magazineCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, magazineCategory: e.target.value }))}
                  placeholder="Enter category (e.g., car, lifestyle, tech)"
                />
              </div>
              
              <div>
                <Label htmlFor="pageCount">Number of Pages</Label>
                <Input
                  id="pageCount"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.pageCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, pageCount: parseInt(e.target.value) || 10 }))}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep('workspace')}
                >
                  Back to Workspace
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={getRecommendationsMutation.isPending}
                >
                  {getRecommendationsMutation.isPending ? 'Getting Recommendations...' : 'Create Magazine Plan'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'editing' && editingPage) {
    return (
      <LayoutEditor 
        page={editingPage}
        onSave={handleSaveEdit}
        onCancel={() => setStep('storyboard')}
      />
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{formData.articleName}</h1>
            <p className="text-lg text-muted-foreground">{formData.magazineTitle}</p>
          </div>
          <Button variant="outline" onClick={() => setStep('workspace')}>
            Back to Workspace
          </Button>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <Badge variant="secondary">{formData.magazineCategory}</Badge>
          <Badge variant="outline">{formData.pageCount} pages</Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="storyboard">Storyboard</TabsTrigger>
          <TabsTrigger value="upload">Upload & Create</TabsTrigger>
        </TabsList>

        <TabsContent value="storyboard">
          <MagazineStoryboard 
            pages={pagePlan}
            allLayouts={allLayouts}
            onSwapLayout={handleSwapLayout}
            onEditPage={handleEditPage}
            onSlotsChange={(slots) => {
              // Convert slots back to pages for state management
              const updatedPages = slots
                .filter(slot => slot.isOccupied && !slot.isSecondSlot && slot.pageData)
                .map(slot => slot.pageData!);
              setPagePlan(updatedPages);
            }}
          />
        </TabsContent>

        <TabsContent value="upload">
          <div className="space-y-6">
            <div className="grid gap-4">
              {pagePlan.map((page, index) => (
                <Card key={page.pageNumber} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                        {page.pageNumber}
                      </div>
                      <div>
                        <h3 className="font-medium">Page {page.pageNumber}</h3>
                        <p className="text-sm text-muted-foreground">{page.typeOfPage}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {page.isCompleted && (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          Edited
                        </Badge>
                      )}
                      
                      {page.xmlUploaded ? (
                        <Badge variant="default" className="gap-1">
                          <Check className="h-3 w-3" />
                          XML Uploaded
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".xml"
                            className="w-auto"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleXmlUpload(page.pageNumber, file);
                            }}
                          />
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-1" />
                            Upload XML
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-center pt-6">
              <Button 
                size="lg"
                onClick={handleCreateArticle}
                disabled={!pagePlan.every(p => p.isCompleted && p.xmlUploaded)}
              >
                Create Article
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}