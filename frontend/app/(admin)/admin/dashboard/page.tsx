'use client';

import { useEffect, useState } from 'react';
import {
  Users, BookOpen, CreditCard, ClipboardList,
  MessageSquare, TrendingUp, ArrowUpRight, Activity, Loader2,
} from 'lucide-react';
import { BrandCard } from '@/components/ui/brand-card';
import { BrandBadge } from '@/components/ui/brand-badge';
import { buildAuthHeader } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4400/api';

interface DashboardStats {
  newUsers: number;
  todayPaymentAmount: number;
  todayPaymentCount: number;
  enrollments: number;
  examApps: number;
  openInquiries: number;
}

const typeColors: Record<string, string> = {
  결제: 'orange',
  접수: 'blue',
  문의: 'red',
  수강: 'green',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch(`${API}/admin/stats`, { headers: buildAuthHeader(false) });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const statCards = [
    {
      label: '신규 회원 (오늘)',
      value: `${stats?.newUsers ?? 0}`,
      icon: Users,
      color: 'var(--brand-blue)',
      bg: 'var(--brand-blue-subtle)',
    },
    {
      label: '오늘 결제',
      value: `${(stats?.todayPaymentAmount ?? 0).toLocaleString()}원`,
      icon: CreditCard,
      color: 'var(--brand-orange)',
      bg: 'var(--brand-orange-subtle)',
    },
    {
      label: '수강 신청 (오늘)',
      value: `${stats?.enrollments ?? 0}`,
      icon: BookOpen,
      color: 'var(--brand-sky)',
      bg: 'var(--brand-sky-subtle)',
    },
    {
      label: '시험 접수 (오늘)',
      value: `${stats?.examApps ?? 0}`,
      icon: ClipboardList,
      color: 'var(--brand-green)',
      bg: '#E8F6EF',
    },
    {
      label: '미응답 문의',
      value: `${stats?.openInquiries ?? 0}`,
      icon: MessageSquare,
      color: '#EF4444',
      bg: '#FEF2F2',
    },
  ];

  const recentActivities = [
    { type: '결제', content: `오늘 결제 건수: ${stats?.todayPaymentCount ?? 0}건`, time: '실시간 집계' },
    { type: '접수', content: `오늘 시험 접수: ${stats?.examApps ?? 0}건`, time: '실시간 집계' },
    { type: '수강', content: `오늘 수강 신청: ${stats?.enrollments ?? 0}건`, time: '실시간 집계' },
    { type: '문의', content: `미응답 문의: ${stats?.openInquiries ?? 0}건`, time: '실시간 집계' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center h-64 items-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-blue)' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <BrandCard key={card.label} padding="md">
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: card.bg }}
                >
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-lg font-extrabold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </BrandCard>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <BrandCard padding="lg">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4" style={{ color: 'var(--brand-blue)' }} />
            <h2 className="font-bold text-gray-900">운영 현황</h2>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <BrandBadge variant={typeColors[activity.type] as any} className="shrink-0 mt-0.5">
                  {activity.type}
                </BrandBadge>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 leading-snug">{activity.content}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </BrandCard>

        <BrandCard padding="lg">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--brand-blue)' }} />
            <h2 className="font-bold text-gray-900">LMS/CMS 바로가기</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '교육과정 관리', href: '/admin/courses', color: 'var(--brand-blue)' },
              { label: '시험 접수 관리', href: '/admin/exam', color: 'var(--brand-orange)' },
              { label: '교재 관리', href: '/admin/textbooks', color: 'var(--brand-sky)' },
              { label: '공지 관리', href: '/admin/notices', color: 'var(--brand-green)' },
              { label: '소개 페이지 CMS', href: '/admin/intro', color: 'var(--brand-blue-light)' },
              { label: '회원 관리', href: '/admin/users', color: '#EF4444' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-opacity-70 transition-colors text-sm font-medium"
                style={{ borderColor: `${action.color}40`, color: action.color, backgroundColor: `${action.color}08` }}
              >
                {action.label}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </BrandCard>
      </div>
    </div>
  );
}
