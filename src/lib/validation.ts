// Form Validation Utilities
import { sanitizeInput } from './security';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  sanitize?: boolean; // Auto-sanitize input
  noHtml?: boolean; // Reject HTML tags
  noScript?: boolean; // Reject script-like patterns
  custom?: (value: any) => string | null;
}

// Dangerous patterns to detect
const SCRIPT_PATTERN = /<script|javascript:|on\w+\s*=|data:/i;
const HTML_TAG_PATTERN = /<[^>]+>/;
const SQL_INJECTION_PATTERN = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b.*\b(FROM|INTO|TABLE|DATABASE)\b)|(--)|(\/\*)|(\*\/)/i;

export interface ValidationError {
  field: string;
  message: string;
}

export interface FieldValidation {
  [field: string]: ValidationRule;
}

/**
 * Tek bir alanı doğrular
 */
export function validateField(
  value: any,
  rules: ValidationRule,
  fieldName: string
): string | null {
  // Required check
  if (rules.required) {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} zorunludur`;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return `${fieldName} boş bırakılamaz`;
    }
  }

  // Skip other checks if value is empty and not required
  if (value === undefined || value === null || value === '') {
    return null;
  }

  let strValue = String(value);

  // Sanitize if requested
  if (rules.sanitize && typeof value === 'string') {
    strValue = sanitizeInput(value);
  }

  // Security: Check for script injection
  if (rules.noScript !== false && SCRIPT_PATTERN.test(strValue)) {
    return `${fieldName} geçersiz karakterler içeriyor`;
  }

  // Security: Check for HTML tags
  if (rules.noHtml && HTML_TAG_PATTERN.test(strValue)) {
    return `${fieldName} HTML etiketleri içeremez`;
  }

  // Security: Check for SQL injection patterns
  if (SQL_INJECTION_PATTERN.test(strValue)) {
    return `${fieldName} geçersiz karakterler içeriyor`;
  }

  // MinLength check
  if (rules.minLength !== undefined && strValue.length < rules.minLength) {
    return `${fieldName} en az ${rules.minLength} karakter olmalıdır`;
  }

  // MaxLength check
  if (rules.maxLength !== undefined && strValue.length > rules.maxLength) {
    return `${fieldName} en fazla ${rules.maxLength} karakter olabilir`;
  }

  // Number checks
  if (rules.min !== undefined) {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < rules.min) {
      return `${fieldName} en az ${rules.min} olmalıdır`;
    }
  }

  if (rules.max !== undefined) {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue > rules.max) {
      return `${fieldName} en fazla ${rules.max} olabilir`;
    }
  }

  // Pattern check
  if (rules.pattern && !rules.pattern.test(strValue)) {
    return `${fieldName} geçersiz format`;
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
}

/**
 * Birden fazla alanı doğrular
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  validations: Partial<Record<keyof T, ValidationRule>>,
  fieldLabels?: Partial<Record<keyof T, string>>
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [field, rules] of Object.entries(validations)) {
    if (!rules) continue;
    const label = fieldLabels?.[field as keyof T] || field;
    const error = validateField(data[field], rules, label);
    if (error) {
      errors.push({ field, message: error });
    }
  }

  return errors;
}

/**
 * Event form validasyon kuralları
 */
export const eventFormValidation = {
  name: { required: true, minLength: 2, maxLength: 100 },
  date: { required: true },
  startTime: { required: true },
  endTime: { required: true },
  venue: { required: true, minLength: 2, maxLength: 200 }
};

export const eventFieldLabels = {
  name: 'Etkinlik Adı',
  date: 'Tarih',
  startTime: 'Başlangıç Saati',
  endTime: 'Bitiş Saati',
  venue: 'Mekan'
};

/**
 * Participant form validasyon kuralları
 */
export const participantFormValidation = {
  display_name: { required: true, minLength: 2, maxLength: 100 },
  table_no: { maxLength: 20 }
};

export const participantFieldLabels = {
  display_name: 'Ad/Kuruluş Adı',
  table_no: 'Masa No',
  seat_label: 'Koltuk',
  notes: 'Notlar'
};

/**
 * Item form validasyon kuralları
 */
export const itemFormValidation = {
  name: { required: true, minLength: 2, maxLength: 100 },
  initial_target: { required: true, min: 1, max: 999999 }
};

export const itemFieldLabels = {
  name: 'Kalem Adı',
  initial_target: 'Hedef Adet',
  image_url: 'Görsel URL',
  notes: 'Notlar'
};

/**
 * Hata mesajlarını tek string'e çevirir
 */
export function getFirstError(errors: ValidationError[]): string | null {
  return errors.length > 0 ? errors[0].message : null;
}

/**
 * Hata mesajlarını field bazlı map'e çevirir
 */
export function getErrorMap(errors: ValidationError[]): Record<string, string> {
  const map: Record<string, string> = {};
  errors.forEach((e) => {
    if (!map[e.field]) {
      map[e.field] = e.message;
    }
  });
  return map;
}
