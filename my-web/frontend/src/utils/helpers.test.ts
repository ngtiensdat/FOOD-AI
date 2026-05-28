import { generateId, cleanImageUrl, getValidImageUrl, parseAddressString, isRestaurantCurrentlyOpen, isValidOpeningHours } from './helpers';

describe('Frontend Helpers', () => {
  describe('generateId', () => {
    it('should generate a string of length 7', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeLessThanOrEqual(7);
    });
  });

  describe('cleanImageUrl', () => {
    it('should remove ShopeeFood CDN parameters', () => {
      const url = 'https://susercontent.com/image@resize=100';
      expect(cleanImageUrl(url)).toBe('https://susercontent.com/image');
    });

    it('should return original url if not ShopeeFood', () => {
      const url = 'https://images.unsplash.com/photo-123';
      expect(cleanImageUrl(url)).toBe(url);
    });

    it('should not modify URLs containing @ if they are not Shopee CDNs', () => {
      expect(cleanImageUrl('https://example.com/user@name/avatar.jpg')).toBe('https://example.com/user@name/avatar.jpg');
    });
  });

  describe('getValidImageUrl', () => {
    it('should return placeholder for empty url', () => {
      expect(getValidImageUrl(null)).toBe('/placeholder-food.png');
      expect(getValidImageUrl('')).toBe('/placeholder-food.png');
    });

    it('should return placeholder for invalid url format', () => {
      expect(getValidImageUrl('invalid-url')).toBe('/placeholder-food.png');
    });

    it('should return placeholder for stringified "null" or "undefined" values', () => {
      expect(getValidImageUrl("null")).toBe('/placeholder-food.png');
      expect(getValidImageUrl("undefined")).toBe('/placeholder-food.png');
    });

    it('should return valid urls', () => {
      expect(getValidImageUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
      expect(getValidImageUrl('/local/img.jpg')).toBe('/local/img.jpg');
    });
  });

  describe('parseAddressString', () => {
    it('should parse full address correctly', () => {
      const result = parseAddressString('123 Street, District 1, Ho Chi Minh');
      expect(result).toEqual({
        street: '123 Street',
        district: 'District 1',
        city: 'Ho Chi Minh'
      });
    });

    it('should parse 2-part address correctly', () => {
      const result = parseAddressString('District 1, Ho Chi Minh');
      expect(result).toEqual({
        street: '',
        district: 'District 1',
        city: 'Ho Chi Minh'
      });
    });

    it('should parse 1-part address correctly', () => {
      const result = parseAddressString('Ho Chi Minh');
      expect(result).toEqual({
        street: 'Ho Chi Minh',
        district: '',
        city: ''
      });
    });

    it('should trim messy whitespaces and parse correctly', () => {
      const result = parseAddressString(" 123 Street  ,   District 1  , Ho Chi Minh   ");
      expect(result).toEqual({
        street: '123 Street',
        district: 'District 1',
        city: 'Ho Chi Minh'
      });
    });
  });

  describe('isValidOpeningHours', () => {
    it('should return true for valid formats', () => {
      expect(isValidOpeningHours('08:00 - 22:00')).toBe(true);
      expect(isValidOpeningHours('8:00-22:30')).toBe(true);
      expect(isValidOpeningHours(null)).toBe(true); // default true if empty
    });

    it('should return false for invalid formats', () => {
      expect(isValidOpeningHours('25:00 - 22:00')).toBe(false);
      expect(isValidOpeningHours('08:60 - 22:00')).toBe(false);
      expect(isValidOpeningHours('invalid')).toBe(false);
    });
  });

  describe('isRestaurantCurrentlyOpen', () => {
    it('should return false if restaurant is manually deactivated', () => {
      expect(isRestaurantCurrentlyOpen('08:00-22:00', false)).toBe(false);
    });

    it('should return true if no opening hours are specified (default open)', () => {
      expect(isRestaurantCurrentlyOpen(undefined, true)).toBe(true);
    });

    it('should check if current time is within standard operating hours', () => {
      const mockDate = new Date();
      mockDate.setHours(12, 0, 0);
      const originalDate = Date;
      global.Date = class extends originalDate {
        constructor() {
          super();
          return mockDate;
        }
      } as unknown as typeof Date;

      expect(isRestaurantCurrentlyOpen('08:00-22:00', true)).toBe(true);
      expect(isRestaurantCurrentlyOpen('14:00-22:00', true)).toBe(false);

      global.Date = originalDate;
    });

    it('should check operating hours that span over midnight', () => {
      const mockDate = new Date();
      mockDate.setHours(1, 0, 0);
      const originalDate = Date;
      global.Date = class extends originalDate {
        constructor() {
          super();
          return mockDate;
        }
      } as unknown as typeof Date;

      expect(isRestaurantCurrentlyOpen('22:00-06:00', true)).toBe(true);
      expect(isRestaurantCurrentlyOpen('08:00-22:00', true)).toBe(false);

      global.Date = originalDate;
    });
  });
});
