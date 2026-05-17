'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, Pencil } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { API_BASE } from '@/lib/api-base';

const API = API_BASE;

const sessionStatusInfo: Record<string, { label: string; variant: 'default' | 'blue' | 'orange' | 'green' | 'red' }> = {
  UPCOMING: { label: '예정', variant: 'default' },
  OPEN: { label: '접수 중', variant: 'green' },
  CLOSED: { label: '마감', variant: 'orange' },
  CANCELLED:        { label: '취소', variant: 'red' },
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
  currency?: string;
  basePrice?: number;
  salePrice?: number | null;
  discountType?: 'NONE' | 'PERCENT' | 'FIXED';
  discountValue?: number;
  priceValidFrom?: string | null;
  priceValidUntil?: string | null;
  capacity: number | null;
  _count: { applications: number };
}

export default function AdminExamPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const [form, setForm] = useState({
    qualificationName: '',
    roundName: '',
    examAt: '',
    applyStartAt: '',
    applyEndAt: '',
    place: '',
    fee: '',
    capacity: '',
    status: 'UPCOMING',
    currency: 'KRW',
    basePrice: '',
    salePrice: '',
    discountType: 'NONE',
    discountValue: '0',
    priceValidFrom: '',
    priceValidUntil: '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);
  const basePriceNum = Number(form.basePrice) || 0;
  const salePriceNum = form.salePrice === '' ? basePriceNum : Number(form.salePrice || 0);
  const discountValueNum = Number(form.discountValue || 0);
  const discountAmount =
    form.discountType === 'PERCENT'
      ? Math.floor((salePriceNum * discountValueNum) / 100)
      : form.discountType === 'FIXED'
        ? discountValueNum
        : 0;
  const finalPreviewFee = Math.max(0, salePriceNum - discountAmount);

  const authHeader = (): Record<string, string> => {
    const t = localStorage.getItem('accessToken');
    const h: Record<string, string> = { 'Content-Type': 'application/json' }; if (t) h['Authorization'] = `Bearer ${t}`; return h;
  };

  const load = async () => {
    try {
      const res = await fetch(`${API}/exam/admin/sessions?limit=50`, { headers: authHeader() });
      if (res.ok) { const d = await res.json(); setSessions(d.sessions ?? d); }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      qualificationName: '',
      roundName: '',
      examAt: '',
      applyStartAt: '',
      applyEndAt: '',
      place: '',
      fee: '',
      capacity: '',
      status: 'UPCOMING',
      currency: 'KRW',
      basePrice: '',
      salePrice: '',
      discountType: 'NONE',
      discountValue: '0',
      priceValidFrom: '',
      priceValidUntil: '',
      reason: '',
    });
    setModal(true);
  };
  const openEdit = (s: Session) => {
    setEditing(s);
    setForm({
      qualificationName: s.qualificationName,
      roundName: s.roundName,
      examAt: s.examAt.slice(0, 16),
      applyStartAt: s.applyStartAt?.slice(0, 16) ?? '',
      applyEndAt: s.applyEndAt?.slice(0, 16) ?? '',
      place: s.place ?? '',
      fee: '',
      capacity: String(s.capacity ?? ''),
      status: s.status,
      currency: s.currency ?? 'KRW',
      basePrice: String((s.basePrice && s.basePrice > 0) ? s.basePrice : s.fee),
      salePrice: s.salePrice == null ? '' : String(s.salePrice),
      discountType: s.discountType ?? 'NONE',
      discountValue: String(s.discountValue ?? 0),
      priceValidFrom: s.priceValidFrom?.slice(0, 16) ?? '',
      priceValidUntil: s.priceValidUntil?.slice(0, 16) ?? '',
      reason: '',
    });
    setModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        qualificationName: form.qualificationName,
        roundName: form.roundName,
        examAt: form.examAt,
        applyStartAt: form.applyStartAt,
        applyEndAt: form.applyEndAt,
        place: form.place || null,
        fee: finalPreviewFee,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        status: form.status,
      };
      const url = editing ? `${API}/exam/admin/sessions/${editing.id}` : `${API}/exam/admin/sessions`;
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: authHeader(), body: JSON.stringify(body) });
      if (res.ok) {
        const saved = await res.json();
        await fetch(`${API}/admin/pricing/EXAM_SESSION/${saved.id}`, {
          method: 'PATCH',
          headers: authHeader(),
          body: JSON.stringify({
            currency: form.currency,
            basePrice: Number(form.basePrice) || 0,
            salePrice: form.salePrice === '' ? null : Number(form.salePrice),
            discountType: form.discountType,
            discountValue: Number(form.discountValue || 0),
            priceValidFrom: form.priceValidFrom || null,
            priceValidUntil: form.priceValidUntil || null,
            reason: form.reason || '시험 응시료 정책 변경',
          }),
        });
        setModal(false);
        load();
      }
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const columns: DataTableColumn<Session>[] = [
    { key: 'qual', header: '자격명', cell: (s) => <span className="font-medium">{s.qualificationName}</span> },
    { key: 'round', header: '회차', cell: (s) => <span className="text-muted-foreground">{s.roundName}</span>, className: 'w-28' },
    { key: 'examAt', header: '시험일', cell: (s) => <span className="text-xs text-muted-foreground">{new Date(s.examAt).toLocaleDateString('ko-KR')}</span>, className: 'w-24', hideOnMobile: true },
    { key: 'applyEnd', header: '접수마감', cell: (s) => <span className="text-xs text-muted-foreground">{s.applyEndAt ? new Date(s.applyEndAt).toLocaleDateString('ko-KR') : '-'}</span>, className: 'w-24', hideOnMobile: true },
    { key: 'status', header: '상태', cell: (s) => { const si = sessionStatusInfo[s.status] ?? { label: s.status, variant: 'default' as const }; return <BrandBadge variant={si.variant} className="text-xs">{si.label}</BrandBadge>; }, className: 'w-20' },
    { key: 'count', header: '접수자', cell: (s) => <Link href={`/admin/exam/${s.id}/applications`} className="flex items-center gap-1 text-xs font-semibold text-brand-blue"><Users className="w-3.5 h-3.5" /> {s._count?.applications ?? 0}명</Link>, className: 'w-20' },
    { key: 'fee', header: '응시료', cell: (s) => <span className="text-muted-foreground">{s.fee.toLocaleString()}원</span>, className: 'w-24', hideOnMobile: true },
    { key: 'actions', header: '관리', cell: (s) => <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>, className: 'w-12' },
  ];

  return (
    <div>
      <PageHeader
        title="시험 회차 관리"
        description={`총 ${sessions.length}개 회차`}
        actions={
          <BrandButton variant="primary" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> 회차 등록
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-5">{editing ? '회차 수정' : '회차 등록'}</h2>
            <div className="space-y-4">
              {[
                { label: '자격명', key: 'qualificationName', type: 'text', placeholder: 'AI 활용 전문가 1급' },
                { label: '회차명', key: 'roundName', type: 'text', placeholder: '2026-1회차' },
                { label: '시험 일시', key: 'examAt', type: 'datetime-local', placeholder: '' },
                { label: '접수 시작', key: 'applyStartAt', type: 'datetime-local', placeholder: '' },
                { label: '접수 마감', key: 'applyEndAt', type: 'datetime-local', placeholder: '' },
                { label: '시험 장소', key: 'place', type: 'text', placeholder: '서울 강남구...' },
                { label: '수용 인원', key: 'capacity', type: 'number', placeholder: '100' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input type={type} value={form[key as keyof typeof form]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1">상태</label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                  {Object.entries(sessionStatusInfo).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </div>
              <div className="border-t pt-4 mt-1 space-y-4">
                <p className="text-sm font-semibold">응시료 설정</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">통화</label>
                    <input value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value.toUpperCase() }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">응시료 정가</label>
                    <input type="number" value={form.basePrice} onChange={(e) => setForm((p) => ({ ...p, basePrice: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">판매가</label>
                    <input type="number" value={form.salePrice} onChange={(e) => setForm((p) => ({ ...p, salePrice: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">할인 유형</label>
                    <select value={form.discountType} onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                      {['NONE', 'PERCENT', 'FIXED'].map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">할인 값</label>
                    <input type="number" value={form.discountValue} onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">변경 사유</label>
                    <input value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">유효 시작</label>
                    <input type="datetime-local" value={form.priceValidFrom} onChange={(e) => setForm((p) => ({ ...p, priceValidFrom: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">유효 종료</label>
                    <input type="datetime-local" value={form.priceValidUntil} onChange={(e) => setForm((p) => ({ ...p, priceValidUntil: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="col-span-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                    최종 응시료: <span className="font-semibold">{finalPreviewFee.toLocaleString()}원</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      (정가 {basePriceNum.toLocaleString()} / 판매가 {salePriceNum.toLocaleString()} / 할인 {discountAmount.toLocaleString()})
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <BrandButton variant="ghost" size="sm" onClick={() => setModal(false)}>취소</BrandButton>
              <BrandButton variant="primary" size="sm" loading={saving} onClick={handleSave}>저장</BrandButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
