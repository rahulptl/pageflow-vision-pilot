export interface ExpectedElement {
  type: 'string' | 'char' | 'image' | 'array';
  maxChars?: number;
  minItems?: number;
  maxItems?: number;
  mandatory?: boolean;
  auto?: string;
  ratio?: string;
  items?: {
    type: 'string';
    maxChars?: number;
  };
}

export interface ExpectedElements {
  [key: string]: ExpectedElement;
}

export interface Spread {
  template_id: string;
  expected_elements: ExpectedElements;
  preview_png?: string;
}

export interface Article {
  spreads: Spread[];
}

export interface FormData {
  [spreadIndex: number]: {
    [fieldName: string]: string | string[] | File | null;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface DriftWarning {
  field: string;
  type: 'length' | 'count' | 'missing';
  message: string;
}

export interface VivaLayoutStatus {
  jobId?: string;
  documentName?: string;
  designerUrl?: string;
  pdfDownloadUrl?: string;
  status: 'not_started' | 'uploaded' | 'converted' | 'pdf_exported';
  lastUpdated?: Date;
}