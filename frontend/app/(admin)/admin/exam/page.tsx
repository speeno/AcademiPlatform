'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Pencil, Plus, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BrandBadge } from '@/components/ui/brand-badge';
import { BrandButton } from '@/components/ui/brand-button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { calculatePricingSnapshot, type DiscountType } from '@/lib/pricing-snapshot';

const API = API_BASE;

const sessionStatusInfo: Record<
  string,
  { label: string; variant: 'default' | 'blue' | 'orange' | 'green' | 'red' }
> = {
  UPCOMING: { label: '예정', variant: 'default' },
  OPEN: { label: '접수 중', variant: 'green' },
  CLOSED: { label: '마감', variant: 'orange' },
  CANCELLED: { label: '취소', variant: 'red' },
};

interface Session {
  id: string;
  qualificationName: string;
  roundName: string;
  status: string;
  examAt: string;
  applyStartAt: string;
  applyEndAt: string;
  place: string | null;
  fee: number;
  displayFee?: number | null;
  currency?: string;
  basePrice?: number;
  salePrice?: number | null;
  discountType?: DiscountType;
  discountValue?: number;
  priceValidFrom?: string | null;
  priceValidUntil?: string | null;
  capacity: number | null;
  _count: { applications: number };
}

type SessionForm = {
  qualificationName: string;
  roundName: string;
  examAt: string;
  applyStartAt: string;
  applyEndAt: string;
  place: string;
  capacity: string;
  status: string;
  currency: string;
  basePrice: string;
  reason: string;
};

function buildDefaultForm(): SessionForm {
  return {
    qualificationName: '',
    roundName: '',
    examAt: '',
    applyStartAt: '',
    applyEndAt: '',
    place: '',
    capacity: '',
    status: 'UPCOMING',
    currency: 'KRW',
    basePrice: '',
    reason: '',
  };
}

export default function AdminExamPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SessionForm>(buildDefaultForm());

  // 단일 소스: 목록 금액(displayFee/final)을 편집값과 저장값으로 통일한다.
  const finalPreviewFee = useMemo(() => {
    const amount = Number(form.basePrice) || 0;
    return calculatePricingSnapshot({
      legacyPrice: amount,
      basePrice: amount,
      salePrice: null,
      discountType: 'NONE',
      discountValue: 0,
      validFrom: null,
      validUntil: null,
    }).finalAmount;
  }, [form.basePrice]);

  const load = async () => {
    try {
      const res = await fetch(`${API}/exam/admin/sessions?limit=50`, {
        headers: buildAuthHeader(false),
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions ?? data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(buildDefaultForm());
    setModal(true);
  };

  const openEdit = (session: Session) => {
    const unifiedAmount = session.displayFee ?? session.fee;
    setEditing(session);
    setForm({
      qualificationName: session.qualificationName,
      roundName: session.roundName,
      examAt: session.examAt.slice(0, 16),
      applyStartAt: session.applyStartAt?.slice(0, 16) ?? '',
      applyEndAt: session.applyEndAt?.slice(0, 16) ?? '',
      place: session.place ?? '',
      capacity: String(session.capacity ?? ''),
      status: session.status,
      currency: session.currency ?? 'KRW',
      basePrice: String(unifiedAmount),
      reason: '',
    });
    setModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const unifiedAmount = Number(form.basePrice) || 0;
      const body = {
        qualificationName: form.qualificationName,
        roundName: form.roundName,
        examAt: form.examAt,
        applyStartAt: form.applyStartAt,
        applyEndAt: form.applyEndAt,
        place: form.place || null,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        status: form.status,
        fee: unifiedAmount,
      };

      const url = editing
        ? `${API}/exam/admin/sessions/${editing.id}`
        : `${API}/exam/admin/sessions`;
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: buildAuthHeader(),
        body: JSON.stringify(body),
      });
      if (!res.ok) return;

      const saved = await res.json();
      await fetch(`${API}/admin/pricing/EXAM_SESSION/${saved.id}`, {
        method: 'PATCH',
        headers: buildAuthHeader(),
        body: JSON.stringify({
          currency: form.currency,
          basePrice: unifiedAmount,
          salePrice: null,
          discountType: 'NONE',
          discountValue: 0,
          priceValidFrom: null,
          priceValidUntil: null,
          reason: form.reason || '시험 응시료 단일 필드 동기화',
        }),
      });

      setModal(false);
      load();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<Session>[] = [
    {
      key: 'qual',
      header: '자격명',
      cell: (s) => <span className="font-medium">{s.qualificationName}</span>,
    },
    {
      key: 'round',
      header: '회차',
      cell: (s) => <span className="text-muted-foreground">{s.roundName}</span>,
      className: 'w-28',
    },
    {
      key: 'examAt',
      header: '시험일',
      cell: (s) => (
        <span className="text-xs text-muted-foreground">
          {new Date(s.examAt).toLocaleDateString('ko-KR')}
        </span>
      ),
      className: 'w-24',
      hideOnMobile: true,
    },
    {
      key: 'applyEnd',
      header: '접수마감',
      cell: (s) => (
        <span className="text-xs text-muted-foreground">
          {s.applyEndAt ? new Date(s.applyEndAt).toLocaleDateString('ko-KR') : '-'}
        </span>
      ),
      className: 'w-24',
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: '상태',
      cell: (s) => {
        const info = sessionStatusInfo[s.status] ?? {
          label: s.status,
          variant: 'default' as const,
        };
        return (
          <BrandBadge variant={info.variant} className="text-xs">
            {info.label}
          </BrandBadge>
        );
      },
      className: 'w-20',
    },
    {
      key: 'count',
      header: '접수자',
      cell: (s) => (
        <Link
          href={`/admin/exam/${s.id}/applications`}
          className="flex items-center gap-1 text-xs font-semibold text-brand-blue"
        >
          <Users className="h-3.5 w-3.5" /> {s._count?.applications ?? 0}명
        </Link>
      ),
      className: 'w-20',
    },
    {
      key: 'fee',
      header: '응시료',
      cell: (s) => (
        <span className="tabular-nums text-muted-foreground">
          {(s.displayFee ?? s.fee).toLocaleString('ko-KR')}원
        </span>
      ),
      className: 'w-24',
      hideOnMobile: true,
    },
    {
      key: 'actions',
      header: '관리',
      cell: (s) => (
        <button
          type="button"
          onClick={() => openEdit(s)}
          className="rounded p-1.5 hover:bg-muted"
          aria-label="회차 수정"
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      ),
      className: 'w-12',
    },
  ];

  return (
    <div>
      <PageHeader
        title="시험 회차 관리"
        description={`총 ${sessions.length}개 회차 · 목록 응시료를 기준으로 편집/내부/사용자 노출 금액을 동일하게 유지합니다.`}
        actions={
          <BrandButton variant="primary" size="sm" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" /> 회차 등록
          </BrandButton>
        }
      />

      <DataTable
        columns={columns}
        rows={sessions}
        rowKey={(s) => s.id}
        loading={loading}
        empty={<p>시험 회차가 없습니다.</p>}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-bold">{editing ? '회차 수정' : '회차 등록'}</h2>

            <div className="space-y-4">
              {[
                { label: '자격명', key: 'qualificationName', type: 'text', placeholder: 'AI 크리에이터' },
                { label: '회차명', key: 'roundName', type: 'text', placeholder: '2026-1회차' },
                { label: '시험 일시', key: 'examAt', type: 'datetime-local', placeholder: '' },
                { label: '접수 시작', key: 'applyStartAt', type: 'datetime-local', placeholder: '' },
                { label: '접수 마감', key: 'applyEndAt', type: 'datetime-local', placeholder: '' },
                { label: '시험 장소', key: 'place', type: 'text', placeholder: '서울 강남구...' },
                { label: '수용 인원', key: 'capacity', type: 'number', placeholder: '100' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="mb-1 block text-sm font-medium">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof SessionForm]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              ))}

              <div>
                <label className="mb-1 block text-sm font-medium">상태</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                >
                  {Object.entries(sessionStatusInfo).map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-1 space-y-4 border-t pt-4">
                <p className="text-sm font-semibold">응시료 설정 (단일 필드)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">통화</label>
                    <input
                      value={form.currency}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))
                      }
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">응시료</label>
                    <input
                      type="number"
                      value={form.basePrice}
                      onChange={(e) => setForm((prev) => ({ ...prev, basePrice: e.target.value }))}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-sm font-medium">변경 사유</label>
                    <input
                      value={form.reason}
                      onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                    최종 응시료:{' '}
                    <span className="font-semibold tabular-nums">
                      {finalPreviewFee.toLocaleString('ko-KR')}원
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      (목록/내부/사용자 표시 동일)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <BrandButton variant="ghost" size="sm" onClick={() => setModal(false)}>
                취소
              </BrandButton>
              <BrandButton variant="primary" size="sm" loading={saving} onClick={handleSave}>
                저장
              </BrandButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
