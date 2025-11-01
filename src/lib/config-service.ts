// src/lib/config-service.ts
export class ConfigService {
  private static instance: ConfigService;
  private region: string;
  private currency: string;
  private timezone: string;
  private availableLocales: string[];

  private constructor() {
    this.region = process.env.REGION || 'default';
    this.currency = process.env.DEFAULT_CURRENCY || 'USD';
    this.timezone = process.env.DEFAULT_TIMEZONE || 'UTC';
    this.availableLocales = (process.env.AVAILABLE_LOCALES || 'en-US,en-NG').split(',');
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  getRegion(): string { return this.region; }
  getCurrency(): string { return this.currency; }
  getTimezone(): string { return this.timezone; }
  getLocales(): string[] { return this.availableLocales; }

  // Get regional settings
  getRegionalSettings(countryCode: string) {
    const settings = {
      'US': { currency: 'USD', timezone: 'America/New_York', locale: 'en-US' },
      'NG': { currency: 'NGN', timezone: 'Africa/Lagos', locale: 'en-NG' },
      'GB': { currency: 'GBP', timezone: 'Europe/London', locale: 'en-GB' },
      'DE': { currency: 'EUR', timezone: 'Europe/Berlin', locale: 'de-DE' },
      'JP': { currency: 'JPY', timezone: 'Asia/Tokyo', locale: 'ja-JP' },
      'IN': { currency: 'INR', timezone: 'Asia/Kolkata', locale: 'en-IN' },
      'FR': { currency: 'EUR', timezone: 'Europe/Paris', locale: 'fr-FR' },
      'CA': { currency: 'CAD', timezone: 'America/Toronto', locale: 'en-CA' },
      'AU': { currency: 'AUD', timezone: 'Australia/Sydney', locale: 'en-AU' },
    };
    return settings[countryCode as keyof typeof settings] || {
      currency: this.currency,
      timezone: this.timezone,
      locale: this.availableLocales[0]
    };
  }
}