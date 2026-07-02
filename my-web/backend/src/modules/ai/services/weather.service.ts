/**
 * Mục đích: Service lấy dữ liệu thời tiết thực từ Open-Meteo API theo tọa độ GPS.
 * File quan hệ: Được gọi bởi AiService để cung cấp ngữ cảnh thời tiết cho pipeline AI.
 * Chức năng đặc biệt: Cache Redis 30 phút, graceful fallback khi API lỗi, WMO weather code → tiếng Việt.
 * Kiến thức/Design Pattern: Single Responsibility, Caching Pattern, Graceful Degradation.
 * Biến/hàm đặc biệt: getCurrentWeather(), getWeatherDescription().
 */

import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../common/redis/redis.service';
import { CircuitBreaker } from '../../../common/utils/circuit-breaker';

/** Kết quả thời tiết đã xử lý, trả về cho AI pipeline và frontend */
export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  isRaining: boolean;
  rainMm: number;
  windSpeedKmh: number;
  weatherCode: number;
  description: string;
}

/** Response thô từ Open-Meteo API */
interface OpenMeteoCurrentResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    rain: number;
    weather_code: number;
    wind_speed_10m: number;
  };
}

/** Cache TTL: 30 phút (1800 giây) */
const WEATHER_CACHE_TTL_SECONDS = 1800;

/** Timeout cho HTTP request tới Open-Meteo (5 giây) */
const WEATHER_API_TIMEOUT_MS = 5000;

/** Open-Meteo API base URL */
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/** Danh sách các current weather variables cần lấy */
const CURRENT_WEATHER_VARIABLES = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'rain',
  'weather_code',
  'wind_speed_10m',
].join(',');

/** Giá trị mặc định khi không có dữ liệu thời tiết */
const DEFAULT_WEATHER: WeatherData = {
  temperature: 28,
  apparentTemperature: 30,
  humidity: 70,
  isRaining: false,
  rainMm: 0,
  windSpeedKmh: 5,
  weatherCode: 0,
  description: 'Không rõ thời tiết',
};

/**
 * Bảng ánh xạ WMO Weather Interpretation Codes → Mô tả tiếng Việt.
 * Ref: https://open-meteo.com/en/docs (WMO 4677)
 */
const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Trời quang đãng ☀️',
  1: 'Trời khá quang ⛅',
  2: 'Trời nhiều mây 🌤️',
  3: 'Trời u ám ☁️',
  45: 'Sương mù 🌫️',
  48: 'Sương mù đóng băng 🌫️',
  51: 'Mưa phùn nhẹ 🌦️',
  53: 'Mưa phùn vừa 🌦️',
  55: 'Mưa phùn dày 🌧️',
  56: 'Mưa phùn lạnh nhẹ 🌧️',
  57: 'Mưa phùn lạnh dày 🌧️',
  61: 'Mưa nhẹ 🌧️',
  63: 'Mưa vừa 🌧️',
  65: 'Mưa to 🌧️',
  66: 'Mưa lạnh nhẹ 🌧️',
  67: 'Mưa lạnh to 🌧️',
  71: 'Tuyết nhẹ ❄️',
  73: 'Tuyết vừa ❄️',
  75: 'Tuyết dày ❄️',
  77: 'Mưa đá nhỏ 🌨️',
  80: 'Mưa rào nhẹ 🌦️',
  81: 'Mưa rào vừa 🌧️',
  82: 'Mưa rào to ⛈️',
  85: 'Mưa tuyết nhẹ 🌨️',
  86: 'Mưa tuyết dày 🌨️',
  95: 'Giông bão ⛈️',
  96: 'Giông kèm mưa đá nhẹ ⛈️',
  99: 'Giông kèm mưa đá to ⛈️',
};

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly weatherBreaker: CircuitBreaker<
    [number, number],
    WeatherData
  >;

  constructor(private readonly redisService: RedisService) {
    this.weatherBreaker = new CircuitBreaker(
      async (lat: number, lng: number) => {
        const url =
          `${OPEN_METEO_BASE_URL}` +
          `?latitude=${lat.toFixed(4)}` +
          `&longitude=${lng.toFixed(4)}` +
          `&current=${CURRENT_WEATHER_VARIABLES}` +
          `&timezone=Asia/Ho_Chi_Minh`;

        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          WEATHER_API_TIMEOUT_MS,
        );

        let response: Response;
        try {
          response = await fetch(url, { signal: controller.signal });
        } finally {
          clearTimeout(timeout);
        }

        if (!response.ok) {
          throw new Error(
            `Open-Meteo responded with status ${response.status}`,
          );
        }

        const data = (await response.json()) as OpenMeteoCurrentResponse;
        const current = data.current;

        return {
          temperature: Math.round(current.temperature_2m * 10) / 10,
          apparentTemperature:
            Math.round(current.apparent_temperature * 10) / 10,
          humidity: Math.round(current.relative_humidity_2m),
          isRaining: current.rain > 0 || current.weather_code >= 51,
          rainMm: Math.round(current.rain * 100) / 100,
          windSpeedKmh: Math.round(current.wind_speed_10m * 10) / 10,
          weatherCode: current.weather_code,
          description: this.getWeatherDescription(current.weather_code),
        };
      },
      {
        failureThreshold: 3,
        cooldownPeriodMs: 60000,
        fallbackValue: DEFAULT_WEATHER,
      },
    );
  }

  /**
   * Lấy thời tiết hiện tại theo tọa độ GPS.
   * - Kiểm tra cache Redis trước (key: `weather:{lat}:{lng}` làm tròn 2 chữ số ≈ 1.1km)
   * - Gọi Open-Meteo API qua Circuit Breaker nếu cache miss
   * - Graceful fallback nếu API lỗi hoặc timeout
   */
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    const cacheKey = `weather:${lat.toFixed(2)}:${lng.toFixed(2)}`;

    // 1. Check Redis cache
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.debug(`Weather cache HIT for ${cacheKey}`);
        return JSON.parse(cached) as WeatherData;
      }
    } catch (err) {
      this.logger.warn(
        `Weather cache read error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // 2. Fetch from Open-Meteo API via Circuit Breaker
    try {
      const weatherData = await this.weatherBreaker.execute(lat, lng);

      // 3. Cache result in Redis (30 phút) - chỉ cache nếu dữ liệu hợp lệ (không phải fallback mặc định)
      if (weatherData.description !== DEFAULT_WEATHER.description) {
        try {
          await this.redisService.set(
            cacheKey,
            JSON.stringify(weatherData),
            WEATHER_CACHE_TTL_SECONDS,
          );
          this.logger.debug(
            `Weather cached for ${cacheKey}: ${weatherData.temperature}°C, ${weatherData.description}`,
          );
        } catch (cacheErr) {
          this.logger.warn(
            `Weather cache write error: ${cacheErr instanceof Error ? cacheErr.message : String(cacheErr)}`,
          );
        }
      }

      return weatherData;
    } catch (err) {
      this.logger.warn(
        `Open-Meteo API error (fallback to defaults): ${err instanceof Error ? err.message : String(err)}`,
      );
      return { ...DEFAULT_WEATHER };
    }
  }

  /**
   * Ánh xạ WMO Weather Code → Mô tả tiếng Việt.
   */
  getWeatherDescription(code: number): string {
    return WMO_DESCRIPTIONS[code] || `Mã thời tiết ${code}`;
  }
}
