'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookOpen, FileText, MessageSquare, ArrowRight } from 'lucide-react';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { BrandCard } from '@/components/ui/brand-card';
import { BrandButton } from '@/components/ui/brand-button';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from 'sonner';

interface CmsCourse {
  id: string;
  title: string;
  slug: string;
}

export default function InstructorCmsDashboardPage() {
  const [courses, setCourses] = useState<CmsCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch(`${API_BASE}/cms/courses/my`, {
          headers: buildAuthHeader(false),
          credentials: 'include',
        });
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error('강사 배정 강좌를 불러오지 못했습니다.');
        setCourses(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : '강사 CMS 대시보드 로드 실패');
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="강사용 CMS 대시보드"
        description="배정된 강좌를 선택해 콘텐츠를 편집하고 검수 요청을 진행하세요."
        eyebrow="강사"
      />

      <div className="grid md:grid-cols-3 gap-3">
        <BrandCard padding="md" className="border">
          <p className="text-xs text-muted-foreground">배정 강좌 수</p>
          <p className="text-2xl font-extrabold mt-1">{loading ? '-' : courses.length}</p>
        </BrandCard>
        <BrandCard padding="md" className="border">
          <p className="text-xs text-muted-foreground">콘텐츠 작업</p>
          <p className="text-sm font-semibold mt-1 text-foreground">강좌별 CMS 편집</p>
        </BrandCard>
        <BrandCard padding="md" className="border">
          <p className="text-xs text-muted-foreground">질문함</p>
          <Link href="/classroom/instructor/questions" className="inline-flex items-center gap-1 text-sm font-semibold mt-1 text-blue-700">
            배정 질문 확인 <ArrowRight className="w-4 h-4" />
          </Link>
        </BrandCard>
      </div>

      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            배정 강좌
          </h2>
          <Link href="/classroom/instructor/questions" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            강사 질문함
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">현재 CMS 작업 가능한 배정 강좌가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {courses.map((course) => (
              <div key={course.id} className="flex items-center justify-between border rounded-lg px-3 py-3">
                <div>
                  <p className="font-medium text-sm text-foreground">{course.title}</p>
                  <p className="text-xs text-muted-foreground">slug: {course.slug}</p>
                </div>
                <Link href={`/classroom/instructor/cms/workspace?courseId=${course.id}`}>
                  <BrandButton size="sm" variant="outline">
                    <FileText className="w-4 h-4 mr-1" />
                    CMS 열기
                  </BrandButton>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

