import { Layout } from "@/types/api";

interface PagePlan {
  pageNumber: number;
  typeOfPage: string;
  layoutId: number;
  layout?: Layout;
  layoutJson?: any;
  isCompleted: boolean;
  xmlUploaded: boolean;
}

interface Article {
  layout_order: number[];
  article_json: Record<string, any>;
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

  article.layout_order.forEach((layoutId) => {
    // Find the layout details
    const layout = allLayouts.find(l => l.layout_id === layoutId);
    const layoutJson = article.article_json[layoutId.toString()];
    
    // Determine if it's a 1-pager or 2-pager
    const typeOfPage = layout?.layout_metadata?.type_of_page || '1 pager';
    
    pages.push({
      pageNumber: currentPageNumber,
      typeOfPage,
      layoutId,
      layout,
      layoutJson,
      isCompleted: false,
      xmlUploaded: false
    });

    // Increment page number based on layout type
    currentPageNumber += typeOfPage === '2 pager' ? 2 : 1;
  });

  return pages;
}

/**
 * Updates article structure when pages are reordered
 */
export function updateArticleFromPages(
  pages: PagePlan[]
): { layout_order: number[]; article_json: Record<string, any> } {
  const layout_order: number[] = [];
  const article_json: Record<string, any> = {};

  pages.forEach(page => {
    layout_order.push(page.layoutId);
    if (page.layoutJson) {
      article_json[page.layoutId.toString()] = page.layoutJson;
    }
  });

  return { layout_order, article_json };
}