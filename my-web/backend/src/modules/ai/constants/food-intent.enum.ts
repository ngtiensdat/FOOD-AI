/**
 * Mục đích: Định nghĩa các Enum phân loại ý định ẩm thực của người dùng (Cuisine, Budget, Emotion, Companion, etc.).
 * File quan hệ: Được sử dụng trong các DTO và state của luồng AI.
 */

export enum FoodIntent {
  RECOMMEND_FOOD = 'RECOMMEND_FOOD',
  FIND_BY_BUDGET = 'FIND_BY_BUDGET',
  FIND_NEARBY = 'FIND_NEARBY',
  FIND_BY_CUISINE = 'FIND_BY_CUISINE',
  FIND_DRINK = 'FIND_DRINK',
  FIND_DESSERT = 'FIND_DESSERT',
  WEATHER_BASED = 'WEATHER_BASED',
  EMOTION_BASED = 'EMOTION_BASED',
  HEALTHY_FOOD = 'HEALTHY_FOOD',
  COMPARE_FOOD = 'COMPARE_FOOD',
  UNKNOWN = 'UNKNOWN',
}
