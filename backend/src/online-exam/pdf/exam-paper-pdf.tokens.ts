import { rgb } from 'pdf-lib';

export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;
export const MARGIN_X = 36;
export const MARGIN_TOP = 40;
export const MARGIN_BOTTOM = 52;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
export const FOOTER_Y = 24;
export const FRAME_INSET = 14;

export const FONT_SIZE_TITLE = 22;
export const FONT_SIZE_SUBTITLE = 11;
export const FONT_SIZE_HEADING = 11;
export const FONT_SIZE_BODY = 9.5;
export const FONT_SIZE_SMALL = 8.5;
export const LINE_HEIGHT = 13;
export const BODY_LINE_HEIGHT = 15;
/** 시험 정보 패널 — 라벨과 값 사이 기본 간격 (~1cm) */
export const INFO_PANEL_VALUE_OFFSET = 28;
/** 값 텍스트를 왼쪽으로 당기는 보정 (ch 단위) */
export const INFO_PANEL_VALUE_OFFSET_CH_LEFT = 2.5;
/** 헤더 회차 뱃지 — 부제 텍스트 오른쪽 추가 간격 (~1cm) */
export const HEADER_ROUND_BADGE_OFFSET = 28;

export const COLORS = {
  brandBlue: rgb(0.027, 0.231, 0.471),
  brandBlueDark: rgb(0.016, 0.169, 0.361),
  brandBlueSubtle: rgb(0.918, 0.949, 0.973),
  border: rgb(0.78, 0.86, 0.92),
  borderLight: rgb(0.86, 0.91, 0.95),
  text: rgb(0.063, 0.094, 0.125),
  textMuted: rgb(0.35, 0.42, 0.5),
  textSoft: rgb(0.48, 0.54, 0.6),
  white: rgb(1, 1, 1),
  draftWatermark: rgb(0.92, 0.55, 0.55),
  answerAccent: rgb(0.05, 0.35, 0.55),
};
