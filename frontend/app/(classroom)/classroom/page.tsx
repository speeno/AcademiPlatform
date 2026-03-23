'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { BrandCard } from '@/components/ui/brand-card';
import { BrandProgress } from '@/components/ui/brand-progress';
import { BrandBadge } from '@/components/ui/brand-badge';
import { buildAuthHeader, getAccessToken, redirectToLogin } from '@/lib/auth';

interface Enrollment {
  id: string;
  progressRate: number;
  expiresAt: string | null;
  course: {
    id: string;
    title: string;
    category: string | null;
    instructor: { name: string };
    learningPeriodDays: number | null;
    _count: { modules: number };
  };
}

export default function ClassroomPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          redirectToLogin(router, '/classroom');
          return;
        }
        const headers = buildAuthHeader(false);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lms/classroom`, { headers });
        if (res.ok) {
          const data = await res.json();
          setEnrollments(data);
        }
      } catch {
        // 에러 무시 (UI에 빈 상태 표시)
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-blue)' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>내 강의실</h1>
        <p className="text-sm text-gray-500 mt-1">수강 중인 과정을 확인하고 학습을 이어가세요.</p>
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-4">수강 중인 과정이 없습니다.</p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1 text-sm font-semibold"
            style={{ color: 'var(--brand-orange)' }}
          >
            교육과정 보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {enrollments.map((enrollment) => (
            <Link key={enrollment.id} href={`/classroom/${enrollment.course.id}`}>
              <BrandCard hoverable accent="blue" padding="lg" className="h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--brand-blue-subtle)' }}
                  >
                    <BookOpen className="w-5 h-5" style={{ color: 'var(--brand-blue)' }} />
                  </div>
                  {enrollment.course.category && (
                    <BrandBadge variant="blue" className="text-xs">{enrollment.course.category}</BrandBadge>
                  )}
                </div>

                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{enrollment.course.title}</h3>
                <p className="text-xs text-gray-400 mb-4">강사: {enrollment.course.instructor?.name}</p>

                <div className="mt-auto">
                  <BrandProgress
                    value={enrollment.progressRate}
                    showPercent
                    label="학습 진도"
                    size="sm"
                    variant="logo"
                  />

                  {enrollment.expiresAt && (
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      수강 만료: {new Date(enrollment.expiresAt).toLocaleDateString('ko-KR')}
                    </div>
                  )}
                </div>
              </BrandCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
