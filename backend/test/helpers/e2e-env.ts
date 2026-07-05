/** E2E·CI 공통 — JWT 등 최소 env (DB 불필요) */
export function applyE2eTestEnv(): void {
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
  process.env.JWT_SECRET =
    process.env.JWT_SECRET ?? 'test-access-secret-min-32-chars-long!!';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-min-32-chars-long!';
  // 결제 e2e 는 모듈이 활성화된 상태의 동작을 검증한다. CI 는 이 값을 주입하지만
  // 로컬에서는 미설정이라 503 으로 실패하므로, 명시 설정이 없으면 기본 활성화한다.
  process.env.PAYMENT_MODULE_ENABLED =
    process.env.PAYMENT_MODULE_ENABLED ?? 'true';
}
