/**
 * Mục đích: Định nghĩa interface mô tả DialogueState lưu trữ thông tin bối cảnh hội thoại chat hiện tại.
 * File quan hệ: Được sử dụng bởi DialogueStateManagerService và các Prompt Builder.
 */

export interface DialogueState {
  title?: string;
  slots: {
    cuisineType?: string; // món nước, món khô, chay, ngọt...
    category?: 'FOOD' | 'DRINK' | 'ALL';
    budget?: number; // ngân sách tối đa
    companion?: 'SINGLE' | 'FAMILY' | 'DATE' | 'FRIENDS';
    mobility?: 'LAZY' | 'NORMAL' | 'EXPLORE';
    emotion?: 'TIRED' | 'REWARD' | 'STRESSED' | 'NORMAL';
    allergies?: string[]; // chất dị ứng như: đậu phộng, hải sản...
  };
  current_stage: 'COLLECTING' | 'RECOMMENDED' | 'FEEDBACK';
  rejected_food_ids: number[];
  suggested_food_ids: number[];
}

export interface PromptResponse {
  slots?: Partial<DialogueState['slots']>;
  current_stage?: DialogueState['current_stage'];
  rejected_food_ids?: number[];
  title?: string;
  reply: string;
  suggestedFoodIds?: number[];
  quickReplies?: Array<{ label: string; text: string }>;
  assessment?: {
    mainNeed: string;
    secondaryNeeds: string[];
    confidence: number;
    explanation: string;
  };
}

export type SlotExtractionResult = Partial<DialogueState['slots']>;

export interface ConversationState {
  id: number;
  userId: number;
  metadata: DialogueState;
  createdAt: Date;
  updatedAt: Date;
}
