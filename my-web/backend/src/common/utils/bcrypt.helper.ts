import * as bcrypt from 'bcrypt';

export class BcryptHelper {
  static async hash(plainText: string, saltRounds = 10): Promise<string> {
    return bcrypt.hash(plainText, saltRounds);
  }

  static async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
