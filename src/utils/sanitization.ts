/**
 * Comprehensive XSS prevention utilities for player name sanitization
 */

// Dangerous characters and patterns that could be used for XSS attacks
const XSS_PATTERNS = [
  // HTML tags and entities
  /<[^>]*>/gi,
  /&[a-zA-Z0-9#]+;/gi,
  
  // JavaScript injection patterns
  /javascript:/gi,
  /vbscript:/gi,
  /data:/gi,
  /on\w+\s*=/gi,
  
  // CSS injection patterns
  /expression\s*\(/gi,
  /url\s*\(/gi,
  
  // SQL injection patterns
  /union\s+select/gi,
  /drop\s+table/gi,
  /insert\s+into/gi,
  /delete\s+from/gi,
  /update\s+set/gi,
  
  // Other dangerous patterns
  /eval\s*\(/gi,
  /setTimeout\s*\(/gi,
  /setInterval\s*\(/gi,
  /document\./gi,
  /window\./gi,
  /location\./gi,
  /history\./gi,
  /navigator\./gi,
  /screen\./gi,
  /localStorage\./gi,
  /sessionStorage\./gi,
  /cookie/gi,
  /alert\s*\(/gi,
  /confirm\s*\(/gi,
  /prompt\s*\(/gi,
  /console\./gi,
  
  // Null bytes and control characters
  /\u0000/g,
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
];

// Characters that should be removed entirely
const DANGEROUS_CHARS = /[<>"'&]/g;

// Maximum allowed length for player names
const MAX_NAME_LENGTH = 50;

// Default fallback name
const DEFAULT_NAME = '🍆';

/**
 * Comprehensive player name sanitization to prevent XSS attacks
 * @param name - The raw player name input
 * @returns Sanitized player name safe for database storage and display
 */
export function sanitizePlayerName(name: string): string {
  if (!name || typeof name !== 'string') {
    return DEFAULT_NAME;
  }

  // Trim whitespace
  let sanitized = name.trim();
  
  // Check length
  if (sanitized.length === 0 || sanitized.length > MAX_NAME_LENGTH) {
    return DEFAULT_NAME;
  }

  // Remove dangerous patterns
  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Remove dangerous characters
  sanitized = sanitized.replace(DANGEROUS_CHARS, '');

  // Remove any remaining control characters
  sanitized = sanitized.replace(/[\u0000-\u001F\u007F]/g, '');

  // Normalize whitespace (replace multiple spaces with single space)
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Trim again after sanitization
  sanitized = sanitized.trim();

  // Return default if nothing remains after sanitization
  if (sanitized.length === 0) {
    return DEFAULT_NAME;
  }

  return sanitized;
}

/**
 * Validate if a player name is safe without sanitizing
 * @param name - The player name to validate
 * @returns True if the name is safe, false otherwise
 */
export function isPlayerNameSafe(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) {
    return false;
  }

  // Check for dangerous patterns
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // Check for dangerous characters
  if (DANGEROUS_CHARS.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Get sanitization error message for a player name
 * @param name - The player name to check
 * @returns Error message if name is unsafe, null if safe
 */
export function getPlayerNameError(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return 'Name is required';
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return 'Name cannot be empty';
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    return `Name must be ${MAX_NAME_LENGTH} characters or less`;
  }

  // Check for dangerous patterns
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return 'Name contains invalid characters';
    }
  }

  // Check for dangerous characters
  if (DANGEROUS_CHARS.test(trimmed)) {
    return 'Name contains invalid characters';
  }

  return null;
} 
