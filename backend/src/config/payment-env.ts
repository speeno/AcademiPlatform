/**
 * 결제 모듈 활성화 여부.
 * 기본값 false — PortOne 연동 전까지 API 호출·키 검증 없이 부팅.
 * `PAYMENT_MODULE_ENABLED=true` 로 명시할 때만 결제 API·PortOne 검증을 사용한다.
 */
export function isPaymentModuleEnabled(): boolean {
  const raw = (process.env.PAYMENT_MODULE_ENABLED ?? 'false')
    .trim()
    .toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'on';
}
