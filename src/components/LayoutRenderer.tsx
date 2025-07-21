import React from 'react';

interface GeometryRect {
  width: number;
  height: number;
}

interface Transform {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

interface LayoutObject {
  id: number;
  type: 'text' | 'image';
  geometry: string;
  transform: string;
  textType?: string;
  imageType?: string;
}

interface LayoutPage {
  objects: {
    Background?: LayoutObject[];
    Foreground?: LayoutObject[];
  };
}

interface Props {
  layoutJson: any;
  width?: number;
  height?: number;
  className?: string;
}

const parseGeometry = (geometry: string): GeometryRect => {
  const parts = geometry.split(' ').map(Number);
  return {
    width: parts[2] || 0,
    height: parts[3] || 0
  };
};

const parseTransform = (transform: string): Transform => {
  const [a, b, c, d, e, f] = transform.split(' ').map(Number);
  return {
    a: a ?? 1,
    b: b ?? 0,
    c: c ?? 0,
    d: d ?? 1,
    e: e ?? 0,
    f: f ?? 0
  };
};

const getAllObjects = (page: LayoutPage): LayoutObject[] => {
  const allObjects: LayoutObject[] = [];
  if (page.objects) {
    Object.values(page.objects).forEach(group => {
      if (Array.isArray(group)) {
        allObjects.push(...group);
      }
    });
  }
  return allObjects;
};

export const LayoutRenderer: React.FC<Props> = ({
  layoutJson,
  width = 612,
  height,
  className = ""
}) => {
  if (!layoutJson?.document?.pages) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded ${className}`} style={{ width, height: height || width * 1.3 }}>
        <span className="text-xs text-muted-foreground">
          {layoutJson ? 'Invalid layout structure' : 'No layout data'}
        </span>
      </div>
    );
  }

  const document = layoutJson.document;
  const pages = document.pages;
  const pageSize = document.settings?.pageSize || { width: 612, height: 792 };
  const isSpread = pages.length === 2;

  // SVG viewport dimensions
  const viewWidth = isSpread ? pageSize.width * 2 : pageSize.width;
  const viewHeight = pageSize.height;

  // Use actual dimensions from layout if width/height not provided
  const actualWidth = width || viewWidth;
  const actualHeight = height || viewHeight;

  return (
    <div className={`bg-white rounded border overflow-hidden ${className}`} style={{ width: actualWidth, height: actualHeight }}>
      <svg width={actualWidth} height={actualHeight} viewBox={`0 0 ${viewWidth} ${viewHeight}`} preserveAspectRatio="xMidYMid meet">
        {/* Draw page backgrounds side by side */}
        {pages.map((page, pageIndex) => {
          const xOffset = isSpread ? pageIndex * pageSize.width : 0;
          const allObjects = getAllObjects(page);

          return (
            <g key={pageIndex}>
              <rect
                x={xOffset}
                y={0}
                width={pageSize.width}
                height={pageSize.height}
                fill="white"
                stroke="#e5e7eb"
              />
              {allObjects.map((obj) => {
                const geom = parseGeometry(obj.geometry);
                const t = parseTransform(obj.transform);

                const getColor = () => {
                  if (obj.type === 'text') return '#e74c3c';
                  if (obj.type === 'image') return '#3498db';
                  return '#6b7280';
                };

                return (
                  <rect
                    key={obj.id}
                    x={0}
                    y={0}
                    width={geom.width}
                    height={geom.height}
                    fill="none"
                    stroke={getColor()}
                    strokeWidth={0.8}
                    transform={`matrix(${t.a}, ${t.b}, ${t.c}, ${t.d}, ${t.e + xOffset}, ${t.f})`}
                    opacity={0.8}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Optional: Thumbnail version
export const LayoutThumbnail: React.FC<Props> = ({ layoutJson, width = 120, className = "" }) => {
  return (
    <LayoutRenderer
      layoutJson={layoutJson}
      width={width}
      height={width * 1.3}
      className={className}
    />
  );
};
