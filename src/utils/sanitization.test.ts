import { describe, it, expect } from 'vitest';
import { sanitizePlayerName, isPlayerNameSafe, getPlayerNameError } from './sanitization';

describe('sanitization', () => {
  describe('sanitizePlayerName', () => {
    it('should return default name for empty input', () => {
      expect(sanitizePlayerName('')).toBe('🍆');
      expect(sanitizePlayerName('   ')).toBe('🍆');
      expect(sanitizePlayerName(null as any)).toBe('🍆');
      expect(sanitizePlayerName(undefined as any)).toBe('🍆');
    });

    it('should return default name for names that are too long', () => {
      const longName = 'a'.repeat(51);
      expect(sanitizePlayerName(longName)).toBe('🍆');
    });

    it('should remove HTML tags', () => {
      expect(sanitizePlayerName('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizePlayerName('<img src="x" onerror="alert(1)">')).toBe('img src="x" onerror="alert(1)"');
      expect(sanitizePlayerName('<div>Hello</div>')).toBe('Hello');
    });

    it('should remove JavaScript injection patterns', () => {
      expect(sanitizePlayerName('javascript:alert(1)')).toBe('alert(1)');
      expect(sanitizePlayerName('vbscript:msgbox("test")')).toBe('msgbox("test")');
      expect(sanitizePlayerName('data:text/html,<script>alert(1)</script>')).toBe('text/html,scriptalert(1)/script');
    });

    it('should remove event handlers', () => {
      expect(sanitizePlayerName('onclick=alert(1)')).toBe('alert(1)');
      expect(sanitizePlayerName('onload=alert(1)')).toBe('alert(1)');
      expect(sanitizePlayerName('onmouseover=alert(1)')).toBe('alert(1)');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizePlayerName('Hello<World>')).toBe('HelloWorld');
      expect(sanitizePlayerName('Test"Quote')).toBe('TestQuote');
      expect(sanitizePlayerName('Test\'Quote')).toBe('TestQuote');
      expect(sanitizePlayerName('Test&Amp')).toBe('TestAmp');
    });

    it('should normalize whitespace', () => {
      expect(sanitizePlayerName('  Hello   World  ')).toBe('Hello World');
      expect(sanitizePlayerName('Multiple    Spaces')).toBe('Multiple Spaces');
    });

    it('should preserve valid names', () => {
      expect(sanitizePlayerName('John Doe')).toBe('John Doe');
      expect(sanitizePlayerName('Player123')).toBe('Player123');
      expect(sanitizePlayerName('Test-User')).toBe('Test-User');
      expect(sanitizePlayerName('User_Name')).toBe('User_Name');
    });

    it('should handle edge cases', () => {
      expect(sanitizePlayerName('a'.repeat(50))).toBe('a'.repeat(50));
      expect(sanitizePlayerName('🍆')).toBe('🍆');
      expect(sanitizePlayerName('Test<script>alert(1)</script>Name')).toBe('Testalert(1)Name');
    });
  });

  describe('isPlayerNameSafe', () => {
    it('should return false for empty input', () => {
      expect(isPlayerNameSafe('')).toBe(false);
      expect(isPlayerNameSafe('   ')).toBe(false);
      expect(isPlayerNameSafe(null as any)).toBe(false);
      expect(isPlayerNameSafe(undefined as any)).toBe(false);
    });

    it('should return false for names that are too long', () => {
      const longName = 'a'.repeat(51);
      expect(isPlayerNameSafe(longName)).toBe(false);
    });

    it('should return false for names with HTML tags', () => {
      expect(isPlayerNameSafe('<script>alert(1)</script>')).toBe(false);
      expect(isPlayerNameSafe('<div>Hello</div>')).toBe(false);
    });

    it('should return false for names with JavaScript injection', () => {
      expect(isPlayerNameSafe('javascript:alert(1)')).toBe(false);
      expect(isPlayerNameSafe('onclick=alert(1)')).toBe(false);
    });

    it('should return false for names with dangerous characters', () => {
      expect(isPlayerNameSafe('Hello<World>')).toBe(false);
      expect(isPlayerNameSafe('Test"Quote')).toBe(false);
      expect(isPlayerNameSafe('Test\'Quote')).toBe(false);
      expect(isPlayerNameSafe('Test&Amp')).toBe(false);
    });

    it('should return true for valid names', () => {
      expect(isPlayerNameSafe('John Doe')).toBe(true);
      expect(isPlayerNameSafe('Player123')).toBe(true);
      expect(isPlayerNameSafe('Test-User')).toBe(true);
      expect(isPlayerNameSafe('User_Name')).toBe(true);
      expect(isPlayerNameSafe('🍆')).toBe(true);
    });
  });

  describe('getPlayerNameError', () => {
    it('should return error for empty input', () => {
      expect(getPlayerNameError('')).toBe('Name cannot be empty');
      expect(getPlayerNameError('   ')).toBe('Name cannot be empty');
      expect(getPlayerNameError(null as any)).toBe('Name is required');
      expect(getPlayerNameError(undefined as any)).toBe('Name is required');
    });

    it('should return error for names that are too long', () => {
      const longName = 'a'.repeat(51);
      expect(getPlayerNameError(longName)).toBe('Name must be 50 characters or less');
    });

    it('should return error for names with invalid characters', () => {
      expect(getPlayerNameError('<script>alert(1)</script>')).toBe('Name contains invalid characters');
      expect(getPlayerNameError('javascript:alert(1)')).toBe('Name contains invalid characters');
      expect(getPlayerNameError('Hello<World>')).toBe('Name contains invalid characters');
      expect(getPlayerNameError('Test"Quote')).toBe('Name contains invalid characters');
    });

    it('should return null for valid names', () => {
      expect(getPlayerNameError('John Doe')).toBe(null);
      expect(getPlayerNameError('Player123')).toBe(null);
      expect(getPlayerNameError('Test-User')).toBe(null);
      expect(getPlayerNameError('User_Name')).toBe(null);
      expect(getPlayerNameError('🍆')).toBe(null);
    });
  });
}); 
