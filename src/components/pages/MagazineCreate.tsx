import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Upload, Edit, ArrowRight, Check } from "lucide-react";
import { apiService } from "@/services/api";
import { Layout, LayoutRecommendation } from "@/types/api";
import { toast } from "sonner";
import { MagazineStoryboard } from "@/components/MagazineStoryboard";
import { LayoutEditor } from "@/components/LayoutEditor";

interface MagazineFormData {
  title: string;
  category: string;
  pageCount: number;
}

interface PagePlan {
  pageNumber: number;
  typeOfPage: string;
  layoutId: number;
  layout?: Layout;
  isCompleted: boolean;
  xmlUploaded: boolean;
}

export function MagazineCreatePage() {
  const [step, setStep] = useState<'form' | 'storyboard' | 'editing'>('form');
  const [formData, setFormData] = useState<MagazineFormData>({
    title: '',
    category: '',
    pageCount: 10
  });
  const [recommendations, setRecommendations] = useState<LayoutRecommendation[]>([]);
  const [pagePlan, setPagePlan] = useState<PagePlan[]>([]);
  const [editingPage, setEditingPage] = useState<PagePlan | null>(null);
  const [activeTab, setActiveTab] = useState('storyboard');

  // Get layout recommendations
  const getRecommendationsMutation = useMutation({
    mutationFn: () => apiService.getLayoutRecommendations(
      formData.title || 'UNKNOWN',
      formData.category || 'UNKNOWN', 
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
    if (!formData.title || !formData.category || formData.pageCount < 1) {
      toast.error('Please fill in all fields');
      return;
    }
    getRecommendationsMutation.mutate();
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
                <Label htmlFor="title">Magazine Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter magazine title"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
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
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={getRecommendationsMutation.isPending}
              >
                {getRecommendationsMutation.isPending ? 'Getting Recommendations...' : 'Create Magazine Plan'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
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
        <h1 className="text-3xl font-bold mb-2">{formData.title}</h1>
        <div className="flex items-center gap-4 mb-4">
          <Badge variant="secondary">{formData.category}</Badge>
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