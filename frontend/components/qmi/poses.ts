/**
 * 큐미(Qmi) 마스코트 포즈 매핑.
 * 파일은 frontend/public/mascot/qmi/*.webp 에 위치한다.
 * 백엔드 QmiService 가 내려주는 pose 키와 동일하다.
 */
export const QMI_BASE = '/mascot/qmi';

export const QMI_AVATAR = `${QMI_BASE}/qmi-avatar.webp`;

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
