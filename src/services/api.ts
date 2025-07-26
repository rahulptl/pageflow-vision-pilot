
import { Layout, LayoutRun, RunLayoutRequest, Article, ArticleCreate, ArticleWithLayout, TemplateRequest, TemplateResponse, LayoutRecommendation, ArticleRecommendationResponse, RecommendationResponse } from '@/types/api';
import { ImageEdit } from '@/types/imageGeneration';

// const API_BASE_URL = 'https://ild-backend-app-a3fxgmh7ckf7cxfs.germanywestcentral-01.azurewebsites.net';
const API_BASE_URL = '127.0.0.1:8000'

export interface ArticleSearchParams {
  article_title?: string;
  magazine_name?: string;
  approximate_number_of_words?: number;
  page_count?: number;
  number_of_images?: number;
  article_category?: string;
  created_by?: string;
  skip?: number;
  limit?: number;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Debug: Log all API requests 
    console.log("🚀 API REQUEST:", options?.method || 'GET', url);
    if (options?.body) {
      console.log("🚀 REQUEST BODY:", options.body);
    }
    
    // Special logging for articles endpoints
    if (endpoint.includes('/articles/')) {
      console.log("🔍 ARTICLES ENDPOINT ANALYSIS:");
      console.log("  Raw endpoint:", endpoint);
      console.log("  Method:", options?.method || 'GET');
      console.log("  Is recommend?", endpoint.includes('/recommend'));
    }
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      console.error("❌ API REQUEST FAILED:");
      console.error("  URL:", url);
      console.error("  Status:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("  Error body:", errorText);
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getLayouts(skip: number = 0, limit: number = 100): Promise<Layout[]> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    return this.request<Layout[]>(`/layouts/?${params.toString()}`);
  }

  async getLayout(layoutId: number): Promise<Layout> {
    return this.request<Layout>(`/layouts/${layoutId}`);
  }

  async updateLayout(layoutId: number, boundingBoxImage: File, layoutJson: File): Promise<Layout> {
    const formData = new FormData();
    formData.append('bounding_box_image', boundingBoxImage);
    formData.append('layout_json', layoutJson);

    const response = await fetch(`${API_BASE_URL}/layouts/${layoutId}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to update layout: ${response.statusText}`);
    }

    return response.json();
  }

  async findSuitableTemplate(request: TemplateRequest): Promise<TemplateResponse> {
    return this.request<TemplateResponse>('/layouts/find-template', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async runLayoutPipeline(request: RunLayoutRequest): Promise<void> {
    const formData = new FormData();
    formData.append('file', request.file);

    const params = new URLSearchParams();
    if (request.type_of_page) params.append('type_of_page', request.type_of_page);
    if (request.page_numbers)
      request.page_numbers.forEach((p) => params.append('page_numbers', p.toString()));
    if (request.merge_level) params.append('merge_level', request.merge_level.toString());

    const url = `/layouts/run${params.toString() ? `?${params.toString()}` : ''}`;
    
    await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      body: formData,
    });
  }

  // Layout Creation
  async createLayout(data: {
    layout_json: any;
    page_image: File;
    created_by?: string;
    magazine_title?: string;
    magazine_category?: string;
    type_of_page: "1 pager" | "2 pager";
  }): Promise<Layout> {
    const formData = new FormData();
    
    // Create a JSON blob for the layout_json
    const layoutBlob = new Blob([JSON.stringify(data.layout_json)], { 
      type: 'application/json' 
    });
    formData.append('layout_json', layoutBlob, 'layout.json');
    formData.append('page_image', data.page_image);
    
    // Build query parameters
    const params = new URLSearchParams();
    if (data.created_by) params.append('created_by', data.created_by);
    if (data.magazine_title) params.append('magazine_title', data.magazine_title);
    if (data.magazine_category) params.append('magazine_category', data.magazine_category);
    params.append('type_of_page', data.type_of_page);

    const endpoint = `/layouts/?${params.toString()}`;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser set it for FormData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create layout: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getRuns(): Promise<LayoutRun[]> {
    return this.request<LayoutRun[]>('/runs/');
  }

  async getRun(runId: number): Promise<LayoutRun> {
    return this.request<LayoutRun>(`/runs/${runId}`);
  }

  async removeRun(runId: number): Promise<void> {
    await fetch(`${API_BASE_URL}/runs/${runId}`, {
      method: 'DELETE',
    });
  }

  async getArticles(): Promise<Article[]> {
    return this.request<Article[]>('/articles/');
  }

  async searchArticles(params: ArticleSearchParams): Promise<ArticleWithLayout[]> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/articles/search${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request<ArticleWithLayout[]>(endpoint);
  }

  async getArticle(articleId: number): Promise<Article> {
    return this.request<Article>(`/articles/${articleId}`);
  }

  async createArticle(article: ArticleCreate): Promise<Article> {
    return this.request<Article>('/articles/', {
      method: 'POST',
      body: JSON.stringify(article),
    });
  }

  async updateArticle(articleId: number, article: Partial<Article>): Promise<Article> {
    return this.request<Article>(`/articles/${articleId}`, {
      method: 'PATCH',
      body: JSON.stringify(article),
    });
  }

  async deleteArticle(articleId: number): Promise<void> {
    await fetch(`${API_BASE_URL}/articles/${articleId}`, {
      method: 'DELETE',
    });
  }

  async getDistinctArticleValues(): Promise<{
    categories: string[];
    brands: string[];
  }> {
    const articles = await this.request<Article[]>('/articles/');
    
    const categories = [...new Set(
      articles
        .map(article => article.article_category)
        .filter(category => category && category.trim() !== '')
    )].sort();
    
    const brands = [...new Set(
      articles
        .map(article => article.magazine_name)
        .filter(brand => brand && brand.trim() !== '')
    )].sort();
    
    return { categories, brands };
  }

  async checkHealth(): Promise<any> {
    return this.request<any>('/health');
  }

  // Recommendation API
  async getLayoutRecommendations(
    magazineTitle: string, 
    magazineCategory: string, 
    pageCount: number,
    articleTitle: string = "Draft Article",
    createdBy?: string,
    rank: number = 0,
    articleId?: number
  ): Promise<RecommendationResponse> {
    const params = new URLSearchParams({
      article_title: articleTitle,
      magazine_title: magazineTitle,
      magazine_category: magazineCategory, 
      page_count: pageCount.toString(),
      rank: rank.toString()
    });
    if (createdBy) {
      params.append('created_by', createdBy);
    }
    if (articleId) {
      params.append('article_id', articleId.toString());
    }
    
    // Use GET method with correct endpoint
    const fullUrl = `${API_BASE_URL}/articles/recommend?${params}`;
    console.log("🚀 RECOMMENDATION API CALL:");
    console.log("  Full URL:", fullUrl);
    console.log("  Method: GET");
    console.log("  Params:", Object.fromEntries(params));
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ RECOMMENDATION API FAILED:");
      console.error("  URL:", fullUrl);
      console.error("  Status:", response.status, response.statusText);
      console.error("  Error body:", errorText);
      throw new Error(`Recommendation API failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Image Generation APIs
  async generateImage(image: File, prompt: string, createdBy?: string): Promise<ImageEdit> {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('prompt', prompt);
    if (createdBy) {
      formData.append('created_by', createdBy);
    }

    const response = await fetch(`${API_BASE_URL}/generate_image`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser set it for FormData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate image: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async editImage(sessionId: string, prompt: string): Promise<ImageEdit> {
    const formData = new URLSearchParams();
    formData.append('session_id', sessionId);
    formData.append('prompt', prompt);

    const response = await fetch(`${API_BASE_URL}/image_edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to edit image: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getAllImageEdits(): Promise<ImageEdit[]> {
    return this.request<ImageEdit[]>('/image_edit');
  }

  async getImageEdit(sessionId: string): Promise<ImageEdit> {
    return this.request<ImageEdit>(`/image_edit/${sessionId}`);
  }

  // Image upload API
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/images/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`);
    }

    return response.json();
  }

  // Patch individual page layout
  async patchPageLayout(articleId: number, pageUid: string, layoutJson: any): Promise<Article> {
    console.log("🚀 API DEBUG: patchPageLayout called with:");
    console.log("articleId:", articleId);
    console.log("pageUid:", pageUid);
    console.log("URL will be:", `/articles/${articleId}/page/${pageUid}`);
    
    return this.request<Article>(`/articles/${articleId}/page/${pageUid}`, {
      method: 'PATCH',
      body: JSON.stringify(layoutJson),
    });
  }

  // Process zip file
  async processZip(desdPath: string): Promise<any> {
    return this.request<any>('/articles/process-zip', {
      method: 'POST',
      body: JSON.stringify({ desd_path: desdPath }),
    });
  }

  // Merge PDFs
  async mergePdfs(pdfUrls: string[]): Promise<{ public_url: string }> {
    return this.request<{ public_url: string }>('/articles/merge-pdfs', {
      method: 'POST',
      body: JSON.stringify({ pdf_urls: pdfUrls }),
    });
  }

  // Publish article
  async publishArticle(articleId: number): Promise<Article> {
    return this.request<Article>(`/articles/${articleId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PUBLISHED' }),
    });
  }
}

export const apiService = new ApiService();
