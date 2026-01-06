export class BookingCodeService {
  private static readonly PREFIX = 'NL-';
  private static readonly CODE_LENGTH = 4;

  /**
   * Generates a unique booking code in format: NL-XXXX
   * Where XXXX is a 4-character alphanumeric code
   */
  generateBookingCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars like 0, O, I, 1
    let code = '';

    for (let i = 0; i < BookingCodeService.CODE_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      code += chars[randomIndex];
    }

    return `${BookingCodeService.PREFIX}${code}`;
  }

  /**
   * Validates if a booking code matches the expected format
   */
  validateBookingCode(code: string): boolean {
    const pattern = new RegExp(`^${BookingCodeService.PREFIX}[A-Z0-9]{${BookingCodeService.CODE_LENGTH}}$`);
    return pattern.test(code);
  }
}

