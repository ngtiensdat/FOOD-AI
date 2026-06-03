// Mục đích: Xác định vị trí địa lý của thiết bị người dùng thông qua Geolocation API của trình duyệt.
// Ý nghĩa: Cung cấp thông tin tọa độ vĩ độ (latitude) và kinh độ (longitude) thực tế phục vụ cho việc tìm kiếm hoặc gợi ý món ăn gần đó.
// Chức năng đặc biệt: Tự động khởi tạo GPS khi mount, cơ chế timeout giới hạn thời gian phản hồi định vị và hỗ trợ cập nhật lại GPS thủ công.
// Design Pattern: Custom Hook pattern, Promise-wrapped API calling.
// Biến, hàm đặc biệt: useGeolocation, getPosition, refreshGps, LIMITS.GEOLOCATION_TIMEOUT.

import { useState, useEffect, useCallback } from 'react';
import { LIMITS } from '@/constants/limits.constant';

export const useGeolocation = (defaultLat: number, defaultLng: number) => {
  const [lat, setLat] = useState(defaultLat);
  const [lng, setLng] = useState(defaultLng);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getPosition = useCallback((): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          resolve(null);
        },
        { timeout: LIMITS.GEOLOCATION_TIMEOUT }
      );
    });
  }, []);

  const refreshGps = useCallback(async () => {
    setLoading(true);
    setError(null);
    const pos = await getPosition();
    if (pos) {
      setLat(pos.latitude);
      setLng(pos.longitude);
      setError(null);
    } else {
      setError('Không thể lấy tọa độ GPS từ thiết bị.');
    }
    setLoading(false);
    return pos;
  }, [getPosition]);

  useEffect(() => {
    const initGps = async () => {
      const pos = await getPosition();
      if (pos) {
        setLat(pos.latitude);
        setLng(pos.longitude);
      }
    };
    initGps();
  }, [getPosition]);

  return {
    lat,
    setLat,
    lng,
    setLng,
    error,
    loading,
    refreshGps,
    getPosition,
  };
};
