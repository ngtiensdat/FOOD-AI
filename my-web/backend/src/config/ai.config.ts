/**
 * Mục đích file này để làm gì: Cấu hình động toàn bộ các tham số của module AI (Trọng số, Ngưỡng similarity, Giới hạn bán kính và Thời tiết).
 * Các file khác hay file này có ý nghĩa như nào: Tải từ biến môi trường .env thông qua ConfigModule NestJS và cung cấp cấu hình cho các sub-services của AI.
 * Các chức năng đặc biệt: Tự động parse và cung cấp fallback an toàn cho tất cả các thông số cấu hình.
 */
import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  thresholds: {
    minSimilarity: parseFloat(
      process.env.AI_THRESHOLD_MIN_SIMILARITY || '0.70',
    ),
    directMatch: parseFloat(process.env.AI_THRESHOLD_DIRECT_MATCH || '0.60'),
    rerankingMinDistanceScore: parseFloat(
      process.env.AI_THRESHOLD_RERANKING_MIN_DISTANCE_SCORE || '0.5',
    ),
  },
  decay: {
    distanceFactor: parseFloat(process.env.AI_DECAY_DISTANCE_FACTOR || '-0.07'),
  },
  weights: {
    intent: parseFloat(process.env.AI_WEIGHT_INTENT || '0.4'),
    embedding: parseFloat(process.env.AI_WEIGHT_EMBEDDING || '0.2'),
    distance: parseFloat(process.env.AI_WEIGHT_DISTANCE || '0.15'),
    price: parseFloat(process.env.AI_WEIGHT_PRICE || '0.1'),
    rating: parseFloat(process.env.AI_WEIGHT_RATING || '0.05'),
    context: parseFloat(process.env.AI_WEIGHT_CONTEXT || '0.1'),
  },
  mobilityLimits: {
    lazyNearKm: parseFloat(process.env.AI_LIMIT_LAZY_NEAR_KM || '1.5'),
    lazyFarKm: parseFloat(process.env.AI_LIMIT_LAZY_FAR_KM || '3.0'),
    exploreMinKm: parseFloat(process.env.AI_LIMIT_EXPLORE_MIN_KM || '3.0'),
  },
  priceLimits: {
    rewardThreshold: parseFloat(
      process.env.AI_LIMIT_PRICE_REWARD_THRESHOLD || '80000',
    ),
  },
  emotionLimits: {
    tiredStressedNearKm: parseFloat(
      process.env.AI_LIMIT_EMOTION_TIRED_STRESSED_NEAR_KM || '2.0',
    ),
  },
  defaultValues: {
    conversationTitle:
      process.env.AI_DEFAULT_CONVERSATION_TITLE || 'Đoạn chat mới',
    rerankingDefaultRating: parseFloat(
      process.env.AI_DEFAULT_RERANKING_RATING || '0.8',
    ),
  },
  synonyms: {
    companion: {
      SINGLE: (
        process.env.AI_SYNONYMS_COMPANION_SINGLE ||
        '1 mình,cô đơn,một mình,lẻ loi,tự kỷ,đơn thân,mình tôi'
      ).split(','),
      FAMILY: (
        process.env.AI_SYNONYMS_COMPANION_FAMILY ||
        'gia đình,bố mẹ,vợ con,nhà mình,phụ huynh,con cái,nhà tôi'
      ).split(','),
      DATE: (
        process.env.AI_SYNONYMS_COMPANION_DATE ||
        'người yêu,hẹn hò,ghẹ,bồ,crush,bạn gái,bạn trai,gấu'
      ).split(','),
      FRIENDS: (
        process.env.AI_SYNONYMS_COMPANION_FRIENDS ||
        'bạn bè,đồng nghiệp,tụ tập,nhóm,team,công ty,hội nhóm,cơ quan'
      ).split(','),
    },
    mobility: {
      LAZY: (
        process.env.AI_SYNONYMS_MOBILITY_LAZY ||
        'lười,ngại đi,ngại đi xa,ship,mang về,giao hàng,tận nhà,mang đi'
      ).split(','),
      EXPLORE: (
        process.env.AI_SYNONYMS_MOBILITY_EXPLORE ||
        'đi chơi,cuối tuần,trải nghiệm,quán mới,khám phá,du hí,phượt,đi xa'
      ).split(','),
    },
    emotion: {
      TIRED: (
        process.env.AI_SYNONYMS_EMOTION_TIRED ||
        'mệt,oải,đuối,kiệt sức,mệt mỏi,uể oải,hết hơi'
      ).split(','),
      REWARD: (
        process.env.AI_SYNONYMS_EMOTION_REWARD ||
        'tự thưởng,sang chảnh,ăn mừng,lương về,xõa,linh đình,thịnh soạn'
      ).split(','),
      STRESSED: (
        process.env.AI_SYNONYMS_EMOTION_STRESSED ||
        'stress,căng thẳng,buồn,thất tình,áp lực,bực mình,stress nặng'
      ).split(','),
    },
    category: {
      DRINK: (
        process.env.AI_SYNONYMS_CATEGORY_DRINK ||
        'uống,nước ngọt,trà sữa,cà phê,sinh tố,nước ép,trà chanh,cafe,cocktail'
      ).split(','),
      FOOD: (
        process.env.AI_SYNONYMS_CATEGORY_FOOD ||
        'ăn,món ăn,cơm,bún,phở,mì,lẩu,bánh,cháo,hải sản'
      ).split(','),
    },
  },
  noiseWords: (
    process.env.AI_NOISE_WORDS ||
    'gần,ở,tại,dưới,tầm,khoảng,rẻ,ngon,nóng,cay,1 mình,gia đình,bạn bè,nào,gì,đây,cho,tôi,em'
  ).split(','),
}));
