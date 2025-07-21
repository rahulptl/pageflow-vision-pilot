import React from 'react';

interface GeometryRect {
  width: number;
  height: number;
}

interface Transform {
  a: number; // x-scale
  b: number; // y-skew
  c: number; // x-skew  
  d: number; // y-scale
  e: number; // x-translate
  f: number; // y-translate
}

interface LayoutObject {
  id: number;
  type: 'text' | 'image';
  geometry: string; // "x y width height" - but we only use width/height
  transform: string; // "a b c d e f" matrix - e,f are actual x,y positions
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
  layoutJson: any; // More flexible to handle various JSON structures
  width?: number;
  height?: number;
  className?: string;
}

// Parse geometry to get only width and height (ignore x,y from geometry)
const parseGeometry = (geometry: string): GeometryRect => {
  const parts = geometry.split(' ').map(Number);
  // geometry format: "x y width height" but we only need width/height
  return { 
    width: parts[2] || 0, 
    height: parts[3] || 0 
  };
};

// Parse transform matrix
const parseTransform = (transform: string): Transform => {
  const [a, b, c, d, e, f] = transform.split(' ').map(Number);
  return { a: a || 1, b: b || 0, c: c || 0, d: d || 1, e: e || 0, f: f || 0 };
};

const getAllObjects = (page: LayoutPage): LayoutObject[] => {
  const backgroundObjects = page.objects.Background || [];
  const foregroundObjects = page.objects.Foreground || [];
  return [...backgroundObjects, ...foregroundObjects];
};

export const LayoutRenderer: React.FC<Props> = ({ 
  layoutJson, 
  width = 150, 
  height,
  className = "" 
}) => {
  if (!layoutJson) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded ${className}`} style={{ width, height: height || width * 1.3 }}>
        <span className="text-xs text-muted-foreground">No layout data</span>
      </div>
    );
  }
  
  if (!layoutJson?.document?.pages) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded ${className}`} style={{ width, height: height || width * 1.3 }}>
        <span className="text-xs text-muted-foreground">Invalid layout structure</span>
      </div>
    );
  }

  const document = layoutJson.document;
  const pages = document.pages;
  const pageSize = document.settings?.pageSize || { width: 612, height: 792 };
  
  const numPages = pages.length;
  const isSpread = numPages > 1;
  
  // Calculate scale and dimensions
  const scale = isSpread 
    ? (width / numPages) / pageSize.width
    : width / pageSize.width;
    
  const svgWidth = width;
  const svgHeight = height || (isSpread 
    ? pageSize.height * scale 
    : pageSize.height * numPages * scale);

  return (
    <div className={`bg-white rounded border overflow-hidden ${className}`} style={{ width: svgWidth, height: svgHeight }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {pages.map((page, pageIndex) => {
          const xTranslate = isSpread ? pageIndex * (width / numPages) : 0;
          const yTranslate = isSpread ? 0 : pageIndex * (pageSize.height * scale);
          
          const allObjects = getAllObjects(page);
          
          return (
            <g key={pageIndex} transform={`translate(${xTranslate}, ${yTranslate}) scale(${scale})`}>
              {/* Page background */}
              <rect
                width={pageSize.width}
                height={pageSize.height}
                fill="white"
                stroke="#e5e7eb"
                strokeWidth={1 / scale}
              />
              
              {/* Render objects */}
              {allObjects.map((obj) => {
                const geom = parseGeometry(obj.geometry);
                const transform = parseTransform(obj.transform);
                
                // Get color based on object type
                const getObjectColor = () => {
                  if (obj.type === 'text') {
                    // Different colors for different text types
                    switch (obj.textType) {
                      case 'headline': return '#dc2626'; // red-600
                      case 'body copy': return '#ea580c'; // orange-600
                      case 'caption': return '#d97706'; // amber-600
                      case 'byline': return '#ca8a04'; // yellow-600
                      default: return '#e74c3c'; // default red for text
                    }
                  } else if (obj.type === 'image') {
                    // Different colors for different image types
                    switch (obj.imageType) {
                      case 'feature image': return '#2563eb'; // blue-600
                      case 'inline image': return '#7c3aed'; // violet-600
                      default: return '#3498db'; // default blue for images
                    }
                  }
                  return '#6b7280'; // gray-500 fallback
                };
                
                return (
                  <rect
                    key={obj.id}
                    x={0}
                    y={0}
                    width={geom.width}
                    height={geom.height}
                    fill="none"
                    stroke={getObjectColor()}
                    strokeWidth={1 / scale}
                    transform={`matrix(${transform.a}, ${transform.b}, ${transform.c}, ${transform.d}, ${transform.e}, ${transform.f})`}
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

// Simplified version for thumbnails
export const LayoutThumbnail: React.FC<Props> = ({ layoutJson, width = 80, className = "" }) => {
  return (
    <LayoutRenderer 
      layoutJson={layoutJson} 
      width={width} 
      height={width * 1.3}
      className={className}
    />
  );
};