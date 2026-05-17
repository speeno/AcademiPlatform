'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { apiFetchWithAuth } from '@/lib/api-client';

const SETTING_META: Record<string, { label: string; type: string; placeholder: string }> = {
  site_name:          { label: '사이트 이름', type: 'text', placeholder: 'AcademiQ' },
  site_contact_email: { label: '대표 이메일', type: 'email', placeholder: 'academiq2026@gmail.com' },
  site_contact_phone: { label: '대표 전화번호', type: 'text', placeholder: '010-4710-2203' },
  site_address:       { label: '주소', type: 'text', placeholder: '성사동 롯데캐슬스카이엘 107-2301' },
  max_concurrent_sessions: { label: '최대 동시 재생 세션 수', type: 'number', placeholder: '1' },
  ses_from_email:     { label: 'SES 발신 이메일', type: 'email', placeholder: 'noreply@academiq.co.kr' },
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [priceHistories, setPriceHistories] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [res, historyRes] = await Promise.all([
          apiFetchWithAuth('/admin/settings'),
          apiFetchWithAuth('/admin/pricing/history?limit=20'),
        ]);
        if (res.ok) setSettings(await res.json());
        if (historyRes.ok) {
          const data = await historyRes.json();
          setPriceHistories(data.items ?? []);
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      const res = await apiFetchWithAuth(`/admin/settings/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: settings[key] }),
      });
      if (res.ok) { setSaved((p) => ({ ...p, [key]: true })); setTimeout(() => setSaved((p) => ({ ...p, [key]: false })), 2000); }
    } catch { /* ignore */ } finally { setSaving(null); }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-blue)' }} /></div>;

  const keys = [...Object.keys(SETTING_META), ...Object.keys(settings).filter((k) => !SETTING_META[k])];
  const uniqueKeys = [...new Set(keys)];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>시스템 설정</h1>
        <p className="text-sm text-gray-500 mt-1">플랫폼 운영 설정을 관리합니다.</p>
      </div>

      <div className="space-y-4">
        {uniqueKeys.map((key) => {
          const meta = SETTING_META[key] ?? { label: key, type: 'text', placeholder: '' };
          return (
            <div key={key} className="bg-white rounded-xl border p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">{meta.label}</label>
              <div className="flex gap-3">
                <input
                  type={meta.type}
                  value={settings[key] ?? ''}
                  onChange={(e) => setSettings((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={meta.placeholder}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                />
                <BrandButton
                  variant={saved[key] ? 'secondary' : 'outline'}
                  size="sm"
                  loading={saving === key}
                  onClick={() => handleSave(key)}
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  {saved[key] ? '저장됨' : '저장'}
                </BrandButton>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-white rounded-xl border p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-3">최근 가격 정책 변경 이력</h2>
        {priceHistories.length === 0 ? (
          <p className="text-sm text-gray-400">아직 가격 정책 이력이 없습니다.</p>
        ) : (
          <div className="overflow-auto border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">대상</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">변경</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">사유</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">시각</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {priceHistories.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-xs text-gray-600">{item.targetType}:{item.targetId.slice(0, 8)}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {item.oldBasePrice ?? '-'} / {item.oldSalePrice ?? '-'} → {item.newBasePrice ?? '-'} / {item.newSalePrice ?? '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">{item.reason ?? '-'}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString('ko-KR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
