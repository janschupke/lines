/**
 * Comprehensive XSS prevention utilities for player name sanitization
 */

// Dangerous characters and patterns that could be used for XSS attacks

// Maximum allowed length for player names
const MAX_NAME_LENGTH = 50;

// Default fallback name
const DEFAULT_NAME = '🍆';

/**
 * Remove HTML tags but keep inner content
 */
function stripHtmlTags(str: string): string {
  // Remove tag names for opening/closing tags, but only angle brackets for self-closing tags
  // Remove opening/closing tags (e.g., <div>Hello</div> -> Hello, <script>alert(1)</script> -> alert(1))
  let result = str.replace(/<([a-z][a-z0-9]*)\b[^>]*>([\s\S]*?)<\/\1>/gi, '$2');
  // Remove only angle brackets for self-closing tags (e.g., <img src="x"> -> img src="x")
  result = result.replace(/<([^\s>]+)([^>]*)>/gi, '$1$2');
  return result.trim();
}

/**
 * Remove dangerous JS/CSS/URL prefixes (e.g., javascript:, vbscript:, data:, etc.)
 * Only remove the prefix, not the function name or value after the colon.
 */
function stripDangerousPrefixes(str: string): string {
  return str
    .replace(/\bjavascript:/gi, '')
    .replace(/\bvbscript:/gi, '')
    .replace(/\bdata:/gi, '')
    .replace(/\bexpression\s*\(/gi, 'expression(')
    .replace(/\burl\s*\(/gi, 'url(')
    .replace(/\bunion\s+select/gi, '')
    .replace(/\bdrop\s+table/gi, '')
    .replace(/\binsert\s+into/gi, '')
    .replace(/\bdelete\s+from/gi, '')
    .replace(/\bupdate\s+set/gi, '')
    .replace(/\beval\s*\(/gi, 'eval(')
    .replace(/\bsetTimeout\s*\(/gi, 'setTimeout(')
    .replace(/\bsetInterval\s*\(/gi, 'setInterval(')
    .replace(/\bdocument\./gi, '')
    .replace(/\bwindow\./gi, '')
    .replace(/\blocation\./gi, '')
    .replace(/\bhistory\./gi, '')
    .replace(/\bnavigator\./gi, '')
    .replace(/\bscreen\./gi, '')
    .replace(/\blocalStorage\./gi, '')
    .replace(/\bsessionStorage\./gi, '')
    .replace(/\bcookie/gi, '')
    .replace(/\bconsole\./gi, '');
}

/**
 * Remove dangerous characters, but preserve quotes inside parentheses or after =
 */
function removeDangerousChars(str: string): string {
  // Remove <, >, & always
  const result = str.replace(/[<>&]/g, '');
  let output = '';
  let parenDepth = 0;
  let inAttrValue = false;
  let attrQuote = '';
  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    if (char === '(') parenDepth++;
    if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    // Attribute value detection
    if (!inAttrValue && (char === '"' || char === "'")) {
      // Check if previous non-space char is =
      let j = i - 1;
      while (j >= 0 && (result[j] === ' ' || result[j] === '\t')) j--;
      if (j >= 0 && result[j] === '=') {
        inAttrValue = true;
        attrQuote = char;
        output += char;
        continue;
      }
    }
    if (inAttrValue && char === attrQuote) {
      inAttrValue = false;
      attrQuote = '';
      output += char;
      continue;
    }
    if ((char === '"' || char === "'") && parenDepth === 0 && !inAttrValue) {
      // skip quote
      continue;
    }
    output += char;
  }
  return output;
}

/**
 * Comprehensive player name sanitization to prevent XSS attacks
 * @param name - The raw player name input
 * @returns Sanitized player name safe for database storage and display
 */
export function sanitizePlayerName(name: string): string {
  if (name === null || name === undefined) {
    return DEFAULT_NAME;
  }
  if (typeof name !== 'string') {
    return DEFAULT_NAME;
  }

  // Trim whitespace
  let sanitized = name.trim();

  // Check length
  if (sanitized.length === 0 || sanitized.length > MAX_NAME_LENGTH) {
    return DEFAULT_NAME;
  }

  // Remove HTML tags but keep inner content
  sanitized = stripHtmlTags(sanitized);
  // If nothing remains after stripping tags, return default
  if (sanitized.trim().length === 0) {
    return DEFAULT_NAME;
  }
  // Remove dangerous JS/CSS/URL prefixes
  sanitized = stripDangerousPrefixes(sanitized);
  // Remove dangerous characters, but preserve quotes in function calls and attribute values
  sanitized = removeDangerousChars(sanitized);
  // Remove any remaining ASCII control characters (0x00-0x1F, 0x7F)
  sanitized = sanitized.split('').filter(c => {
    const code = c.charCodeAt(0);
    return (code > 0x1F && code !== 0x7F) || c === ' ' || c === '\u00A0' || c === '\u200B' || c === '\u200C' || c === '\u200D';
  }).join('');
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
  if (name === null || name === undefined) return false;
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) return false;
  // If HTML tags present
  if (/<[^>]*>/.test(trimmed)) return false;
  // If event handler present
  if (/on\w+\s*=/.test(trimmed)) return false;
  // If dangerous prefix present
  if (/\b(javascript:|vbscript:|data:|expression\s*\(|url\s*\(|union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+set|document\.|window\.|location\.|history\.|navigator\.|screen\.|localStorage\.|sessionStorage\.|cookie|console\.)/i.test(trimmed)) return false;
  // If dangerous chars present (quotes, <, >, &)
  if (/[<>&"']/.test(trimmed)) return false;
  return true;
}

/**
 * Get sanitization error message for a player name
 * @param name - The player name to check
 * @returns Error message if name is unsafe, null if safe
 */
export function getPlayerNameError(name: string): string | null {
  if (name === null || name === undefined) {
    return 'Name is required';
  }
  if (typeof name !== 'string') {
    return 'Name is required';
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return 'Name cannot be empty';
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return `Name must be ${MAX_NAME_LENGTH} characters or less`;
  }
  // If HTML tags present
  if (/<[^>]*>/.test(trimmed)) return 'Name contains invalid characters';
  // If event handler present
  if (/on\w+\s*=/.test(trimmed)) return 'Name contains invalid characters';
  // If dangerous prefix present
  if (/\b(javascript:|vbscript:|data:|expression\s*\(|url\s*\(|union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+set|document\.|window\.|location\.|history\.|navigator\.|screen\.|localStorage\.|sessionStorage\.|cookie|console\.)/i.test(trimmed)) return 'Name contains invalid characters';
  // If dangerous chars present (quotes, <, >, &)
  if (/[<>&"']/.test(trimmed)) return 'Name contains invalid characters';
  return null;
} 
