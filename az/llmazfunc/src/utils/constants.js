/**
 * @fileoverview Constants for LeLink Triage Assistant
 * @description Defines common constants used across the LeLink bot
 */

// Message and conversation limits
const MAX_MESSAGE_LENGTH = 1000;
const MAX_CONVERSATION_TURNS = 50;

// Conversation stages (kept for compatibility)
const CONVERSATION_STAGES = {
  INITIAL: 'initial',
  GATHERING: 'gathering',
  ASSESSMENT: 'assessment',
  COMPLETE: 'complete'
};

// Safety flags (kept for compatibility)
const SAFETY_FLAGS = {
  HIGH_RISK: 'high_risk',
  MODERATE_RISK: 'moderate_risk',
  LOW_RISK: 'low_risk',
  NONE: 'none'
};

module.exports = {
  MAX_MESSAGE_LENGTH,
  MAX_CONVERSATION_TURNS,
  CONVERSATION_STAGES,
  SAFETY_FLAGS
};