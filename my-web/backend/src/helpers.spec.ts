import {
  getValidImageUrl,
  isValidOpeningHours,
  isRestaurantCurrentlyOpen,
  cleanImageUrl,
} from '../../frontend/src/utils/helpers';

describe('Unit Tests: Frontend Utility Helpers', () => {
  describe('cleanImageUrl()', () => {
    it('should return empty string for null/undefined/empty input', () => {
      expect(cleanImageUrl(null)).toBe('');
      expect(cleanImageUrl(undefined)).toBe('');
      expect(cleanImageUrl('')).toBe('');
    });

    it('should remove ShopeeFood CDN resize filters', () => {
      const shopeeUrl =
        'https://images.susercontent.com/src/123_abc.jpg@w=200&h=200';
      expect(cleanImageUrl(shopeeUrl)).toBe(
        'https://images.susercontent.com/src/123_abc.jpg',
      );
    });

    it('should return original URL if no Shopee CDN filters are present', () => {
      const normalUrl = 'https://res.cloudinary.com/src/food.jpg';
      expect(cleanImageUrl(normalUrl)).toBe(normalUrl);
    });
  });

  describe('getValidImageUrl()', () => {
    it('should return default fallback placeholder for empty or invalid inputs', () => {
      expect(getValidImageUrl(null)).toBe('/placeholder-food.png');
      expect(getValidImageUrl(undefined)).toBe('/placeholder-food.png');
      expect(getValidImageUrl('abc')).toBe('/placeholder-food.png');
    });

    it('should return valid relative, external, or data URLs', () => {
      expect(getValidImageUrl('/images/avatar.jpg')).toBe('/images/avatar.jpg');
      expect(getValidImageUrl('https://res.cloudinary.com/test.jpg')).toBe(
        'https://res.cloudinary.com/test.jpg',
      );
      expect(getValidImageUrl('data:image/png;base64,123')).toBe(
        'data:image/png;base64,123',
      );
    });
  });

  describe('isValidOpeningHours()', () => {
    it('should return true for empty or whitespace values', () => {
      expect(isValidOpeningHours(null)).toBe(true);
      expect(isValidOpeningHours(undefined)).toBe(true);
      expect(isValidOpeningHours('   ')).toBe(true);
    });

    it('should return true for valid HH:MM-HH:MM formats', () => {
      expect(isValidOpeningHours('08:00-22:00')).toBe(true);
      expect(isValidOpeningHours('8:30-23:00')).toBe(true);
      expect(isValidOpeningHours('00:00-23:59')).toBe(true);
    });

    it('should return false for invalid formats or characters', () => {
      expect(isValidOpeningHours('8-22')).toBe(false);
      expect(isValidOpeningHours('08:00 to 22:00')).toBe(false);
      expect(isValidOpeningHours('abc')).toBe(false);
    });

    it('should return false if hours or minutes exceed standard boundaries', () => {
      expect(isValidOpeningHours('25:00-22:00')).toBe(false);
      expect(isValidOpeningHours('08:61-22:00')).toBe(false);
      expect(isValidOpeningHours('08:00-22:60')).toBe(false);
    });
  });

  describe('isRestaurantCurrentlyOpen()', () => {
    it('should return false if restaurant is manually deactivated', () => {
      expect(isRestaurantCurrentlyOpen('08:00-22:00', false)).toBe(false);
    });

    it('should return true if no opening hours are specified (default open)', () => {
      expect(isRestaurantCurrentlyOpen(undefined, true)).toBe(true);
    });

    it('should check if current time is within standard operating hours', () => {
      // Mock Date to 12:00 PM (noon)
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

      // Restore Date
      global.Date = originalDate;
    });

    it('should check operating hours that span over midnight', () => {
      // Mock Date to 01:00 AM (midnight)
      const mockDate = new Date();
      mockDate.setHours(1, 0, 0);
      const originalDate = Date;
      global.Date = class extends originalDate {
        constructor() {
          super();
          return mockDate;
        }
      } as unknown as typeof Date;

      // 22:00 to 06:00 spans over midnight. 01:00 is within this range.
      expect(isRestaurantCurrentlyOpen('22:00-06:00', true)).toBe(true);
      expect(isRestaurantCurrentlyOpen('08:00-22:00', true)).toBe(false);

      // Restore Date
      global.Date = originalDate;
    });
  });
});
