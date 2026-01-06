import { BookingCodeService } from './booking-code.service';

describe('BookingCodeService', () => {
  let service: BookingCodeService;

  beforeEach(() => {
    service = new BookingCodeService();
  });

  describe('generateBookingCode', () => {
    it('should generate a booking code with NL- prefix', () => {
      const code = service.generateBookingCode();
      expect(code).toMatch(/^NL-[A-Z0-9]{4}$/);
    });

    it('should generate unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(service.generateBookingCode());
      }
      // High probability of uniqueness (though not guaranteed)
      expect(codes.size).toBeGreaterThan(90);
    });

    it('should generate codes with correct length', () => {
      const code = service.generateBookingCode();
      expect(code.length).toBe(7); // "NL-" + 4 characters
    });
  });

  describe('validateBookingCode', () => {
    it('should validate correct booking codes', () => {
      expect(service.validateBookingCode('NL-A742')).toBe(true);
      expect(service.validateBookingCode('NL-1234')).toBe(true);
      expect(service.validateBookingCode('NL-ABCD')).toBe(true);
    });

    it('should reject invalid booking codes', () => {
      expect(service.validateBookingCode('NL-123')).toBe(false); // Too short
      expect(service.validateBookingCode('NL-12345')).toBe(false); // Too long
      expect(service.validateBookingCode('ABC-1234')).toBe(false); // Wrong prefix
      expect(service.validateBookingCode('nl-A742')).toBe(false); // Lowercase prefix
      expect(service.validateBookingCode('')).toBe(false);
    });
  });
});

