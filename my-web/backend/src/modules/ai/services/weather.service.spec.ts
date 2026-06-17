process.env.JWT_SECRET = 'test-secret';

import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService, WeatherData } from './weather.service';
import { RedisService } from './redis.service';

describe('WeatherService', () => {
  let service: WeatherService;
  let mockRedis: Record<string, string>;
  let redisGetMock: jest.Mock;
  let redisSetMock: jest.Mock;

  beforeEach(async () => {
    mockRedis = {};
    redisGetMock = jest.fn().mockImplementation((key: string) => {
      return Promise.resolve(mockRedis[key] || null);
    });
    redisSetMock = jest
      .fn()
      .mockImplementation((key: string, value: string) => {
        mockRedis[key] = value;
        return Promise.resolve();
      });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        {
          provide: RedisService,
          useValue: {
            get: redisGetMock,
            set: redisSetMock,
          },
        },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('WMO Weather Code Mapping', () => {
    it('should map WMO code to Vietnamese description correctly', () => {
      expect(service.getWeatherDescription(0)).toBe('Trời quang đãng ☀️');
      expect(service.getWeatherDescription(51)).toBe('Mưa phùn nhẹ 🌦️');
      expect(service.getWeatherDescription(99)).toBe('Giông kèm mưa đá to ⛈️');
      expect(service.getWeatherDescription(999)).toBe('Mã thời tiết 999');
    });
  });

  describe('getCurrentWeather', () => {
    const lat = 10.823;
    const lng = 106.6296;
    const cacheKey = 'weather:10.82:106.63';

    it('should return cached weather data on Redis HIT and NOT call fetch', async () => {
      const cachedData: WeatherData = {
        temperature: 30,
        apparentTemperature: 35,
        humidity: 65,
        isRaining: false,
        rainMm: 0,
        windSpeedKmh: 12,
        weatherCode: 1,
        description: 'Trời khá quang ⛅',
      };
      mockRedis[cacheKey] = JSON.stringify(cachedData);

      const fetchSpy = jest.spyOn(global, 'fetch');

      const result = await service.getCurrentWeather(lat, lng);

      expect(result).toEqual(cachedData);
      expect(redisGetMock).toHaveBeenCalledWith(cacheKey);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should call Open-Meteo API on Redis MISS, return data, and cache it', async () => {
      const apiResponse = {
        current: {
          temperature_2m: 29.6,
          relative_humidity_2m: 74,
          apparent_temperature: 34.5,
          rain: 0.1,
          weather_code: 51,
          wind_speed_10m: 10.3,
        },
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(apiResponse),
      } as unknown as Response;

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(mockResponse);

      const result = await service.getCurrentWeather(lat, lng);

      expect(result).toEqual({
        temperature: 29.6,
        apparentTemperature: 34.5,
        humidity: 74,
        isRaining: true,
        rainMm: 0.1,
        windSpeedKmh: 10.3,
        weatherCode: 51,
        description: 'Mưa phùn nhẹ 🌦️',
      });

      expect(redisGetMock).toHaveBeenCalledWith(cacheKey);
      expect(fetchSpy).toHaveBeenCalled();
      expect(redisSetMock).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify(result),
        1800,
      );
    });

    it('should return default values gracefully when Redis throws an error and fetch fails', async () => {
      redisGetMock.mockRejectedValueOnce(new Error('Redis connection lost'));

      const mockResponse = {
        ok: false,
        status: 500,
      } as unknown as Response;

      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const result = await service.getCurrentWeather(lat, lng);

      expect(result).toEqual({
        temperature: 28,
        apparentTemperature: 30,
        humidity: 70,
        isRaining: false,
        rainMm: 0,
        windSpeedKmh: 5,
        weatherCode: 0,
        description: 'Không rõ thời tiết',
      });
    });

    it('should return default values gracefully when fetch throws an error (e.g. Network error)', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockRejectedValueOnce(new Error('DNS lookup failed'));

      const result = await service.getCurrentWeather(lat, lng);

      expect(result).toEqual({
        temperature: 28,
        apparentTemperature: 30,
        humidity: 70,
        isRaining: false,
        rainMm: 0,
        windSpeedKmh: 5,
        weatherCode: 0,
        description: 'Không rõ thời tiết',
      });
    });
  });
});
