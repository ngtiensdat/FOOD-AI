export interface DialogueState {
  title?: string;
  slots: {
    cuisineType?: string; // món nước, món khô, chay, ngọt...
    category?: 'FOOD' | 'DRINK' | 'ALL';
    budget?: number; // ngân sách tối đa
    companion?: 'SINGLE' | 'FAMILY' | 'DATE' | 'FRIENDS';
    mobility?: 'LAZY' | 'NORMAL' | 'EXPLORE';
    emotion?: 'TIRED' | 'REWARD' | 'STRESSED' | 'NORMAL';
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
}

export type SlotExtractionResult = Partial<DialogueState['slots']>;

export interface ConversationState {
  id: number;
  userId: number;
  metadata: DialogueState;
  createdAt: Date;
  updatedAt: Date;
}
