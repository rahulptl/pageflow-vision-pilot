import React, { useState, useCallback, useEffect } from 'react';
import { Article, FormData, ExpectedElement, ExpectedElements } from '../types/magazine';
import { FormSpread } from './FormSpread.tsx';
import { useFormValidation } from '../hooks/useFormValidation';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { apiService } from '../services/api';
import { TemplateRequest, ArticleWithLayout } from '../types/api';
import { ArticleSelectionDialog } from './articles/ArticleSelectionDialog';

interface MagazineFormProps {
  isAdmin?: boolean;
}

// Mock data for demonstration
const mockCategories = ['Fashion', 'Tech', 'Lifestyle', 'Food'];
const mockBrands = ['GlamIt', 'TechNow', 'LifeStyle Co', 'FoodieWorld'];

// Helper function to extract plain text from HTML
const extractTextFromHtml = (htmlString: string): string => {
  if (!htmlString) return '';
  
  // Remove HTML tags and decode common HTML entities
  return htmlString
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Replace ampersands
    .replace(/&lt;/g, '<') // Replace less than
    .replace(/&gt;/g, '>') // Replace greater than
    .replace(/&quot;/g, '"') // Replace quotes
    .replace(/&#8201;/g, ' ') // Replace thin spaces
    .replace(/&[^;]+;/g, ' ') // Replace other HTML entities with space
    .trim();
};

// Text type configuration mapping with exact character limits
const getTextTypeConfig = (textType: string, actualText: string = ''): ExpectedElement => {
  const textLength = actualText.length;
  
  // Use exact character count from template, with sensible minimums for empty fields
  const getCharLimit = (minDefault: number) => textLength > 0 ? textLength : minDefault;
  
  const configs: Record<string, ExpectedElement> = {
    'headline': { 
      type: 'string', 
      maxChars: getCharLimit(80), 
      mandatory: true 
    },
    'standfirst': { 
      type: 'string', 
      maxChars: getCharLimit(200), 
      mandatory: false 
    },
    'masthead': { 
      type: 'string', 
      maxChars: getCharLimit(60), 
      mandatory: true 
    },
    'section header': { 
      type: 'string', 
      maxChars: getCharLimit(30), 
      mandatory: true 
    },
    'body copy': { 
      type: 'string', 
      maxChars: getCharLimit(1200), 
      mandatory: false
    },
    'sidebar text': { 
      type: 'string', 
      maxChars: getCharLimit(800), 
      mandatory: false
    },
    'caption': { 
      type: 'string', 
      maxChars: getCharLimit(150), 
      mandatory: false 
    },
    'author': { 
      type: 'string', 
      maxChars: getCharLimit(50), 
      mandatory: false 
    },
    'page number': { 
      type: 'string', 
      maxChars: getCharLimit(10), 
      mandatory: false, 
      auto: 'auto' 
    },
    'infobox': { 
      type: 'string', 
      maxChars: getCharLimit(400), 
      mandatory: false
    },
    'callout': { 
      type: 'string', 
      maxChars: getCharLimit(200), 
      mandatory: false 
    },
    'hero image number': { 
      type: 'char', 
      maxChars: getCharLimit(3), 
      mandatory: false 
    }
  };
  
  return configs[textType] || { 
    type: 'string', 
    maxChars: getCharLimit(200), 
    mandatory: false 
  };
};

// Image type configuration mapping
const getImageTypeConfig = (imageType: string): ExpectedElement => {
  const configs: Record<string, ExpectedElement> = {
    'feature image': { type: 'image', ratio: '16:9', mandatory: true },
    'photo collage': { type: 'image', ratio: '4:3', mandatory: false },
    'inline image': { type: 'image', ratio: '3:2', mandatory: false },
    'thumbnail': { type: 'image', ratio: '1:1', mandatory: false }
  };
  
  return configs[imageType] || { type: 'image', ratio: '4:3', mandatory: false };
};

// Parse layout JSON to create article structure
const parseLayoutResponse = (layoutResponse: any): { article: Article, defaultValues: FormData } => {
  const pages = layoutResponse.layout_json?.document?.pages || [];
  const defaultValues: FormData = {};
  
  // Debug logging to understand the structure
  console.log('Full layout response:', layoutResponse);
  console.log('Pages array:', pages);
  console.log('First page structure:', pages[0]);
  if (pages[0]?.objects) {
    console.log('First page objects:', pages[0].objects);
    console.log('Available object keys:', Object.keys(pages[0].objects));
  }
  
  const spreads = pages.map((page: any, pageIndex: number) => {
    const expectedElements: ExpectedElements = {};
    const textTypeCount: Record<string, number> = {};
    const imageTypeCount: Record<string, number> = {};
    defaultValues[pageIndex] = {};

    // Process all objects from all layers
    const allObjects = page.objects || {};
    
    // Iterate through all layers and their objects
    Object.entries(allObjects).forEach(([layerName, layerObjects]: [string, any[]]) => {
      if (Array.isArray(layerObjects)) {
        layerObjects.forEach((obj: any) => {
          // Process text objects
          if (obj.type === 'text' && obj.textType) {
            // Count occurrences of each text type
            textTypeCount[obj.textType] = (textTypeCount[obj.textType] || 0) + 1;
            
            // Create unique field name
            const cleanType = obj.textType.replace(/\s+/g, '_').toLowerCase();
            const fieldName = textTypeCount[obj.textType] === 1 
              ? cleanType 
              : `${cleanType}_${textTypeCount[obj.textType]}`;
            
            const extractedText = extractTextFromHtml(obj.story || '');
            expectedElements[fieldName] = getTextTypeConfig(obj.textType, extractedText);
            defaultValues[pageIndex][fieldName] = extractedText;
          }
          
          // Process image objects
          if (obj.type === 'image' && obj.imageType) {
            // Count occurrences of each image type
            imageTypeCount[obj.imageType] = (imageTypeCount[obj.imageType] || 0) + 1;
            
            // Create unique field name
            const cleanType = obj.imageType.replace(/\s+/g, '_').toLowerCase();
            const fieldName = imageTypeCount[obj.imageType] === 1 
              ? cleanType 
              : `${cleanType}_${imageTypeCount[obj.imageType]}`;
            
            expectedElements[fieldName] = getImageTypeConfig(obj.imageType);
            
            // Image fields don't have default values (they need to be uploaded)
            defaultValues[pageIndex][fieldName] = null;
          }
          
          // Process grouped objects recursively
          if (obj.type === 'group' && obj.objects) {
            obj.objects.forEach((groupedObj: any) => {
              if (groupedObj.type === 'text' && groupedObj.textType) {
                textTypeCount[groupedObj.textType] = (textTypeCount[groupedObj.textType] || 0) + 1;
                
                const cleanType = groupedObj.textType.replace(/\s+/g, '_').toLowerCase();
                const fieldName = textTypeCount[groupedObj.textType] === 1 
                  ? cleanType 
                  : `${cleanType}_${textTypeCount[groupedObj.textType]}`;
                
                const extractedText = extractTextFromHtml(groupedObj.story || '');
                expectedElements[fieldName] = getTextTypeConfig(groupedObj.textType, extractedText);
                defaultValues[pageIndex][fieldName] = extractedText;
              }
              
              if (groupedObj.type === 'image' && groupedObj.imageType) {
                imageTypeCount[groupedObj.imageType] = (imageTypeCount[groupedObj.imageType] || 0) + 1;
                
                const cleanType = groupedObj.imageType.replace(/\s+/g, '_').toLowerCase();
                const fieldName = imageTypeCount[groupedObj.imageType] === 1 
                  ? cleanType 
                  : `${cleanType}_${imageTypeCount[groupedObj.imageType]}`;
                
                expectedElements[fieldName] = getImageTypeConfig(groupedObj.imageType);
                defaultValues[pageIndex][fieldName] = null;
              }
            });
          }
        });
      }
    });

    return {
      template_id: `page-${pageIndex + 1}`,
      expected_elements: expectedElements,
      preview_png: layoutResponse.page_image // Use the combined page image as preview
    };
  });

  const article: Article = {
    spreads: spreads.filter(spread => Object.keys(spread.expected_elements).length > 0)
  };

  return { article, defaultValues };
};

export const MagazineForm: React.FC<MagazineFormProps> = ({ isAdmin = false }) => {
  const [category, setCategory] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [approxPages, setApproxPages] = useState<string>('');
  const [article, setArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [searchedArticles, setSearchedArticles] = useState<ArticleWithLayout[]>([]);
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [isSearchingArticles, setIsSearchingArticles] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const { errors, warnings, validateSpread, clearValidation } = useFormValidation();
  const { toast } = useToast();

  // Load available options on component mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const { categories, brands } = await apiService.getDistinctArticleValues();
        setAvailableCategories(categories);
        setAvailableBrands(brands);
      } catch (error) {
        console.error('Failed to load dropdown options:', error);
        toast({
          title: "Warning",
          description: "Could not load category and brand options from articles",
          variant: "destructive"
        });
        // Fall back to empty arrays if API fails
        setAvailableCategories([]);
        setAvailableBrands([]);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadOptions();
  }, [toast]);

  // Auto-save to localStorage (but don't save immediately when defaults are loaded)
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      // Only save if the form data contains user-entered content (not just defaults)
      const hasUserContent = Object.values(formData).some(spreadData => 
        Object.values(spreadData).some(value => 
          value !== null && value !== '' && 
          (typeof value === 'string' ? value.trim() !== '' : true)
        )
      );
      
      if (hasUserContent) {
        localStorage.setItem('magazine-form-draft', JSON.stringify(formData));
      }
    }
  }, [formData]);

  // Load draft from localStorage (only if no article is loaded yet)
  useEffect(() => {
    if (!article) {
      const savedDraft = localStorage.getItem('magazine-form-draft');
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          setFormData(draftData);
          toast({
            title: "Draft loaded",
            description: "Your previous work has been restored",
          });
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    }
  }, [article, toast]);

  const handleConfigSubmit = useCallback(async () => {
    if (!category || !brand || !approxPages) {
      toast({
        title: "Missing information",
        description: "Please fill in all configuration fields",
        variant: "destructive"
      });
      return;
    }

    setIsSearchingArticles(true);
    
    try {
      // Search for articles matching the criteria
      const searchResults = await apiService.searchArticles({
        article_category: category,
        page_count: parseInt(approxPages),
        limit: 20
      });
      
      setSearchedArticles(searchResults);
      setShowArticleDialog(true);
      
    } catch (error) {
      console.error('Failed to search articles:', error);
      toast({
        title: "Error searching articles",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSearchingArticles(false);
    }
  }, [category, brand, approxPages, toast]);

  const handleArticleSelect = useCallback(async (selectedArticle: ArticleWithLayout) => {
    setIsLoadingTemplate(true);
    
    try {
      // Use the layout data directly from the selected article
      const layoutPages = selectedArticle.layout_pages.filter(page => page.layout);
      
      if (layoutPages.length === 0) {
        throw new Error('No layout data found in selected article');
      }

      // Create article structure from the selected article's layout data
      const spreads = layoutPages.map((layoutPage, pageIndex) => {
        const layoutData = layoutPage.layout!;
        const { article: parsedArticle, defaultValues: pageDefaults } = parseLayoutResponse(layoutData);
        return parsedArticle.spreads[0]; // Each layout is a single page/spread
      });

      const article: Article = {
        spreads: spreads.filter(spread => Object.keys(spread.expected_elements).length > 0)
      };

      // Combine default values from all pages
      const defaultValues: FormData = {};
      layoutPages.forEach((layoutPage, pageIndex) => {
        const layoutData = layoutPage.layout!;
        const { defaultValues: pageDefaults } = parseLayoutResponse(layoutData);
        defaultValues[pageIndex] = pageDefaults[0] || {};
      });
      
      if (article.spreads.length === 0) {
        throw new Error('No valid layout elements found in article');
      }
      
      setArticle(article);
      setFormData(defaultValues);
      
      toast({
        title: "Article selected!",
        description: `Using "${selectedArticle.article_title}" with its original layout`,
      });
      
    } catch (error) {
      console.error('Failed to process selected article:', error);
      toast({
        title: "Error processing article",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTemplate(false);
      setShowArticleDialog(false);
    }
  }, [toast]);

  const handleFieldChange = useCallback((
    spreadIndex: number,
    fieldName: string,
    value: string | string[] | File | null
  ) => {
    setFormData(prev => ({
      ...prev,
      [spreadIndex]: {
        ...prev[spreadIndex],
        [fieldName]: value
      }
    }));

    // Apply auto-derivations
    if (article) {
      const spread = article.spreads[spreadIndex];
      Object.entries(spread.expected_elements).forEach(([autoFieldName, config]) => {
        if (config.auto === `${fieldName}[0]` && typeof value === 'string' && value.length > 0) {
          setFormData(prev => ({
            ...prev,
            [spreadIndex]: {
              ...prev[spreadIndex],
              [autoFieldName]: value[0]
            }
          }));
        }
      });
    }
  }, [article]);

  const handleValidation = useCallback(() => {
    if (!article) return;

    clearValidation();
    
    article.spreads.forEach((spread, index) => {
      const spreadData = formData[index] || {};
      validateSpread(spreadData, spread.expected_elements, index);
    });
  }, [article, formData, validateSpread, clearValidation]);

  const handleSubmit = useCallback(async () => {
    if (!article) return;

    handleValidation();
    
    // Count errors
    const totalErrors = Object.values(errors).reduce((acc, spreadErrors) => acc + (spreadErrors?.length || 0), 0);
    
    if (totalErrors > 0) {
      toast({
        title: "Please fix errors before submitting",
        description: `${totalErrors} error${totalErrors !== 1 ? 's' : ''} found`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Magazine created successfully!",
        description: "Your magazine has been generated and is ready for download",
      });
      
      // Clear the form
      setFormData({});
      localStorage.removeItem('magazine-form-draft');
      
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [article, errors, handleValidation, toast]);

  // Calculate totals for status display
  const totalErrors = Object.values(errors).reduce((acc, spreadErrors) => acc + (spreadErrors?.length || 0), 0);
  const totalWarnings = Object.values(warnings).reduce((acc, spreadWarnings) => acc + (spreadWarnings?.length || 0), 0);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">AI Magazine Creator</h1>
        <p className="text-muted-foreground">
          Tell us what you want, and AI will craft the perfect magazine layout for your content
        </p>
      </div>

      {/* Configuration Section */}
      {!article && (
        <Card>
          <CardHeader>
            <CardTitle>What kind of magazine are you creating?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} disabled={isLoadingOptions}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingOptions ? "Loading..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Select value={brand} onValueChange={setBrand} disabled={isLoadingOptions}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingOptions ? "Loading..." : "Select brand"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBrands.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="pages">Approximate Pages</Label>
                <Input
                  id="pages"
                  type="number"
                  value={approxPages}
                  onChange={(e) => setApproxPages(e.target.value)}
                  placeholder="e.g., 4"
                  min="1"
                  max="20"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleConfigSubmit} 
              className="w-full"
              disabled={isSearchingArticles || isLoadingOptions || !category || !brand || !approxPages}
            >
              {isSearchingArticles ? 'Searching Articles...' : 'Find Existing Articles'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Form Section */}
      {article && (
        <>
          {/* Status Bar */}
          <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
            <div>
              <h2 className="font-semibold">
                {category} • {brand} • {article.spreads.length * 2} Pages
              </h2>
            </div>
            <div className="flex gap-2">
              {totalErrors > 0 && (
                <Badge variant="destructive">
                  {totalErrors} Error{totalErrors !== 1 ? 's' : ''}
                </Badge>
              )}
              {totalWarnings > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  {totalWarnings} AI Adjustment{totalWarnings !== 1 ? 's' : ''} Needed
                </Badge>
              )}
            </div>
          </div>

          {/* Layout Pages */}
          <div className="space-y-8">
            {article.spreads.map((spread, index) => (
              <FormSpread
                key={index}
                spread={spread}
                spreadIndex={index}
                data={formData[index] || {}}
                onChange={(fieldName, value) => handleFieldChange(index, fieldName, value)}
                errors={errors[index] || []}
                warnings={warnings[index] || []}
              />
            ))}
          </div>

          {/* Submit Section */}
          <div className="sticky bottom-0 bg-background border-t p-4">
            <div className="container mx-auto">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {totalWarnings > 0 && (
                    <p>AI will intelligently adjust your layout for the best visual impact</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleValidation}
                  >
                    Check Content
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Magazine'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Article Selection Dialog */}
      <ArticleSelectionDialog
        open={showArticleDialog}
        onOpenChange={setShowArticleDialog}
        articles={searchedArticles}
        onSelectArticle={handleArticleSelect}
        isLoading={isLoadingTemplate}
      />
    </div>
  );
};