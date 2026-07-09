'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BrandButton } from '@/components/ui/brand-button';
import {
  EMPTY_PROGRAM_FORM,
  ProgramForm,
  type ProgramFormValue,
} from '@/components/training/ProgramForm';
import { ShareLinkCard } from '@/components/training/ShareLinkCard';
import { useTrainingProgram } from '@/components/training/program-context';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';

/** 개요 탭 — 프로그램 기본 정보 수정 + 삭제 */
export default function ProgramOverviewPage() {
  const router = useRouter();
  const { program, refresh } = useTrainingProgram();
  const [form, setForm] = useState<ProgramFormValue>(EMPTY_PROGRAM_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setForm({
      title: program.title,
      description: program.description ?? '',
      startDate: program.startDate,
      endDate: program.endDate,
      location: program.location ?? '',
      capacity: program.capacity ? String(program.capacity) : '',
      course: program.course ? { id: program.course.id, title: program.course.title } : null,
      status: program.status,
    });
  }, [program]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetchWithAuth(`/training/programs/${program.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          startDate: form.startDate,
          endDate: form.endDate,
          location: form.location.trim() || null,
          capacity: form.capacity ? Number(form.capacity) : null,
          courseId: form.course?.id ?? null,
          status: form.status,
        }),
      });
      if (!res.ok) {
        const data = await parseJsonSafe<{ message?: string }>(res, {});
        throw new Error(data.message ?? '저장에 실패했습니다.');
      }
      toast.success('강의 계획이 저장되었습니다.');
      await refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        '이 강의 계획을 삭제할까요?\n회차·수강생·출석 기록이 함께 삭제되며 되돌릴 수 없습니다.',
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await apiFetchWithAuth(`/training/programs/${program.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await parseJsonSafe<{ message?: string }>(res, {});
        throw new Error(data.message ?? '삭제에 실패했습니다.');
      }
      toast.success('강의 계획이 삭제되었습니다.');
      router.push('/training/programs');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <ProgramForm value={form} onChange={setForm} showStatus />
        <div className="flex items-center justify-between">
          <BrandButton
            type="button"
            variant="danger"
            size="sm"
            loading={deleting}
            onClick={handleDelete}
          >
            삭제
          </BrandButton>
          <BrandButton type="submit" variant="primary" loading={saving}>
            저장
          </BrandButton>
        </div>
      </form>

      <ShareLinkCard
        programId={program.id}
        shareToken={program.shareToken}
        onChanged={() => void refresh()}
      />
    </div>
  );
}
