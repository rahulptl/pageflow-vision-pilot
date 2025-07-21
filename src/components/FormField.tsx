import React from 'react';
import { ExpectedElement } from '@/types/magazine';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Upload, Type, Image, AlignLeft } from 'lucide-react';

interface FormFieldProps {
  fieldName: string;
  config: ExpectedElement;
  value: string | string[] | File | null;
  onChange: (value: string | string[] | File | null) => void;
  errors?: string[];
  warnings?: string[];
}

export const FormField: React.FC<FormFieldProps> = ({
  fieldName,
  config,
  value,
  onChange,
  errors = [],
  warnings = []
}) => {
  const getFieldIcon = () => {
    if (config.type === 'image') return <Image className="h-4 w-4" />;
    if (fieldName.toLowerCase().includes('headline') || fieldName.toLowerCase().includes('masthead')) return <Type className="h-4 w-4" />;
    return <AlignLeft className="h-4 w-4" />;
  };

  const getFieldLabel = () => {
    // Convert field names like "section_header_1" to "Section Header"
    const cleanName = fieldName
      .replace(/_\d+$/, '') // Remove trailing numbers
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
    
    return cleanName;
  };

  const getFieldDescription = () => {
    const descriptions: Record<string, string> = {
      'headline': 'Large, eye-catching title text',
      'masthead': 'Main publication or article title',
      'section header': 'Category or section identifier',
      'body copy': 'Main article content paragraphs',
      'sidebar text': 'Supporting information or callout text',
      'caption': 'Image or content description',
      'author': 'Article author or byline',
      'page number': 'Page numbering (auto-generated)',
      'infobox': 'Highlighted information boxes',
      'callout': 'Special highlighted text or quotes',
      'hero image number': 'Large decorative number',
      'feature image': 'Main hero image for the layout',
      'photo collage': 'Collection of related images',
      'inline image': 'Supporting image within content',
      'thumbnail': 'Small preview or icon image'
    };
    
    // Find the key that matches the beginning of the field name
    const key = Object.keys(descriptions).find(k => 
      fieldName.toLowerCase().replace(/_/g, ' ').includes(k.toLowerCase())
    );
    return key ? descriptions[key] : 'Content for this layout element';
  };

  const renderStringField = () => {
    const stringValue = (value as string) || '';
    const isOverLimit = config.maxChars && stringValue.length > config.maxChars;
    const isLong = config.maxChars && config.maxChars > 100;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getFieldIcon()}
            <div>
              <label className="text-sm font-medium">
                {getFieldLabel()}
                {config.mandatory && <span className="text-red-500 ml-1">*</span>}
              </label>
              <p className="text-xs text-muted-foreground">{getFieldDescription()}</p>
            </div>
          </div>
          {config.maxChars && (
            <Badge 
              variant={isOverLimit ? "destructive" : "secondary"} 
              className="text-xs"
            >
              {stringValue.length}/{config.maxChars}
            </Badge>
          )}
        </div>
        
        {isLong ? (
          <Textarea
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${getFieldLabel().toLowerCase()}...`}
            className={`resize-none ${isOverLimit ? 'border-red-300 focus:border-red-500' : ''}`}
            rows={4}
          />
        ) : (
          <Input
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${getFieldLabel().toLowerCase()}...`}
            className={isOverLimit ? 'border-red-300 focus:border-red-500' : ''}
          />
        )}
      </div>
    );
  };

  const renderArrayField = () => {
    const arrayValue = (value as string[]) || [''];
    const itemCount = arrayValue.length;
    const isOverLimit = config.maxItems && itemCount > config.maxItems;
    const isUnderLimit = config.minItems && itemCount < config.minItems;

    const addItem = () => {
      const newArray = [...arrayValue, ''];
      onChange(newArray);
    };

    const removeItem = (index: number) => {
      const newArray = arrayValue.filter((_, i) => i !== index);
      onChange(newArray);
    };

    const updateItem = (index: number, newValue: string) => {
      const newArray = [...arrayValue];
      newArray[index] = newValue;
      onChange(newArray);
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getFieldIcon()}
            <div>
              <label className="text-sm font-medium">
                {getFieldLabel()}
                {config.mandatory && <span className="text-red-500 ml-1">*</span>}
              </label>
              <p className="text-xs text-muted-foreground">{getFieldDescription()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isOverLimit || isUnderLimit ? "destructive" : "secondary"} 
              className="text-xs"
            >
              {itemCount}/{config.maxItems || '∞'} items
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              disabled={config.maxItems && itemCount >= config.maxItems}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {arrayValue.map((item, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  value={item}
                  onChange={(e) => updateItem(index, e.target.value)}
                  placeholder={`${getFieldLabel()} ${index + 1}...`}
                  className="resize-none"
                  rows={3}
                />
                {config.items?.maxChars && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.length}/{config.items.maxChars} characters
                  </div>
                )}
              </div>
              {arrayValue.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="mt-0 h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderImageField = () => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      onChange(file);
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          <div>
            <label className="text-sm font-medium">
              {getFieldLabel()}
              {config.mandatory && <span className="text-red-500 ml-1">*</span>}
            </label>
            <p className="text-xs text-muted-foreground">{getFieldDescription()}</p>
          </div>
        </div>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50/50">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor={`file-${fieldName}`} className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Upload {getFieldLabel().toLowerCase()}
                </span>
                {config.ratio && (
                  <span className="text-xs text-muted-foreground">
                    Optimal ratio: {config.ratio}
                  </span>
                )}
              </label>
              <input
                id={`file-${fieldName}`}
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>
          {value && value instanceof File && (
            <div className="mt-2 text-sm text-green-600 text-center">
              ✓ Selected: {value.name}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderField = () => {
    switch (config.type) {
      case 'string':
      case 'char':
        return renderStringField();
      case 'array':
        return renderArrayField();
      case 'image':
        return renderImageField();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {renderField()}
      
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}
      
      {/* Warning Messages */}
      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((warning, index) => (
            <p key={index} className="text-sm text-amber-600">
              ⚠️ {warning}
            </p>
          ))}
        </div>
      )}
      
      {/* Text length overflow warning */}
      {config.type === 'string' && config.maxChars && (
        typeof value === 'string' && value.length > config.maxChars
      ) && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
          ⚠️ Text will be overflown in the layout when rendered. Consider shortening your content.
        </div>
      )}
    </div>
  );
}; 