// Mục đích: Middleware trích xuất ngôn ngữ yêu cầu từ header Accept-Language của Client.
// Các file khác hay file này có ý nghĩa như nào: Được áp dụng toàn cục trong AppModule và thiết lập ngữ cảnh ngôn ngữ cho i18nStorage trước khi yêu cầu đi tới Controller.
// Các chức năng đặc biệt: Tách ngôn ngữ chính từ chuỗi Accept-Language, hỗ trợ tiếng Anh ('en') và mặc định là tiếng Việt ('vi').
// Kiến thức, Design Pattern, nguyên tắc: Middleware Pattern, Context Propagation.
// Các biến, hàm đặc biệt: use().

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { i18nStorage } from './i18n.context';

@Injectable()
export class I18nMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Lấy tiêu đề accept-language từ Client
    const acceptLanguage = req.headers['accept-language'];
    let lang = 'vi';

    if (acceptLanguage && typeof acceptLanguage === 'string') {
      const primaryLang = acceptLanguage.split(',')[0].trim().toLowerCase();
      if (primaryLang.startsWith('en')) {
        lang = 'en';
      }
    }

    // Chạy các middleware và controller tiếp theo trong ngữ cảnh lưu trữ của request
    i18nStorage.run({ lang }, () => {
      next();
    });
  }
}
