
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

export interface RunLayoutRequest {
  file: File;
  page_no?: number;
  merge_level?: number;
}
