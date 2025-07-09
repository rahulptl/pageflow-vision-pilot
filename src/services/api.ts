
import { Layout, LayoutRun, RunLayoutRequest, Article, ArticleCreate, ArticleWithLayout, TemplateRequest, TemplateResponse } from '@/types/api';
import { ImageEdit } from '@/types/imageGeneration';

const API_BASE_URL = 'http://127.0.0.1:8000';

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
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
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

  async updateArticle(articleId: number, article: ArticleCreate): Promise<Article> {
    return this.request<Article>(`/articles/${articleId}`, {
      method: 'PUT',
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
}

export const apiService = new ApiService();
