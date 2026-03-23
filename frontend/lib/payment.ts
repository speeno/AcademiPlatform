import { buildAuthHeader } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4400/api';

declare global {
  interface Window {
    IMP?: {
      init: (impCode: string) => void;
      request_pay: (
        params: Record<string, unknown>,
        callback: (response: {
          success: boolean;
          imp_uid?: string;
          merchant_uid?: string;
          error_msg?: string;
        }) => void,
      ) => void;
    };
  }
}

export type CheckoutTargetType = 'ENROLLMENT' | 'EXAM_APPLICATION' | 'TEXTBOOK';

function isMockPaymentEnabled() {
  if (process.env.NEXT_PUBLIC_PAYMENT_MOCK === 'true') return true;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') return true;
  return false;
}

async function openMockPaymentWindow(input: { orderNo: string; amount: number; name: string }) {
  const width = 440;
  const height = 700;
  const left = Math.max(0, Math.round((window.screen.width - width) / 2));
  const top = Math.max(0, Math.round((window.screen.height - height) / 2));
  const popup = window.open(
    '',
    'academiq-mock-payment',
    `width=${width},height=${height},left=${left},top=${top},resizable=no,scrollbars=no`,
  );

  if (!popup) {
    throw new Error('팝업이 차단되었습니다. 브라우저 팝업 허용 후 다시 시도해 주세요.');
  }

  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Mock Payment</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: #f8fafc; color: #111827; }
          .wrap { padding: 20px; }
          .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px; }
          .title { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
          .desc { font-size: 13px; color: #6b7280; margin: 0 0 16px; }
          .kv { font-size: 14px; display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e5e7eb; }
          .kv:last-child { border-bottom: 0; }
          .amount { font-weight: 700; color: #ea580c; }
          .btns { display: grid; gap: 10px; margin-top: 18px; }
          button { border: 0; border-radius: 10px; height: 42px; cursor: pointer; font-weight: 600; }
          .ok { background: #1d4ed8; color: #fff; }
          .cancel { background: #e5e7eb; color: #111827; }
          .badge { display: inline-block; font-size: 11px; background: #dbeafe; color: #1e40af; border-radius: 999px; padding: 4px 10px; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="card">
            <span class="badge">MOCK PAYMENT</span>
            <h1 class="title">결제창(임시 목업)</h1>
            <p class="desc">PG 연동 전 검증용 모의 결제 화면입니다. 실제 결제는 발생하지 않습니다.</p>
            <div class="kv"><span>주문번호</span><strong>${input.orderNo}</strong></div>
            <div class="kv"><span>상품명</span><strong>${input.name}</strong></div>
            <div class="kv"><span>결제금액</span><strong class="amount">${Number(input.amount).toLocaleString()}원</strong></div>
            <div class="btns">
              <button class="ok" onclick="window.opener.postMessage({source:'academiq-payment-mock',status:'success'}, '*'); window.close();">승인(성공)</button>
              <button class="cancel" onclick="window.opener.postMessage({source:'academiq-payment-mock',status:'cancel'}, '*'); window.close();">취소</button>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
  popup.document.close();

  return await new Promise<{ impUid: string; orderNo: string }>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener('message', onMessage);
      try { popup.close(); } catch { /* ignore */ }
      reject(new Error('결제 응답 시간이 초과되었습니다. 다시 시도해 주세요.'));
    }, 5 * 60 * 1000);

    const onMessage = (event: MessageEvent) => {
      const payload = event.data;
      if (!payload || payload.source !== 'academiq-payment-mock') return;
      window.clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
      if (payload.status === 'success') {
        resolve({
          impUid: `mock_imp_${Date.now()}`,
          orderNo: input.orderNo,
        });
      } else {
        reject(new Error('결제가 취소되었습니다.'));
      }
    };

    window.addEventListener('message', onMessage);
  });
}

export async function runPortOneCheckout(input: {
  targetType: CheckoutTargetType;
  targetId: string;
  amountHint?: number;
  name: string;
  buyerEmail?: string;
  buyerName?: string;
}) {
  const orderRes = await fetch(`${API}/payments/orders`, {
    method: 'POST',
    headers: buildAuthHeader(),
    body: JSON.stringify({
      targetType: input.targetType,
      targetId: input.targetId,
      amount: input.amountHint ?? 0,
    }),
  });
  const orderData = await orderRes.json().catch(() => ({}));
  if (!orderRes.ok) {
    throw new Error(orderData.message ?? '결제 주문 생성에 실패했습니다.');
  }

  const paymentResult = isMockPaymentEnabled()
    ? await openMockPaymentWindow({
        orderNo: orderData.orderNo,
        amount: Number(orderData.amount ?? input.amountHint ?? 0),
        name: input.name,
      })
    : await new Promise<{
        impUid: string;
        orderNo: string;
      }>((resolve, reject) => {
        const IMP = window.IMP;
        if (!IMP) {
          reject(new Error('PortOne 스크립트를 불러오지 못했습니다.'));
          return;
        }
        IMP.init(orderData.impCode);
        IMP.request_pay(
          {
            pg: 'html5_inicis',
            pay_method: 'card',
            merchant_uid: orderData.orderNo,
            name: input.name,
            amount: orderData.amount,
            buyer_email: input.buyerEmail ?? '',
            buyer_name: input.buyerName ?? '',
          },
          (rsp) => {
            if (!rsp.success || !rsp.imp_uid || !rsp.merchant_uid) {
              reject(new Error(rsp.error_msg ?? '결제가 취소되었거나 실패했습니다.'));
              return;
            }
            resolve({ impUid: rsp.imp_uid, orderNo: rsp.merchant_uid });
          },
        );
      });

  const verifyRes = await fetch(`${API}/payments/verify`, {
    method: 'POST',
    headers: buildAuthHeader(),
    body: JSON.stringify({
      imp_uid: paymentResult.impUid,
      merchant_uid: paymentResult.orderNo,
    }),
  });
  const verifyData = await verifyRes.json().catch(() => ({}));
  if (!verifyRes.ok) {
    throw new Error(verifyData.message ?? '결제 검증에 실패했습니다.');
  }

  return verifyData;
}

