import { useState, useCallback } from 'react';
import { ExpectedElements, ValidationError, DriftWarning, ExpectedElement } from '@/types/magazine';

export const useFormValidation = () => {
  const [errors, setErrors] = useState<Record<number, ValidationError[]>>({});
  const [warnings, setWarnings] = useState<Record<number, DriftWarning[]>>({});

  const validateField = useCallback((
    fieldName: string,
    value: string | string[] | File | null,
    config: ExpectedElement,
    spreadIndex: number
  ) => {
    const fieldErrors: ValidationError[] = [];
    const fieldWarnings: DriftWarning[] = [];

    // Required field validation
    if (config.mandatory) {
      if (!value || (typeof value === 'string' && value.trim() === '') || 
          (Array.isArray(value) && value.length === 0)) {
        fieldErrors.push({
          field: fieldName,
          message: `${fieldName} is required`
        });
      }
    }

    if (config.type === 'string' || config.type === 'char') {
      const stringValue = value as string || '';
      
      // Character limit validation
      if (config.maxChars && stringValue.length > config.maxChars) {
        fieldWarnings.push({
          field: fieldName,
          type: 'length',
          message: `Text exceeds ${config.maxChars} characters (${stringValue.length})`
        });
      }
    }

    if (config.type === 'array') {
      const arrayValue = value as string[] || [];
      
      // Array length validation
      if (config.minItems && arrayValue.length < config.minItems) {
        fieldErrors.push({
          field: fieldName,
          message: `Minimum ${config.minItems} items required`
        });
      }

      if (config.maxItems && arrayValue.length > config.maxItems) {
        fieldWarnings.push({
          field: fieldName,
          type: 'count',
          message: `Exceeds maximum ${config.maxItems} items (${arrayValue.length})`
        });
      }

      // Validate each array item
      arrayValue.forEach((item, index) => {
        if (config.items?.maxChars && item.length > config.items.maxChars) {
          fieldWarnings.push({
            field: fieldName,
            type: 'length',
            message: `Item ${index + 1} exceeds ${config.items.maxChars} characters (${item.length})`
          });
        }
      });
    }

    return { errors: fieldErrors, warnings: fieldWarnings };
  }, []);

  const validateSpread = useCallback((
    spreadData: Record<string, string | string[] | File | null>,
    expectedElements: ExpectedElements,
    spreadIndex: number
  ) => {
    const spreadErrors: ValidationError[] = [];
    const spreadWarnings: DriftWarning[] = [];

    Object.entries(expectedElements).forEach(([fieldName, config]) => {
      const value = spreadData[fieldName];
      const { errors: fieldErrors, warnings: fieldWarnings } = validateField(
        fieldName,
        value,
        config,
        spreadIndex
      );
      
      spreadErrors.push(...fieldErrors);
      spreadWarnings.push(...fieldWarnings);
    });

    setErrors(prev => ({ ...prev, [spreadIndex]: spreadErrors }));
    setWarnings(prev => ({ ...prev, [spreadIndex]: spreadWarnings }));

    return { errors: spreadErrors, warnings: spreadWarnings };
  }, [validateField]);

  return {
    errors,
    warnings,
    validateField,
    validateSpread,
    clearValidation: () => {
      setErrors({});
      setWarnings({});
    }
  };
}; 