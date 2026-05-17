import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PortOnePaymentInfo {
  status: string;
  amount: number;
  merchant_uid: string;
  [key: string]: unknown;
}

/**
 * 포트원(아임포트) PG 통신 어댑터.
 * - 결제 검증/취소/토큰 발급/응답 파싱 책임만 가진다.
 * - 키 부재·DEV bypass 정책 및 PG 측 에러 알림(`notifyOps`)을 PaymentService 와 분리한다.
 */
@Injectable()
export class PortOneClient {
  private readonly logger = new Logger(PortOneClient.name);

  constructor(private config: ConfigService) {}

  /** PaymentService.requestRefund 가 PG 취소 가능 여부 사전 판단에 활용. */
  hasCredentials(): boolean {
    return !!this.config.get('PORTONE_API_KEY', '') && !!this.config.get('PORTONE_API_SECRET', '');
  }

  isDevBypassEnabled(): boolean {
    return (
      process.env.NODE_ENV !== 'production' &&
      this.config.get<string>('PAYMENT_DEV_BYPASS', '').toLowerCase() === 'true'
    );
  }

  async verify(
    impUid: string,
    expectedAmount: number,
    expectedOrderNo?: string,
  ): Promise<boolean> {
    if (!this.hasCredentials()) {
      if (this.isDevBypassEnabled()) {
        this.logger.warn('PAYMENT_DEV_BYPASS=true — 포트원 검증을 건너뜁니다(개발 전용).');
        return true;
      }
      this.logger.error(
        '포트원 API 키가 설정되지 않았습니다. 프로덕션에서는 결제 검증이 거부됩니다.',
      );
      return false;
    }
    const paymentInfo = await this.fetchPayment(impUid);
    if (!paymentInfo) return false;
    const amountMatches = Number(paymentInfo.amount) === expectedAmount;
    const orderMatches = expectedOrderNo
      ? paymentInfo.merchant_uid === expectedOrderNo
      : true;
    return paymentInfo.status === 'paid' && amountMatches && orderMatches;
  }

  async cancel(impUid: string, amount: number, reason: string): Promise<void> {
    if (!this.hasCredentials() || !impUid) {
      if (this.isDevBypassEnabled()) {
        this.logger.warn('PAYMENT_DEV_BYPASS=true — 포트원 환불 호출을 건너뜁니다(개발 전용).');
        return;
      }
      // 키 또는 PG 트랜잭션 정보 부재 시 무음 통과 금지: DB 상태가 PAID 그대로 유지되어야 한다.
      await this.notifyOps('payment_refund_blocked_no_credentials', {
        impUid,
        amount,
        reason,
        hasApiKey: !!this.config.get('PORTONE_API_KEY', ''),
        hasApiSecret: !!this.config.get('PORTONE_API_SECRET', ''),
        hasImpUid: !!impUid,
      });
      throw new BadRequestException(
        '포트원 환불 정보가 부족하여 환불을 진행할 수 없습니다.',
      );
    }

    const accessToken = await this.requestAccessToken();
    if (!accessToken) {
      throw new BadRequestException('포트원 환불 토큰 발급에 실패했습니다.');
    }

    const cancelRes = await fetch('https://api.iamport.kr/payments/cancel', {
      method: 'POST',
      headers: { Authorization: accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ imp_uid: impUid, amount, reason }),
    });
    const cancelData = await cancelRes.json();
    if (!cancelRes.ok || cancelData.code) {
      await this.notifyOps('payment_refund_failed', {
        impUid,
        amount,
        reason,
        message: cancelData.message,
      });
      throw new BadRequestException(
        cancelData.message ?? '포트원 환불 처리에 실패했습니다.',
      );
    }
  }

  private async fetchPayment(impUid: string): Promise<PortOnePaymentInfo | null> {
    if (!this.hasCredentials()) return null;

    try {
      const accessToken = await this.requestAccessToken();
      if (!accessToken) return null;

      const paymentRes = await fetch(
        `https://api.iamport.kr/payments/${impUid}`,
        { headers: { Authorization: accessToken } },
      );
      const paymentData = await paymentRes.json();
      return (paymentData.response ?? null) as PortOnePaymentInfo | null;
    } catch (err) {
      this.logger.error('포트원 검증 오류', err);
      return null;
    }
  }

  private async requestAccessToken(): Promise<string | null> {
    const apiKey = this.config.get('PORTONE_API_KEY', '');
    const apiSecret = this.config.get('PORTONE_API_SECRET', '');
    if (!apiKey || !apiSecret) return null;

    const tokenRes = await fetch('https://api.iamport.kr/users/getToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imp_key: apiKey, imp_secret: apiSecret }),
    });
    const tokenData = await tokenRes.json();
    return tokenData.response?.access_token ?? null;
  }

  private async notifyOps(event: string, payload: Record<string, unknown>) {
    const webhook = this.config.get('PAYMENT_ALERT_WEBHOOK_URL', '');
    if (!webhook) return;
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          service: 'payment',
          at: new Date().toISOString(),
          payload,
        }),
      });
    } catch (err) {
      this.logger.warn(`운영 알림 전송 실패: ${event}`);
      this.logger.warn(err instanceof Error ? err.message : String(err));
    }
  }
}
