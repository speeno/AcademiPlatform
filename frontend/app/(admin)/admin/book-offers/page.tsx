'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { buildAuthHeader } from '@/lib/auth';
import { API_BASE } from '@/lib/api-base';
import { toast } from 'sonner';

interface BookOffer {
  id: string;
  code?: string;
  title: string;
  price: number;
  coverImageUrl?: string;
  purchaseUrl: string;
  isActive?: boolean;
}

export default function AdminBookOffersPage() {
  const [offers, setOffers] = useState<BookOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/book-offers`, {
        headers: buildAuthHeader(false),
        credentials: 'include',
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error('교재 링크 목록을 불러오지 못했습니다.');
      setOffers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '교재 링크 목록을 불러오지 못했습니다.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addOffer = async () => {
    const payload = {
      code: '',
      title: '',
      price: 0,
      coverImageUrl: '',
      purchaseUrl: '',
      isActive: true,
    };
    try {
      const res = await fetch(`${API_BASE}/admin/book-offers`, {
        method: 'POST',
        headers: buildAuthHeader(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '교재 링크 추가에 실패했습니다.');
      await load();
      toast.success('교재 링크를 추가했습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '교재 링크 추가에 실패했습니다.';
      toast.error(message);
    }
  };

  const saveOffer = async (offer: BookOffer) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/book-offers/${offer.id}`, {
        method: 'PATCH',
        headers: buildAuthHeader(),
        credentials: 'include',
        body: JSON.stringify(offer),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '교재 링크 저장에 실패했습니다.');
      await load();
      toast.success('교재 링크를 저장했습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '교재 링크 저장에 실패했습니다.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteOffer = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/book-offers/${id}`, {
        method: 'DELETE',
        headers: buildAuthHeader(false),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('교재 링크 삭제에 실패했습니다.');
      await load();
      toast.success('교재 링크를 삭제했습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '교재 링크 삭제에 실패했습니다.';
      toast.error(message);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">불러오는 중...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-blue" >북이오 구매 링크 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">공개 `/books` 페이지에 노출할 교재 링크를 관리합니다.</p>
        </div>
        <BrandButton variant="primary" size="sm" onClick={addOffer}>
          <Plus className="w-4 h-4 mr-1" />
          링크 추가
        </BrandButton>
      </div>

      {offers.map((offer, idx) => (
        <div key={offer.id} className="bg-white rounded-xl border p-4 grid md:grid-cols-2 gap-3">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="코드 (PROMPT)" value={offer.code ?? ''} onChange={(e) => {
            const next = [...offers];
            next[idx] = { ...next[idx], code: e.target.value };
            setOffers(next);
          }} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="가격" type="number" value={offer.price ?? 0} onChange={(e) => {
            const next = [...offers];
            next[idx] = { ...next[idx], price: Number(e.target.value) };
            setOffers(next);
          }} />
          <input className="border rounded-lg px-3 py-2 text-sm md:col-span-2" placeholder="제목" value={offer.title ?? ''} onChange={(e) => {
            const next = [...offers];
            next[idx] = { ...next[idx], title: e.target.value };
            setOffers(next);
          }} />
          <input className="border rounded-lg px-3 py-2 text-sm md:col-span-2" placeholder="표지 URL (/covers/...)" value={offer.coverImageUrl ?? ''} onChange={(e) => {
            const next = [...offers];
            next[idx] = { ...next[idx], coverImageUrl: e.target.value };
            setOffers(next);
          }} />
          <input className="border rounded-lg px-3 py-2 text-sm md:col-span-2" placeholder="구매 URL (https://buk.io/...)" value={offer.purchaseUrl ?? ''} onChange={(e) => {
            const next = [...offers];
            next[idx] = { ...next[idx], purchaseUrl: e.target.value };
            setOffers(next);
          }} />
          <label className="text-sm text-foreground flex items-center gap-2">
            <input type="checkbox" checked={offer.isActive !== false} onChange={(e) => {
              const next = [...offers];
              next[idx] = { ...next[idx], isActive: e.target.checked };
              setOffers(next);
            }} />
            활성화
          </label>
          <div className="flex justify-end gap-2">
            <BrandButton variant="outline" size="sm" onClick={() => deleteOffer(offer.id)}>
              <Trash2 className="w-4 h-4 mr-1" />
              삭제
            </BrandButton>
            <BrandButton variant="secondary" size="sm" loading={saving} onClick={() => saveOffer(offer)}>
              <Save className="w-4 h-4 mr-1" />
              저장
            </BrandButton>
          </div>
        </div>
      ))}
    </div>
  );
}
