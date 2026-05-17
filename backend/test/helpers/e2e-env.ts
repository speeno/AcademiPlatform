/** E2E·CI 공통 — JWT 등 최소 env (DB 불필요) */
export function applyE2eTestEnv(): void {
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
  process.env.JWT_SECRET =
    process.env.JWT_SECRET ?? 'test-access-secret-min-32-chars-long!!';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-min-32-chars-long!';
}
