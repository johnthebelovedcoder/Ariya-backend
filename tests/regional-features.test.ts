// tests/regional-features.test.ts
import { describe, it, expect } from 'vitest';
import { ConfigService } from '../src/lib/config-service';
import { EnhancedCurrencyService, LocalizationService } from '../src/lib/enhanced-currency-service';
import { CurrencyService } from '../src/lib/currency-service';

describe('Regional Features Tests', () => {
  describe('Config Service', () => {
    it('should get regional settings for different countries', () => {
      const config = ConfigService.getInstance();
      
      const usSettings = config.getRegionalSettings('US');
      expect(usSettings.currency).toBe('USD');
      expect(usSettings.timezone).toBe('America/New_York');
      expect(usSettings.locale).toBe('en-US');
      
      const ngSettings = config.getRegionalSettings('NG');
      expect(ngSettings.currency).toBe('NGN');
      expect(ngSettings.timezone).toBe('Africa/Lagos');
      expect(ngSettings.locale).toBe('en-NG');
      
      const deSettings = config.getRegionalSettings('DE');
      expect(deSettings.currency).toBe('EUR');
      expect(deSettings.timezone).toBe('Europe/Berlin');
      expect(deSettings.locale).toBe('de-DE');
    });
    
    it('should return default settings for unknown country', () => {
      const config = ConfigService.getInstance();
      const defaultSettings = config.getRegionalSettings('XX');
      
      expect(defaultSettings.currency).toBe('USD');
      expect(defaultSettings.timezone).toBe('UTC');
    });
  });
  
  describe('Currency Service', () => {
    it('should convert between currencies', () => {
      // Basic conversion test
      const result = EnhancedCurrencyService.convert('USD', 'NGN', 1);
      
      // Check that conversion is reasonable (approx 1500 NGN per USD)
      expect(result).toBeGreaterThan(1000); // Roughly correct
      expect(result).toBeLessThan(2000);    // Roughly correct
    });
    
    it('should format currency with proper locale', () => {
      const formatted = EnhancedCurrencyService.formatCurrency(1234.56, 'USD', 'en-US');
      expect(formatted).toContain('$');
      expect(formatted).toContain('1,234.56');
      
      const formattedGerman = EnhancedCurrencyService.formatCurrency(1234.56, 'EUR', 'de-DE');
      expect(formattedGerman).toContain('€');
      // German locale uses comma as decimal separator
      expect(formattedGerman).toContain('1.234,56');
    });
    
    it('should support enhanced currency formatting via CurrencyService', () => {
      const result = CurrencyService.formatCurrencyEnhanced(1234.56, 'USD', 'en-US');
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });
  });
  
  describe('Localization Service', () => {
    it('should format dates with proper locale', () => {
      const date = new Date('2023-01-15T10:30:00Z');
      const formatter = LocalizationService.getDateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const formatted = formatter.format(date);
      // Should contain month name, day, and year
      expect(formatted.toLowerCase()).toContain('january');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2023');
    });
    
    it('should translate messages with parameters', () => {
      const translated = LocalizationService.translate(
        'welcome_message', 
        'en-US', 
        { name: 'John' }
      );
      
      expect(translated).toBe('Welcome to Ariya, John!');
    });
    
    it('should translate messages in different locales', () => {
      const english = LocalizationService.translate('welcome_message', 'en-US', { name: 'John' });
      const german = LocalizationService.translate('welcome_message', 'de-DE', { name: 'John' });
      const french = LocalizationService.translate('welcome_message', 'fr-FR', { name: 'John' });
      
      expect(english).toBe('Welcome to Ariya, John!');
      expect(german).toBe('Willkommen bei Ariya, John!');
      expect(french).toBe('Bienvenue sur Ariya, John !');
    });
  });
});