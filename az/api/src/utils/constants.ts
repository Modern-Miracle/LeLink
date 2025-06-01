/**
 * @fileoverview Constants for LeLink Triage Assistant
 * @description Defines common constants used across the LeLink bot
 */

// Message and conversation limits
export const MAX_MESSAGE_LENGTH: number = 1000;
export const MAX_CONVERSATION_TURNS: number = 50;

// Conversation stages (kept for compatibility)
export const CONVERSATION_STAGES = {
  INITIAL: 'initial',
  GATHERING: 'gathering',
  ASSESSMENT: 'assessment',
  COMPLETE: 'complete',
} as const;

export type ConversationStage = (typeof CONVERSATION_STAGES)[keyof typeof CONVERSATION_STAGES];

// Safety flags (kept for compatibility)
export const SAFETY_FLAGS = {
  HIGH_RISK: 'high_risk',
  MODERATE_RISK: 'moderate_risk',
  LOW_RISK: 'low_risk',
  NONE: 'none',
} as const;

export type SafetyFlag = (typeof SAFETY_FLAGS)[keyof typeof SAFETY_FLAGS];
