export interface EditItem {
  prompt: string;
  response_id: string;
  edited_image: string;
}

export interface ImageEdit {
  session_id: string;
  edits: EditItem[];
  original_image_url: string;
  system_prompt: string;
  settings: Record<string, any>;
  edit_id: number;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: string;
  isLoading?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  imageEdit?: ImageEdit;
}