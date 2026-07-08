import type { TranslationKey } from "../i18n/types";

/** Order / listing disputes — chat context. */
export const CHAT_REPORT_REASONS: readonly TranslationKey[] = [
  "report_chat_item_not_received",
  "report_chat_wrong_item",
  "report_chat_seller_unresponsive",
  "report_chat_impersonation",
  "report_chat_off_platform",
  "report_other",
] as const;

/** Profile / account behavior — user tab context. */
export const PROFILE_REPORT_REASONS: readonly TranslationKey[] = [
  "report_profile_harassment",
  "report_chat_impersonation",
  "report_profile_spam",
  "report_profile_inappropriate",
  "report_chat_off_platform",
  "report_other",
] as const;
