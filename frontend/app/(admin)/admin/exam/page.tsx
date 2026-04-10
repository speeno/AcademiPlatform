'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, Loader2, Pencil } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
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

  if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-blue)' }} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>시험 회차 관리</h1>
          <p className="text-sm text-gray-500 mt-1">총 {sessions.length}개 회차</p>
        </div>
        <BrandButton variant="primary" size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> 회차 등록
        </BrandButton>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['자격명', '회차', '시험일', '접수마감', '상태', '접수자', '응시료', '관리'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {sessions.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">시험 회차가 없습니다.</td></tr>
            ) : sessions.map((s) => {
              const si = sessionStatusInfo[s.status] ?? { label: s.status, variant: 'default' as const };
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.qualificationName}</td>
                  <td className="px-4 py-3 text-gray-600">{s.roundName}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{new Date(s.examAt).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{s.applyEndAt ? new Date(s.applyEndAt).toLocaleDateString('ko-KR') : '-'}</td>
                  <td className="px-4 py-3"><BrandBadge variant={si.variant} className="text-xs">{si.label}</BrandBadge></td>
                  <td className="px-4 py-3 text-center">
                    <Link href={`/admin/exam/${s.id}/applications`} className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--brand-blue)' }}>
                      <Users className="w-3.5 h-3.5" /> {s._count?.applications ?? 0}명
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.fee.toLocaleString()}원</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-gray-100"><Pencil className="w-3.5 h-3.5 text-gray-500" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
                  <div className="col-span-2 rounded-lg border bg-gray-50 px-3 py-2 text-sm">
                    최종 응시료: <span className="font-semibold">{finalPreviewFee.toLocaleString()}원</span>
                    <span className="ml-2 text-xs text-gray-500">
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
