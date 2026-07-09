'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { BrandButton } from '@/components/ui/brand-button';
import {
  EMPTY_PROGRAM_FORM,
  ProgramForm,
  type ProgramFormValue,
} from '@/components/training/ProgramForm';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';

export default function NewTrainingProgramPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProgramFormValue>(EMPTY_PROGRAM_FORM);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.startDate > form.endDate) {
      toast.error('종료일은 시작일 이후여야 합니다.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetchWithAuth('/training/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          startDate: form.startDate,
          endDate: form.endDate,
          location: form.location.trim() || undefined,
          capacity: form.capacity ? Number(form.capacity) : undefined,
          courseId: form.course?.id,
        }),
      });
      if (!res.ok) {
        const data = await parseJsonSafe<{ message?: string }>(res, {});
        throw new Error(data.message ?? '강의 계획 등록에 실패했습니다.');
      }
      const program = await res.json();
      toast.success('강의 계획이 등록되었습니다. 이제 회차 일정을 추가해보세요.');
      router.push(`/training/programs/${program.id}/sessions`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/training"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 교육 일정
      </Link>
      <PageHeader
        eyebrow="교육 운영"
        title="새 강의 계획"
        description="교육 과정의 기본 정보와 기간을 입력하세요."
      />
      <form onSubmit={handleSubmit} className="space-y-6">
        <ProgramForm value={form} onChange={setForm} />
        <div className="flex justify-end gap-2">
          <BrandButton
            type="button"
            variant="outline"
            onClick={() => router.push('/training')}
          >
            취소
          </BrandButton>
          <BrandButton type="submit" variant="primary" loading={saving}>
            등록
          </BrandButton>
        </div>
      </form>
    </div>
  );
}
