import { Layout } from "@/types/api";

interface PagePlan {
  pageNumber: number;
  typeOfPage: string;
  layoutId: number;
  layout?: Layout;
  layoutJson?: any;
  isCompleted: boolean;
  xmlUploaded: boolean;
  pageUid: string;
  boundingBoxImage?: string;
  createdAt: string;
  updatedAt: string;
  vivaDocumentName?: string;
  vivaStatus?: any; // VivaLayoutStatus type
}

interface Article {
  layout_order: number[];
  article_json: any; // Can be either Array<PageData> or Record<string, any>
}

/**
 * Creates PagePlan objects from the new Article API structure
 */
export function createPagesFromArticle(
  article: Article,
  allLayouts: Layout[]
): PagePlan[] {
  const pages: PagePlan[] = [];
  let currentPageNumber = 1;

  // If article_json is an array, use it directly for ordering
  if (Array.isArray(article.article_json)) {
    article.article_json.forEach((pageData) => {
      // Find the layout details
      const layout = allLayouts.find(l => l.layout_id === pageData.layout_id);
      
      pages.push({
        pageNumber: currentPageNumber,
        typeOfPage: pageData.type_of_page || '1 pager',
        layoutId: pageData.layout_id,
        layout,
        layoutJson: pageData.layout_json,
        isCompleted: false,
        xmlUploaded: false,
        pageUid: pageData.page_uid,
        boundingBoxImage: pageData.bounding_box_image,
        createdAt: pageData.created_at,
        updatedAt: pageData.updated_at,
        // Load VIVA status from database (handle both snake_case and camelCase)
        vivaDocumentName: pageData.layout_json?.vivaStatus?.viva_document_name || null,
        vivaStatus: pageData.layout_json?.vivaStatus || null,
      });

      // Increment page number based on layout type
      currentPageNumber += pageData.type_of_page === '2 pager' ? 2 : 1;
    });
  } else {
    // Fallback: use layout_order for legacy format
    article.layout_order.forEach((layoutId) => {
      // Find the layout details
      const layout = allLayouts.find(l => l.layout_id === layoutId);
      const layoutJson = typeof article.article_json === 'object' && !Array.isArray(article.article_json) 
        ? article.article_json[layoutId.toString()] 
        : {};
      
      // Determine if it's a 1-pager or 2-pager
      const typeOfPage = layout?.layout_metadata?.type_of_page || '1 pager';
      
      const now = new Date().toISOString();
      pages.push({
        pageNumber: currentPageNumber,
        typeOfPage,
        layoutId,
        layout,
        layoutJson,
        isCompleted: false,
        xmlUploaded: false,
        pageUid: crypto.randomUUID(),
        boundingBoxImage: layout?.bounding_box_image,
        createdAt: now,
        updatedAt: now
      });

      // Increment page number based on layout type
      currentPageNumber += typeOfPage === '2 pager' ? 2 : 1;
    });
  }

  return pages;
}

/**
 * Updates article structure when pages are reordered
 */
export function updateArticleFromPages(
  pages: PagePlan[]
): { layout_order: number[]; article_json: Array<any> } {
  const layout_order: number[] = [];
  const article_json: Array<any> = [];

  pages.forEach(page => {
    layout_order.push(page.layoutId);
    article_json.push({
      page_uid: page.pageUid,
      layout_id: page.layoutId,
      type_of_page: page.typeOfPage,
      layout_json: page.layoutJson || {},
      bounding_box_image: page.boundingBoxImage,
      created_at: page.createdAt,
      updated_at: new Date().toISOString(),
      // Save VIVA status to database
      viva_document_name: page.vivaDocumentName,
      viva_status: page.vivaStatus
    });
  });

  return { layout_order, article_json };
}