import { isPaymentModuleEnabled } from './payment-env';

/**
 * 부팅 전 필수 환경변수 검증. 누락 시 프로세스를 즉시 종료합니다.
 *
 * 정책:
 * - 전 환경 공통: JWT_SECRET, JWT_REFRESH_SECRET (Auth 부팅 자체가 불가)
 * - 프로덕션(NODE_ENV=production):
 *   - DATABASE_URL: 부팅 시 DB 미연결을 빠르게 노출
 *   - PAYMENT_MODULE_ENABLED=true(기본)일 때만 PORTONE_* 필수
 *   - VIEWER_TOKEN_SECRET 또는 JWT_SECRET: 교재 뷰어 토큰 서명
 * - PAYMENT_MODULE_ENABLED=false: PortOne 미설정 허용, 결제 API는 런타임 503
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
  const paymentEnabled = isPaymentModuleEnabled();

  if (isProduction) {
    const prodRequired: string[] = ['DATABASE_URL'];
    if (paymentEnabled) {
      prodRequired.push(
        'PORTONE_API_KEY',
        'PORTONE_API_SECRET',
        'PORTONE_WEBHOOK_SECRET',
      );
    }

    const prodMissing = prodRequired.filter((key) => !process.env[key]?.trim());
    if (prodMissing.length > 0) {
      console.error(
        `❌ 프로덕션 필수 환경변수가 누락되었습니다: ${prodMissing.join(', ')}`,
      );
      if (paymentEnabled) {
        console.error(
          '   결제 연동 전이라면 PAYMENT_MODULE_ENABLED=false 로 부팅할 수 있습니다.',
        );
      } else {
        console.error('   DATABASE_URL 등 필수 항목을 확인하세요.');
      }
      process.exit(1);
    }

    if (!paymentEnabled) {
      console.warn(
        '⚠️  PAYMENT_MODULE_ENABLED=false — PortOne 환경변수 없이 부팅합니다. 결제 API는 비활성입니다.',
      );
    }

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

    if (
      paymentEnabled &&
      (process.env.PAYMENT_DEV_BYPASS ?? '').toLowerCase() === 'true'
    ) {
      console.error(
        '❌ 프로덕션에서 PAYMENT_DEV_BYPASS=true 는 허용되지 않습니다. 환경 설정을 확인하세요.',
      );
      process.exit(1);
    }
  } else {
    const devPaymentKeys = [
      'PORTONE_API_KEY',
      'PORTONE_API_SECRET',
    ] as const;
    const missingPayment = devPaymentKeys.filter(
      (key) => !process.env[key]?.trim(),
    );
    if (paymentEnabled && missingPayment.length > 0) {
      console.warn(
        `⚠️  결제 키 미설정(${missingPayment.join(', ')}) — PAYMENT_DEV_BYPASS=true 가 아니면 결제 검증이 실패합니다.`,
      );
    }
    if (!paymentEnabled) {
      console.warn(
        '⚠️  PAYMENT_MODULE_ENABLED=false — 개발 환경에서 결제 API가 비활성입니다.',
      );
    }
  }
}
