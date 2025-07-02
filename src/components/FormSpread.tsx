import React from 'react';
import { Spread, ValidationError, DriftWarning } from '../types/magazine';
import { FormField } from './FormField.tsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Layout } from 'lucide-react';
import { formatImageUrl } from '../utils/formatters';

interface FormSpreadProps {
  spread: Spread;
  spreadIndex: number;
  data: Record<string, string | string[] | File | null>;
  onChange: (fieldName: string, value: string | string[] | File | null) => void;
  errors?: ValidationError[];
  warnings?: DriftWarning[];
  boundingBoxImage?: string | null;
}

export const FormSpread: React.FC<FormSpreadProps> = ({
  spread,
  spreadIndex,
  data,
  onChange,
  errors = [],
  warnings = [],
  boundingBoxImage
}) => {
  const getPageTitle = () => {
    return `Page ${spreadIndex + 1}`;
  };

  const getFieldErrors = (fieldName: string) => {
    return errors.filter(error => error.field === fieldName).map(error => error.message);
  };

  const getFieldWarnings = (fieldName: string) => {
    return warnings.filter(warning => warning.field === fieldName).map(warning => warning.message);
  };

  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  return (
    <Card className={`${hasErrors ? 'border-red-300' : hasWarnings ? 'border-amber-300' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            {getPageTitle()}
          </CardTitle>
          <div className="flex gap-2">
            {hasErrors && (
              <Badge variant="destructive">
                {errors.length} Error{errors.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {hasWarnings && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Layout Reference */}
      {boundingBoxImage && (
        <div className="px-6 pb-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">Layout Reference</h4>
            <div className="border rounded-lg overflow-hidden bg-muted/30">
              <img
                src={formatImageUrl(boundingBoxImage) || ''}
                alt={`Page ${spreadIndex + 1} layout reference`}
                className="w-full h-auto max-h-64 object-contain"
              />
            </div>
          </div>
        </div>
      )}
      
      <CardContent className="space-y-6 p-6">
        {/* Dynamic Fields */}
        <div className="space-y-6">
          {Object.entries(spread.expected_elements).map(([fieldName, config]) => (
            <FormField
              key={fieldName}
              fieldName={fieldName}
              config={config}
              value={data[fieldName] || (config.type === 'array' ? [''] : '')}
              onChange={(value) => onChange(fieldName, value)}
              errors={getFieldErrors(fieldName)}
              warnings={getFieldWarnings(fieldName)}
            />
          ))}
        </div>

        {/* Layout Adjustment Info */}
        {hasWarnings && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-amber-800">Layout Adjustments</span>
            </div>
            <p className="text-xs text-amber-700">
              Your content exceeds the original layout bounds. AI will intelligently adjust fonts, spacing, and positioning to accommodate your content.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 