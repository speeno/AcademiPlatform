'use client';

import { useEffect, useState } from 'react';
import { BrandButton } from '@/components/ui/brand-button';
import { PageHeader } from '@/components/layout/PageHeader';
import { buildAuthHeader } from '@/lib/auth';
import { API_BASE } from '@/lib/api-base';

interface Campaign {
  id: string;
  name: string;
  courseId?: string | null;
  isActive: boolean;
  _count?: { codes: number; grants: number };
}

export default function AdminVouchersPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState('');
  const [codes, setCodes] = useState<Record<string, string>>({});

  const load = async () => {
    const res = await fetch(`${API_BASE}/admin/vouchers/campaigns`, { headers: buildAuthHeader(false) });
    if (res.ok) setCampaigns(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  const createCampaign = async () => {
    if (!name.trim()) return;
    await fetch(`${API_BASE}/admin/vouchers/campaigns`, {
      method: 'POST',
      headers: buildAuthHeader(),
      body: JSON.stringify({ name: name.trim(), isActive: true }),
    });
    setName('');
    load();
  };

  const addCodes = async (campaignId: string) => {
    const raw = codes[campaignId] ?? '';
    const parsed = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (parsed.length === 0) return;
    await fetch(`${API_BASE}/admin/vouchers/campaigns/${campaignId}/codes`, {
      method: 'POST',
      headers: buildAuthHeader(),
      body: JSON.stringify({ codes: parsed }),
    });
    setCodes((prev) => ({ ...prev, [campaignId]: '' }));
    load();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="북이오 무료 이용권 관리"
        description="캠페인을 만들고 이용권 코드를 업로드하면 수강신청자에게 자동 지급됩니다."
      />

      <div className="bg-white rounded-xl border p-4 flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          placeholder="캠페인명 (예: 2026 상반기 PROMPT 무료권)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <BrandButton size="sm" onClick={createCampaign}>캠페인 생성</BrandButton>
      </div>

      {campaigns.map((campaign) => (
        <div key={campaign.id} className="bg-white rounded-xl border p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-foreground">{campaign.name}</p>
              <p className="text-xs text-muted-foreground">코드 {campaign._count?.codes ?? 0}개 / 지급 {campaign._count?.grants ?? 0}건</p>
            </div>
          </div>
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm min-h-24"
            placeholder={'한 줄에 하나씩 쿠폰 코드를 입력하세요.\n예) BUKIO-ABC-001'}
            value={codes[campaign.id] ?? ''}
            onChange={(e) => setCodes((prev) => ({ ...prev, [campaign.id]: e.target.value }))}
          />
          <div className="flex justify-end">
            <BrandButton size="sm" variant="secondary" onClick={() => addCodes(campaign.id)}>코드 업로드</BrandButton>
          </div>
        </div>
      ))}
    </div>
  );
}
