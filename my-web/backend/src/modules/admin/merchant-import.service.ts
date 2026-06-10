// Mục đích: Cung cấp dịch vụ bóc tách và nhập dữ liệu đối tác thương gia (Merchant) cùng danh sách món ăn từ file Excel vào cơ sở dữ liệu.
// File quan hệ: Được gọi bởi AdminService và sử dụng PrismaService để tương tác DB, AiService để tạo vector embedding cho món ăn.
// Chức năng đặc biệt: Đọc file Excel, gom nhóm các món ăn theo email của chủ nhà hàng, tự động tạo tài khoản, nhà hàng và các món ăn đi kèm trong một Database Transaction duy nhất để bảo đảm an toàn dữ liệu.
// Kiến thức/Design Pattern: Áp dụng nguyên tắc SOLID (Single Responsibility - Class chỉ xử lý logic import Excel, Open/Closed - cấu trúc Excel headers mở rộng dễ dàng) và Database Transaction Pattern để đảm bảo tính toàn vẹn dữ liệu.
// Các biến, hàm đặc biệt: ExcelMerchantRow, MerchantFood, MerchantGroup (Interfaces); importFromExcel(), parseExcelBuffer(), groupMerchantsByEmail(), saveMerchantsToDatabase().

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/ai.service';
import * as xlsx from 'xlsx';
import { BcryptHelper } from '../../common/utils/bcrypt.helper';
import { UserRole, UserStatus, FoodStatus } from '@prisma/client';
import { MESSAGES } from '../../common/constants/messages.constant';

export const EXCEL_HEADERS = {
  EMAIL: 'Email',
  PASSWORD: 'Password',
  OWNER_NAME: 'Owner Name',
  RESTAURANT_NAME: 'Restaurant Name',
  ADDRESS: 'Address',
  LATITUDE: 'Latitude',
  LONGITUDE: 'Longitude',
  MAP_URL: 'Restaurant Map URL',
  FOOD_NAME: 'Food Name',
  FOOD_PRICE: 'Food Price',
  FOOD_DESC: 'Food Desc',
  FOOD_IMAGE: 'Food Image URL',
  FOOD_TAGS: 'Food Tags',
};

export const DEFAULT_VALUES = {
  PASSWORD: 'password123',
  OWNER_NAME: 'Chủ nhà hàng',
  RESTAURANT_NAME: 'Nhà hàng mới',
  ADDRESS: 'Chưa cập nhật địa chỉ',
  LATITUDE: 0,
  LONGITUDE: 0,
};

export interface ExcelMerchantRow {
  [key: string]: string | number | undefined;
}

export interface MerchantFood {
  name: string;
  price: number;
  description: string;
  image: string;
  tags: string[];
}

export interface MerchantGroup {
  email: string;
  password: string;
  ownerName: string;
  restaurantName: string;
  address: string;
  latitude: number;
  longitude: number;
  mapUrl: string;
  foods: MerchantFood[];
}

@Injectable()
export class MerchantImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async importFromExcel(buffer: Buffer) {
    const rows = this.parseExcelBuffer(buffer);

    if (!rows || rows.length === 0) {
      throw new BadRequestException(MESSAGES.ADMIN.FILE_EMPTY_OR_INVALID);
    }

    const merchantsMap = this.groupMerchantsByEmail(rows);
    return this.saveMerchantsToDatabase(merchantsMap);
  }

  private parseExcelBuffer(buffer: Buffer): ExcelMerchantRow[] {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(sheet);
  }

  private groupMerchantsByEmail(
    rows: ExcelMerchantRow[],
  ): Map<string, MerchantGroup> {
    const merchantsMap = new Map<string, MerchantGroup>();

    for (const row of rows) {
      const email = row[EXCEL_HEADERS.EMAIL]
        ? String(row[EXCEL_HEADERS.EMAIL])
        : undefined;
      if (!email) continue;

      if (!merchantsMap.has(email)) {
        merchantsMap.set(email, {
          email,
          password: row[EXCEL_HEADERS.PASSWORD]
            ? String(row[EXCEL_HEADERS.PASSWORD])
            : DEFAULT_VALUES.PASSWORD,
          ownerName: row[EXCEL_HEADERS.OWNER_NAME]
            ? String(row[EXCEL_HEADERS.OWNER_NAME])
            : DEFAULT_VALUES.OWNER_NAME,
          restaurantName: row[EXCEL_HEADERS.RESTAURANT_NAME]
            ? String(row[EXCEL_HEADERS.RESTAURANT_NAME])
            : DEFAULT_VALUES.RESTAURANT_NAME,
          address: row[EXCEL_HEADERS.ADDRESS]
            ? String(row[EXCEL_HEADERS.ADDRESS])
            : DEFAULT_VALUES.ADDRESS,
          latitude: row[EXCEL_HEADERS.LATITUDE]
            ? parseFloat(String(row[EXCEL_HEADERS.LATITUDE]))
            : DEFAULT_VALUES.LATITUDE,
          longitude: row[EXCEL_HEADERS.LONGITUDE]
            ? parseFloat(String(row[EXCEL_HEADERS.LONGITUDE]))
            : DEFAULT_VALUES.LONGITUDE,
          mapUrl: row[EXCEL_HEADERS.MAP_URL]
            ? String(row[EXCEL_HEADERS.MAP_URL])
            : '',
          foods: [],
        });
      }

      const foodName = row[EXCEL_HEADERS.FOOD_NAME];
      const foodPrice = row[EXCEL_HEADERS.FOOD_PRICE];

      if (foodName && foodPrice) {
        const group = merchantsMap.get(email);
        if (group) {
          group.foods.push({
            name: String(foodName),
            price: parseFloat(String(foodPrice)),
            description: row[EXCEL_HEADERS.FOOD_DESC]
              ? String(row[EXCEL_HEADERS.FOOD_DESC])
              : '',
            image: row[EXCEL_HEADERS.FOOD_IMAGE]
              ? String(row[EXCEL_HEADERS.FOOD_IMAGE])
              : '',
            tags: row[EXCEL_HEADERS.FOOD_TAGS]
              ? String(row[EXCEL_HEADERS.FOOD_TAGS])
                  .split(',')
                  .map((t) => t.trim())
              : [],
          });
        }
      }
    }

    return merchantsMap;
  }

  private async saveMerchantsToDatabase(
    merchantsMap: Map<string, MerchantGroup>,
  ) {
    let createdCount = 0;
    let appendedCount = 0;
    const createdFoodIds: number[] = [];

    for (const merchant of merchantsMap.values()) {
      await this.prisma.$transaction(async (prisma) => {
        let user = await prisma.user.findUnique({
          where: { email: merchant.email },
          include: { restaurants: true },
        });

        let restaurantId: number;

        if (!user) {
          const hashedPassword = await BcryptHelper.hash(merchant.password, 10);

          user = await prisma.user.create({
            data: {
              email: merchant.email,
              password: hashedPassword,
              name: merchant.ownerName,
              role: UserRole.RESTAURANT,
              status: UserStatus.APPROVED,
              isEmailVerified: true,
              profile: {
                create: {
                  fullName: merchant.ownerName,
                  address: merchant.address,
                },
              },
              restaurants: {
                create: {
                  name: merchant.restaurantName,
                  address: merchant.address,
                  latitude: merchant.latitude,
                  longitude: merchant.longitude,
                  mapUrl: merchant.mapUrl,
                  isActive: true,
                  profile: {
                    create: {},
                  },
                },
              },
            },
            include: { restaurants: true },
          });
          createdCount++;
          restaurantId = user.restaurants[0].id;
        } else {
          if (user.restaurants.length === 0) {
            const restaurant = await prisma.restaurant.create({
              data: {
                ownerId: user.id,
                name: merchant.restaurantName,
                address: merchant.address,
                latitude: merchant.latitude,
                longitude: merchant.longitude,
                mapUrl: merchant.mapUrl,
                isActive: true,
                profile: { create: {} },
              },
            });
            restaurantId = restaurant.id;
          } else {
            restaurantId = user.restaurants[0].id;
          }
          appendedCount++;
        }

        if (merchant.foods.length > 0) {
          // Tạo từng food riêng lẻ để lấy được ID và trigger AI embedding
          for (const food of merchant.foods) {
            const created = await prisma.food.create({
              data: {
                restaurantId,
                name: food.name,
                price: food.price,
                description: food.description || '',
                image: food.image || '',
                tags: food.tags,
                status: FoodStatus.APPROVED,
                isActive: true,
              },
            });
            createdFoodIds.push(created.id);
          }
        }
      });
    }

    // Trigger AI embedding update cho tất cả foods vừa được tạo (background, không blocking)
    for (const foodId of createdFoodIds) {
      void this.aiService.updateFoodEmbedding(foodId);
    }

    return {
      message: 'Import thành công',
      createdMerchants: createdCount,
      appendedMerchants: appendedCount,
      totalFoods: createdFoodIds.length,
    };
  }
}
