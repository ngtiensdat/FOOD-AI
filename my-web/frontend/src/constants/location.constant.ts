export interface DistrictOption {
  value: string;
  label: string;
}

export interface CityOption {
  value: string;
  label: string;
  districts: DistrictOption[];
}

export const LOCATION_DATA: CityOption[] = [
  {
    value: 'Hà Nội',
    label: 'Hà Nội',
    districts: [
      { value: 'Ba Đình', label: 'Quận Ba Đình' },
      { value: 'Hoàn Kiếm', label: 'Quận Hoàn Kiếm' },
      { value: 'Tây Hồ', label: 'Quận Tây Hồ' },
      { value: 'Long Biên', label: 'Quận Long Biên' },
      { value: 'Cầu Giấy', label: 'Quận Cầu Giấy' },
      { value: 'Đống Đa', label: 'Quận Đống Đa' },
      { value: 'Hai Bà Trưng', label: 'Quận Hai Bà Trưng' },
      { value: 'Hoàng Mai', label: 'Quận Hoàng Mai' },
      { value: 'Thanh Xuân', label: 'Quận Thanh Xuân' },
      { value: 'Nam Từ Liêm', label: 'Quận Nam Từ Liêm' },
      { value: 'Bắc Từ Liêm', label: 'Quận Bắc Từ Liêm' },
      { value: 'Hà Đông', label: 'Quận Hà Đông' },
    ],
  },
  {
    value: 'Hồ Chí Minh',
    label: 'TP. Hồ Chí Minh',
    districts: [
      { value: 'Quận 1', label: 'Quận 1' },
      { value: 'Quận 3', label: 'Quận 3' },
      { value: 'Quận 4', label: 'Quận 4' },
      { value: 'Quận 5', label: 'Quận 5' },
      { value: 'Quận 6', label: 'Quận 6' },
      { value: 'Quận 7', label: 'Quận 7' },
      { value: 'Quận 8', label: 'Quận 8' },
      { value: 'Quận 10', label: 'Quận 10' },
      { value: 'Quận 11', label: 'Quận 11' },
      { value: 'Quận 12', label: 'Quận 12' },
      { value: 'Bình Thạnh', label: 'Quận Bình Thạnh' },
      { value: 'Tân Bình', label: 'Quận Tân Bình' },
      { value: 'Tân Phú', label: 'Quận Tân Phú' },
      { value: 'Gò Vấp', label: 'Quận Gò Vấp' },
      { value: 'Phú Nhuận', label: 'Quận Phú Nhuận' },
      { value: 'Thủ Đức', label: 'TP. Thủ Đức' },
    ],
  },
];

export const DEFAULT_COORDINATES = {
  HANOI: {
    lat: 21.0285,
    lng: 105.8542,
  },
  HCM: {
    lat: 10.762622,
    lng: 106.660172,
  },
};

export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Hà Nội': DEFAULT_COORDINATES.HANOI,
  'Hồ Chí Minh': DEFAULT_COORDINATES.HCM,
};


