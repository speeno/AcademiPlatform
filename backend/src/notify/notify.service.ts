import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface NotifyPayload {
  to: string;
  subject?: string;
  body: string;
  type: 'email' | 'sms' | 'kakao';
}

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  constructor(private config: ConfigService) {}

  async send(payload: NotifyPayload): Promise<void> {
    if (payload.type === 'email') {
      await this.sendEmail(payload.to, payload.subject ?? 'AcademiQ 알림', payload.body);
    } else if (payload.type === 'sms' || payload.type === 'kakao') {
      await this.sendSms(payload.to, payload.body);
    }
  }

  async sendEnrollmentConfirm(to: string, userName: string, courseTitle: string) {
    await this.send({
      type: 'email',
      to,
      subject: '[AcademiQ] 수강 신청이 완료되었습니다.',
      body: `
        <p>${userName}님, 안녕하세요.</p>
        <p><strong>${courseTitle}</strong> 과정 수강 신청이 완료되었습니다.</p>
        <p>마이페이지 > 내 강의실에서 강의를 수강하실 수 있습니다.</p>
      `,
    });
  }

  async sendExamApplicationConfirm(to: string, userName: string, examName: string) {
    await this.send({
      type: 'email',
      to,
      subject: '[AcademiQ] 시험 접수가 완료되었습니다.',
      body: `
        <p>${userName}님, 안녕하세요.</p>
        <p><strong>${examName}</strong> 시험 접수가 완료되었습니다.</p>
        <p>시험 일정과 장소를 꼭 확인해 주세요.</p>
      `,
    });
  }

  async sendPaymentConfirm(to: string, userName: string, amount: number, orderNo: string) {
    await this.send({
      type: 'email',
      to,
      subject: '[AcademiQ] 결제가 완료되었습니다.',
      body: `
        <p>${userName}님, 결제가 완료되었습니다.</p>
        <p>주문번호: ${orderNo}</p>
        <p>결제금액: ${amount.toLocaleString()}원</p>
      `,
    });
  }

  private async sendEmail(to: string, subject: string, htmlBody: string): Promise<void> {
    const sesFrom = this.config.get('AWS_SES_FROM_EMAIL', '');
    const awsRegion = this.config.get('AWS_REGION', 'ap-northeast-2');
    const awsAccessKey = this.config.get('AWS_ACCESS_KEY_ID', '');

    if (!awsAccessKey) {
      this.logger.log(`[개발] 이메일 발송 생략 — to: ${to}, subject: ${subject}`);
      return;
    }

    try {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const ses = new SESClient({ region: awsRegion });
      await ses.send(new SendEmailCommand({
        Source: sesFrom,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: { Html: { Data: htmlBody, Charset: 'UTF-8' } },
        },
      }));
      this.logger.log(`이메일 발송 완료: ${to}`);
    } catch (err) {
      this.logger.error(`이메일 발송 실패: ${to}`, err);
    }
  }

  private async sendSms(to: string, message: string): Promise<void> {
    const apiKey = this.config.get('SOLAPI_API_KEY', '');
    const sender = this.config.get('SOLAPI_SENDER', '');

    if (!apiKey) {
      this.logger.log(`[개발] SMS 발송 생략 — to: ${to}, msg: ${message}`);
      return;
    }

    try {
      const res = await fetch('https://api.solapi.com/messages/v4/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          message: { to, from: sender, text: message },
        }),
      });
      if (!res.ok) throw new Error(`SMS 오류: ${res.status}`);
      this.logger.log(`SMS 발송 완료: ${to}`);
    } catch (err) {
      this.logger.error(`SMS 발송 실패: ${to}`, err);
    }
  }
}
