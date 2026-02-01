/**
 * Security Module
 * 
 * Provides security utilities including:
 * - XSS protection with DOMPurify
 * - CSRF token management
 * - Rate limiting
 * - Input sanitization
 * - PIN management
 */

import DOMPurify from 'dompurify';
import { securityConfig } from './config';
import { logger } from './logger';

// ============ XSS Protection ============

/**
 * Sanitize HTML string to prevent XSS attacks
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'br'],
    ALLOWED_ATTR: ['class']
  });
}

/**
 * Sanitize plain text (strips all HTML)
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

/**
 * Sanitize user input for form fields
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove any HTML tags
  let clean = sanitizeText(input);
  
  // Trim whitespace
  clean = clean.trim();
  
  // Remove null bytes and other control characters
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return clean;
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) :
        item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

// ============ CSRF Protection ============

const CSRF_TOKEN_KEY = 'polvak_csrf_token';
const CSRF_TOKEN_EXPIRY_KEY = 'polvak_csrf_expiry';
const CSRF_TOKEN_LIFETIME = 60 * 60 * 1000; // 1 hour

/**
 * Generate a cryptographically secure random token
 */
function generateRandomToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate or retrieve CSRF token
 */
export function getCsrfToken(): string {
  const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
  const expiry = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
  
  // Check if token exists and is not expired
  if (storedToken && expiry && Date.now() < parseInt(expiry, 10)) {
    return storedToken;
  }
  
  // Generate new token
  const newToken = generateRandomToken();
  const newExpiry = Date.now() + CSRF_TOKEN_LIFETIME;
  
  sessionStorage.setItem(CSRF_TOKEN_KEY, newToken);
  sessionStorage.setItem(CSRF_TOKEN_EXPIRY_KEY, newExpiry.toString());
  
  return newToken;
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string): boolean {
  const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
  const expiry = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
  
  if (!storedToken || !expiry) {
    logger.warn('CSRF token not found');
    return false;
  }
  
  if (Date.now() >= parseInt(expiry, 10)) {
    logger.warn('CSRF token expired');
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  if (token.length !== storedToken.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Invalidate current CSRF token
 */
export function invalidateCsrfToken(): void {
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
  sessionStorage.removeItem(CSRF_TOKEN_EXPIRY_KEY);
}

// ============ Rate Limiting ============

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if an action is rate limited
 */
export function isRateLimited(key: string): { limited: boolean; remainingTime?: number } {
  const entry = rateLimitStore.get(key);
  
  if (!entry) {
    return { limited: false };
  }
  
  // Check if currently locked
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    return {
      limited: true,
      remainingTime: entry.lockedUntil - Date.now()
    };
  }
  
  // Reset if lockout expired
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    rateLimitStore.delete(key);
    return { limited: false };
  }
  
  return { limited: false };
}

/**
 * Record an attempt for rate limiting
 */
export function recordAttempt(key: string, success: boolean): void {
  if (success) {
    // Reset on success
    rateLimitStore.delete(key);
    return;
  }
  
  const entry = rateLimitStore.get(key) || {
    attempts: 0,
    firstAttempt: Date.now(),
    lockedUntil: null
  };
  
  entry.attempts++;
  
  // Check if should lock
  if (entry.attempts >= securityConfig.maxLoginAttempts) {
    entry.lockedUntil = Date.now() + securityConfig.lockoutDuration;
    logger.warn(`Rate limit exceeded for ${key}, locked for ${securityConfig.lockoutDuration / 60000} minutes`);
  }
  
  rateLimitStore.set(key, entry);
}

/**
 * Get remaining attempts before lockout
 */
export function getRemainingAttempts(key: string): number {
  const entry = rateLimitStore.get(key);
  if (!entry) {
    return securityConfig.maxLoginAttempts;
  }
  return Math.max(0, securityConfig.maxLoginAttempts - entry.attempts);
}

// ============ PIN Management ============

const OPERATOR_PIN_KEY = 'polvak_operator_pin';
const PIN_HASH_SALT = 'polvak_salt_v1';

/**
 * Simple hash function for PIN storage (NOT cryptographically secure, use bcrypt in real backend)
 */
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(PIN_HASH_SALT + pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get current operator PIN (hashed in storage, returns raw for comparison)
 */
export function getOperatorPin(): string {
  // Check if custom PIN is stored
  const storedPin = localStorage.getItem(OPERATOR_PIN_KEY);
  if (storedPin) {
    // Return stored PIN directly (it's stored hashed but we need to compare hashes)
    return storedPin;
  }
  
  // Fall back to environment PIN
  return securityConfig.operatorPin;
}

/**
 * Verify operator PIN
 */
export async function verifyOperatorPin(inputPin: string): Promise<boolean> {
  const storedPin = localStorage.getItem(OPERATOR_PIN_KEY);
  
  if (storedPin) {
    // Compare hashed input with stored hash
    const inputHash = await hashPin(inputPin);
    return inputHash === storedPin;
  }
  
  // Compare with environment PIN (plain text in dev)
  return inputPin === securityConfig.operatorPin;
}

/**
 * Change operator PIN (requires admin PIN)
 */
export async function changeOperatorPin(
  currentAdminPin: string, 
  newOperatorPin: string
): Promise<{ success: boolean; error?: string }> {
  // Verify admin PIN
  if (currentAdminPin !== securityConfig.adminPin) {
    logger.warn('Failed admin PIN verification for PIN change');
    return { success: false, error: 'Geçersiz admin PIN' };
  }
  
  // Validate new PIN format
  if (!/^\d{4}$/.test(newOperatorPin)) {
    return { success: false, error: 'PIN 4 haneli rakamlardan oluşmalıdır' };
  }
  
  // Hash and store new PIN
  const hashedPin = await hashPin(newOperatorPin);
  localStorage.setItem(OPERATOR_PIN_KEY, hashedPin);
  
  logger.info('Operator PIN changed successfully');
  return { success: true };
}

/**
 * Reset operator PIN to default (requires admin PIN)
 */
export function resetOperatorPin(adminPin: string): boolean {
  if (adminPin !== securityConfig.adminPin) {
    return false;
  }
  
  localStorage.removeItem(OPERATOR_PIN_KEY);
  logger.info('Operator PIN reset to default');
  return true;
}

// ============ Session Security ============

const SESSION_KEY = 'polvak_session';
const SESSION_TIMESTAMP_KEY = 'polvak_session_ts';

interface SessionData {
  authenticated: boolean;
  timestamp: number;
  csrfToken: string;
}

/**
 * Create authenticated session
 */
export function createSession(): void {
  const sessionData: SessionData = {
    authenticated: true,
    timestamp: Date.now(),
    csrfToken: getCsrfToken()
  };
  
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  sessionStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
}

/**
 * Check if session is valid
 */
export function isSessionValid(): boolean {
  const sessionStr = sessionStorage.getItem(SESSION_KEY);
  const timestamp = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);
  
  if (!sessionStr || !timestamp) {
    return false;
  }
  
  try {
    const session: SessionData = JSON.parse(sessionStr);
    
    // Check if session expired
    if (Date.now() - session.timestamp > securityConfig.sessionTimeout) {
      destroySession();
      return false;
    }
    
    return session.authenticated;
  } catch {
    return false;
  }
}

/**
 * Refresh session timestamp
 */
export function refreshSession(): void {
  const sessionStr = sessionStorage.getItem(SESSION_KEY);
  if (sessionStr) {
    try {
      const session: SessionData = JSON.parse(sessionStr);
      session.timestamp = Date.now();
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      sessionStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    } catch {
      // Ignore parse errors
    }
  }
}

/**
 * Destroy session
 */
export function destroySession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_TIMESTAMP_KEY);
  invalidateCsrfToken();
}

// ============ Input Validation Helpers ============

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (Turkish)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Turkish phone: 10 digits starting with 5 (mobile) or 10-11 digits
  return /^(5\d{9}|0?[1-9]\d{9})$/.test(cleaned);
}

/**
 * Validate numeric input
 */
export function isValidNumber(value: string, options: { min?: number; max?: number; decimal?: boolean } = {}): boolean {
  const { min, max, decimal = false } = options;
  
  const regex = decimal ? /^-?\d+(\.\d+)?$/ : /^-?\d+$/;
  if (!regex.test(value)) {
    return false;
  }
  
  const num = parseFloat(value);
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  
  return true;
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
