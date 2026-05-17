/**
 * 부팅 전 필수 환경변수 검증. 누락 시 프로세스를 즉시 종료합니다.
 *
 * 정책:
 * - 전 환경 공통: JWT_SECRET, JWT_REFRESH_SECRET (Auth 부팅 자체가 불가)
 * - 프로덕션(NODE_ENV=production):
 *   - DATABASE_URL: 부팅 시 DB 미연결을 빠르게 노출
 *   - PORTONE_API_KEY / PORTONE_API_SECRET: 결제 검증 불가 → 우회 위험
 *   - PORTONE_WEBHOOK_SECRET: 웹훅 가드가 무인증 통과를 거부하므로 미설정 시 결제 후처리 자체가 막힘
 *   - VIEWER_TOKEN_SECRET 또는 JWT_SECRET: 교재 뷰어 토큰 서명. 'changeme' 등 약한 fallback 금지.
 * - 스테이징 등 비프로덕션은 경고로 완화.
 */
export function validateRequiredEnv(): void {
  const baseRequired = ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const;
  const baseMissing = baseRequired.filter((key) => !process.env[key]?.trim());

  if (baseMissing.length > 0) {
    console.error(
      `❌ 필수 환경변수가 설정되지 않았습니다: ${baseMissing.join(', ')}`,
    );
    console.error(
      '   JWT_SECRET, JWT_REFRESH_SECRET 을 .env 또는 Render Environment에 설정하세요.',
    );
    process.exit(1);
  }

  const isProduction = process.env.NODE_ENV === 'production';

  // 프로덕션 필수: 결제·DB·뷰어 시크릿
  if (isProduction) {
    const prodRequired = [
      'DATABASE_URL',
      'PORTONE_API_KEY',
      'PORTONE_API_SECRET',
      'PORTONE_WEBHOOK_SECRET',
    ] as const;
    const prodMissing = prodRequired.filter(
      (key) => !process.env[key]?.trim(),
    );
    if (prodMissing.length > 0) {
      console.error(
        `❌ 프로덕션 필수 환경변수가 누락되었습니다: ${prodMissing.join(', ')}`,
      );
      console.error(
        '   결제 검증·웹훅 인증·DB 연결이 보장되지 않아 부팅을 중단합니다.',
      );
      process.exit(1);
    }

    // 뷰어 토큰 시크릿: VIEWER_TOKEN_SECRET 권장, 미설정 시 JWT_SECRET fallback 가능.
    const hasViewerSecret =
      !!process.env.VIEWER_TOKEN_SECRET?.trim() ||
      !!process.env.JWT_SECRET?.trim();
    if (!hasViewerSecret) {
      console.error(
        '❌ 교재 뷰어 토큰 시크릿이 없습니다: VIEWER_TOKEN_SECRET 또는 JWT_SECRET 을 설정하세요.',
      );
      process.exit(1);
    }
    if (!process.env.VIEWER_TOKEN_SECRET?.trim()) {
      console.warn(
        '⚠️  VIEWER_TOKEN_SECRET 미설정 — JWT_SECRET 으로 대체합니다. 권한 분리를 위해 별도 키 설정을 권장합니다.',
      );
    }

    // PAYMENT_DEV_BYPASS 가 프로덕션에서 켜져 있으면 거부.
    if (
      (process.env.PAYMENT_DEV_BYPASS ?? '').toLowerCase() === 'true'
    ) {
      console.error(
        '❌ 프로덕션에서 PAYMENT_DEV_BYPASS=true 는 허용되지 않습니다. 환경 설정을 확인하세요.',
      );
      process.exit(1);
    }
  } else {
    // 비프로덕션: 결제 키 누락은 경고만(개발 편의).
    const devPaymentKeys = [
      'PORTONE_API_KEY',
      'PORTONE_API_SECRET',
    ] as const;
    const missingPayment = devPaymentKeys.filter(
      (key) => !process.env[key]?.trim(),
    );
    if (missingPayment.length > 0) {
      console.warn(
        `⚠️  결제 키 미설정(${missingPayment.join(', ')}) — PAYMENT_DEV_BYPASS=true 가 아니면 결제 검증이 실패합니다.`,
      );
    }
  }
}
