import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class PayosService {
  private readonly clientId: string;
  private readonly apiKey: string;
  private readonly checksumKey: string;
  private readonly baseUrl = 'https://api-merchant.payos.vn';

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('PAYOS_CLIENT_ID') || '';
    this.apiKey = this.configService.get<string>('PAYOS_API_KEY') || '';
    this.checksumKey =
      this.configService.get<string>('PAYOS_CHECKSUM_KEY') || '';

    if (!this.clientId || !this.apiKey || !this.checksumKey) {
      throw new Error(
        'Thiếu cấu hình PayOS (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY) trong biến môi trường (.env)',
      );
    }
  }

  private generateSignature(data: Record<string, any>): string {
    const sortedKeys = Object.keys(data).sort();
    const queryString = sortedKeys
      .map((key) => `${key}=${data[key]}`)
      .join('&');

    return crypto
      .createHmac('sha256', this.checksumKey)
      .update(queryString)
      .digest('hex');
  }

  async createPaymentLink(
    orderCode: number,
    amount: number,
    description: string,
  ) {
    // PayOS requires amount, cancelUrl, description, orderCode, returnUrl for signature.
    // Clean description to be <= 25 chars and contain only alphanumeric chars and spaces to prevent VietQR formatting errors.
    const cleanedDesc = description
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-zA-Z0-9 ]/g, '') // remove non-alphanumeric
      .replace(/\s+/g, ' ') // collapse spaces
      .trim()
      .substring(0, 25);

    const cancelUrl = 'https://pay.payos.vn';
    const returnUrl = 'https://pay.payos.vn';

    const dataToSign = {
      amount,
      cancelUrl,
      description: cleanedDesc || 'Thanh toan POS',
      orderCode,
      returnUrl,
    };

    const signature = this.generateSignature(dataToSign);

    const payload = {
      ...dataToSign,
      signature,
    };

    try {
      const response = await fetch(`${this.baseUrl}/v2/payment-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.clientId,
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      const resJson = await response.json();
      if (resJson.code !== '00') {
        throw new Error(resJson.desc || 'PayOS Error');
      }

      return resJson.data;
    } catch (err: any) {
      console.error('PayOS Create Payment Link Error:', err);
      throw new InternalServerErrorException(
        `Không thể tạo link thanh toán PayOS: ${err.message}`,
      );
    }
  }

  async getPaymentLinkInformation(orderCode: number) {
    try {
      const response = await fetch(
        `${this.baseUrl}/v2/payment-requests/${orderCode}`,
        {
          method: 'GET',
          headers: {
            'x-client-id': this.clientId,
            'x-api-key': this.apiKey,
          },
        },
      );

      const resJson = await response.json();
      if (resJson.code !== '00') {
        throw new Error(resJson.desc || 'PayOS Error');
      }

      return resJson.data;
    } catch (err: any) {
      console.error('PayOS Get Payment Link Error:', err);
      throw new InternalServerErrorException(
        `Không thể lấy thông tin thanh toán PayOS: ${err.message}`,
      );
    }
  }
}
