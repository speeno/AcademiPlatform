/**
 * 결제 모듈 활성화 여부.
 * `PAYMENT_MODULE_ENABLED=false` 이면 PortOne 키 없이 부팅 가능하며, 결제 API는 503으로 응답한다.
 */
export function isPaymentModuleEnabled(): boolean {
  const raw = (process.env.PAYMENT_MODULE_ENABLED ?? 'true').trim().toLowerCase();
  return raw !== 'false' && raw !== '0' && raw !== 'off';
}
