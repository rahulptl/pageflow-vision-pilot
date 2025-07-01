import { Layout, LayoutRun, RunLayoutRequest, Article, ArticleCreate, TemplateRequest, TemplateResponse } from '@/types/api';

const API_BASE_URL = 'http://127.0.0.1:8000';

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

  async getLayouts(): Promise<Layout[]> {
    return this.request<Layout[]>('/layouts/');
  }

  async getLayout(layoutId: number): Promise<Layout> {
    return this.request<Layout>(`/layouts/${layoutId}`);
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

  async checkHealth(): Promise<any> {
    return this.request<any>('/health');
  }
}

export const apiService = new ApiService();
