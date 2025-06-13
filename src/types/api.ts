
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

export interface Article {
  article_id: number;
  title: string;
  page_count: number;
  layout_pages: number[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ArticleCreate {
  title: string;
  layout_pages: number[];
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
