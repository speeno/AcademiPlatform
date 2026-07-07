/**
 * 큐미(Qmi) 마스코트 포즈 매핑.
 * 파일은 frontend/public/mascot/qmi/*.webp 에 위치한다.
 * 백엔드 QmiService 가 내려주는 pose 키와 동일하다.
 */
export const QMI_BASE = '/mascot/qmi';

export const QMI_AVATAR = `${QMI_BASE}/qmi-avatar.webp`;

/**
 * 런처가 화면을 "걸어서" 좌우 이동할 때 재생하는 워크사이클 프레임(우측 향함).
 * 좌측 이동 시에는 컴포넌트에서 좌우 반전(scaleX)한다.
 */
export const QMI_WALK_FRAMES = [1, 2, 3, 4, 5].map(
  (n) => `${QMI_BASE}/walk/qmi-walk-${n}.webp`,
);

/** 아래→위로 올라갈 때 재생하는 클라이밍 프레임(뒷모습, 12프레임). */
export const QMI_CLIMB_FRAMES = Array.from(
  { length: 12 },
  (_, i) => `${QMI_BASE}/walk/qmi-climb-${i + 1}.webp`,
);

/** 위→아래로 내려올 때 재생하는 하강 프레임(뒷모습, 5프레임). */
export const QMI_DESCEND_FRAMES = [1, 2, 3, 4, 5].map(
  (n) => `${QMI_BASE}/walk/qmi-descend-${n}.webp`,
);

/** 드래그 중 상단을 기준으로 좌우로 달랑달랑 흔들리는 스윙 프레임(앞모습, 6프레임). */
export const QMI_SWING_FRAMES = [1, 2, 3, 4, 5, 6].map(
  (n) => `${QMI_BASE}/walk/qmi-swing-${n}.webp`,
);

export type QmiPose =
  | 'greeting'
  | 'idle'
  | 'pointing'
  | 'thumbs-up'
  | 'cheer'
  | 'explaining'
  | 'excited'
  | 'surprised'
  | 'presenting'
  | 'ok'
  | 'idea'
  | 'welcome'
  | 'celebrate'
  | 'standing'
  | 'like'
  | 'guiding'
  | 'waving'
  | 'jumping'
  | 'suit-greeting'
  | 'suit-idle'
  | 'expert-pointing'
  | 'expert-idle'
  | 'suit-standing'
  | 'graduate';

const KNOWN_POSES = new Set<QmiPose>([
  'greeting', 'idle', 'pointing', 'thumbs-up', 'cheer', 'explaining', 'excited',
  'surprised', 'presenting', 'ok', 'idea', 'welcome', 'celebrate', 'standing',
  'like', 'guiding', 'waving', 'jumping', 'suit-greeting', 'suit-idle',
  'expert-pointing', 'expert-idle', 'suit-standing', 'graduate',
]);

/** pose 키에 해당하는 webp 경로. 알 수 없는 키는 explaining 으로 대체. */
export function qmiPoseSrc(pose?: string): string {
  const key = (pose && KNOWN_POSES.has(pose as QmiPose) ? pose : 'explaining') as QmiPose;
  return `${QMI_BASE}/qmi-${key}.webp`;
}
