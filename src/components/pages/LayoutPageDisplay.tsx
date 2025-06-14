
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout, LayoutPage } from "@/types/api";
import { ImageDisplay } from "./ImageDisplay";

interface LayoutPageDisplayProps {
  layoutPage: LayoutPage;
  layout: Layout;
}

export function LayoutPageDisplay({ layoutPage, layout }: LayoutPageDisplayProps) {
  const isTwoPager = layout.layout_metadata?.type_of_layout === "two_pager";
  const from = layoutPage.page;
  const to = layoutPage.page + layoutPage.page_span - 1;

  let pageText = "";
  if (layoutPage.page_span > 1) {
    pageText = `Pages ${from}-${to}`;
  } else {
    pageText = `Page ${from}`;
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-semibold text-base">
            {pageText}
          </Badge>
          <span className="text-muted-foreground text-sm">
            (Layout #{layout.layout_id})
          </span>
        </div>
        <Link to={`/layouts/${layout.layout_id}`}>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      </div>

      {/* Images Layout - Conditional based on type_of_layout */}
      <div className={isTwoPager ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}>
        <ImageDisplay
          imageUrl={layout.page_image}
          alt={`Page ${layoutPage.page} original`}
          title="Original Page"
          isTwoPager={isTwoPager}
        />
        <ImageDisplay
          imageUrl={layout.bounding_box_image}
          alt={`Page ${layoutPage.page} bounding boxes`}
          title="Layout Analysis"
          isTwoPager={isTwoPager}
        />
      </div>
    </div>
  );
}
