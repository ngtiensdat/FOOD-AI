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
  });

  describe('getValidImageUrl', () => {
    it('should return placeholder for empty url', () => {
      expect(getValidImageUrl(null)).toBe('/placeholder-food.png');
      expect(getValidImageUrl('')).toBe('/placeholder-food.png');
    });

    it('should return placeholder for invalid url format', () => {
      expect(getValidImageUrl('invalid-url')).toBe('/placeholder-food.png');
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
});
