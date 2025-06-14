
import { formatImageUrl } from "@/utils/formatters";

interface ImageDisplayProps {
  imageUrl: string | null;
  alt: string;
  title: string;
  isTwoPager: boolean;
}

export function ImageDisplay({ imageUrl, alt, title, isTwoPager }: ImageDisplayProps) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm text-muted-foreground">{title}</h4>
      <div className={`border rounded-lg overflow-hidden ${isTwoPager ? 'w-full' : ''}`}>
        {imageUrl ? (
          <img
            src={formatImageUrl(imageUrl) || ''}
            alt={alt}
            className={`w-full h-auto ${isTwoPager ? 'max-w-none' : ''}`}
            style={isTwoPager ? { aspectRatio: 'auto' } : {}}
          />
        ) : (
          <div className={`w-full bg-muted flex items-center justify-center ${isTwoPager ? 'aspect-[2/1]' : 'aspect-[3/4]'}`}>
            <p className="text-muted-foreground text-sm">No {title.toLowerCase()} available</p>
          </div>
        )}
      </div>
    </div>
  );
}
