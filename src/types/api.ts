
export interface Layout {
  layout_id: number;
  layout_metadata: Record<string, any>;
  layout_json: Record<string, any>;
  page_image: string | null;
  bounding_box_image: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LayoutRun {
  run_id: number;
  layout_id: number | null;
  seconds: number | null;
  status: 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LayoutPage {
  page: number;
  layout_id: number;
  page_span: number;
}

export interface Article {
  article_id: number;
  title: string;
  page_count: number;
  layout_pages: LayoutPage[];
  magazine_name?: string;
  approximate_number_of_words?: number;
  number_of_images?: number;
  article_category?: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ArticleCreate {
  article_title: string;
  page_count: number;
  layout_pages: LayoutPage[];
  created_by?: string;
  updated_by?: string;
  magazine_name?: string;
  approximate_number_of_words?: number;
  number_of_images?: number;
  article_category?: string;
}

export enum PageType {
  OnePager = '1 pager',
  TwoPager = '2 pager',
}

export interface RunLayoutRequest {
  file: File;
  type_of_page?: PageType;
  page_numbers?: number[];
  merge_level?: number;
}

export interface TemplateRequest {
  category: string;
  brand: string;
  approx_pages: number;
}

export interface TemplateResponse {
  layout_id: number;
  layout_metadata: Record<string, any>;
  layout_json: Record<string, any>;
  page_image: string | null;
  bounding_box_image: string | null;
  created_at: string;
  message: string;
}
