'use client';

import { useEffect, useState, useCallback } from 'react';
import { Eye, Users, LogIn, TrendingUp } from 'lucide-react';
import { buildAuthHeader } from '@/lib/auth';
import { API_BASE } from '@/lib/api-base';
import { PageLoader } from '@/components/ui/page-loader';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from 'sonner';

type Period = 'today' | 'week' | 'month';

interface TopPage { path: string; pv: number; uv: number }
interface HourlyItem { hour: number; count: number }
interface NameCount { name?: string; type?: string; domain?: string; count: number }

interface AnalyticsSummary {
  totalPV: number;
  uniqueVisitors: number;
  loggedInPV: number;
  anonymousPV: number;
  avgDailyPV: number;
  topPages: TopPage[];
  hourly: HourlyItem[];
  devices: NameCount[];
  browsers: NameCount[];
  referrers: NameCount[];
}

const PERIOD_LABELS: Record<Period, string> = {
  today: '오늘',
  week: '최근 7일',
  month: '최근 30일',
};

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('today');
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/analytics/summary?period=${p}`, {
        headers: buildAuthHeader(false),
      });
      if (res.ok) setData(await res.json());
      else toast.error('통계 데이터를 불러오지 못했습니다.');
    } catch {
      toast.error('통계 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  const maxHourly = data ? Math.max(...data.hourly.map((h) => h.count), 1) : 1;
  const loginRate = data && data.totalPV > 0
    ? Math.round((data.loggedInPV / data.totalPV) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="접속 통계" description="사이트 방문 및 페이지뷰 통계를 확인합니다." />

      <div className="flex gap-1 border-b">
        {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              period === key
                ? 'border-[var(--brand-blue)] text-[var(--brand-blue)]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <PageLoader height="h-48" />
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard icon={Eye} label="총 페이지뷰 (PV)" value={data.totalPV.toLocaleString()} />
            <SummaryCard icon={Users} label="순 방문자 (UV)" value={data.uniqueVisitors.toLocaleString()} />
            <SummaryCard icon={LogIn} label="로그인 비율" value={`${loginRate}%`} />
            <SummaryCard icon={TrendingUp} label="일 평균 PV" value={data.avgDailyPV.toLocaleString()} />
          </div>

          {/* 인기 페이지 */}
          <Section title="인기 페이지 TOP 10">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground w-10">#</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">경로</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">PV</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">UV</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.topPages.map((p, i) => (
                  <tr key={p.path} className="hover:bg-muted/30">
                    <td className="px-4 py-2 text-muted-foreground text-xs">{i + 1}</td>
                    <td className="px-4 py-2 font-mono text-xs text-foreground break-all">{p.path}</td>
                    <td className="px-4 py-2 text-right font-semibold text-brand-blue" >{p.pv.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{p.uv.toLocaleString()}</td>
                  </tr>
                ))}
                {data.topPages.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">데이터가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </Section>

          {/* 시간대별 분포 */}
          <Section title="시간대별 페이지뷰">
            <div className="px-4 py-3">
              <div className="flex items-end gap-1 h-32">
                {data.hourly.map((h) => (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${Math.max((h.count / maxHourly) * 100, 2)}%`,
                        background: h.count > 0 ? 'var(--brand-blue)' : '#e5e7eb',
                        opacity: h.count > 0 ? 0.8 : 0.3,
                      }}
                      title={`${h.hour}시: ${h.count}건`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-1 mt-1">
                {data.hourly.map((h) => (
                  <div key={h.hour} className="flex-1 text-center text-[10px] text-muted-foreground">
                    {h.hour % 3 === 0 ? `${h.hour}` : ''}
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 기기별 */}
            <Section title="기기별 접속">
              <DistributionTable items={data.devices.map((d) => ({ label: d.type ?? 'unknown', count: d.count }))} total={data.totalPV} />
            </Section>

            {/* 브라우저별 */}
            <Section title="브라우저별 접속">
              <DistributionTable items={data.browsers.map((b) => ({ label: b.name ?? 'unknown', count: b.count }))} total={data.totalPV} />
            </Section>
          </div>

          {/* 로그인/비로그인 */}
          <Section title="로그인 vs 비로그인">
            <DistributionTable
              items={[
                { label: '로그인 사용자', count: data.loggedInPV },
                { label: '비로그인 방문자', count: data.anonymousPV },
              ]}
              total={data.totalPV}
            />
          </Section>

          {/* 외부 유입 경로 */}
          <Section title="외부 유입 경로 TOP 10">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">유입 경로</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">PV</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.referrers.map((r) => (
                  <tr key={r.domain} className="hover:bg-muted/30">
                    <td className="px-4 py-2 text-xs text-foreground break-all">{r.domain}</td>
                    <td className="px-4 py-2 text-right font-semibold text-brand-blue" >{r.count.toLocaleString()}</td>
                  </tr>
                ))}
                {data.referrers.length === 0 && (
                  <tr><td colSpan={2} className="text-center py-8 text-muted-foreground">외부 유입 데이터가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </Section>
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-extrabold text-brand-blue" >{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function DistributionTable({ items, total }: { items: { label: string; count: number }[]; total: number }) {
  return (
    <table className="w-full text-sm">
      <tbody className="divide-y">
        {items.map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <tr key={item.label} className="hover:bg-muted/30">
              <td className="px-4 py-2.5 text-foreground">{item.label}</td>
              <td className="px-4 py-2.5 w-32">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all bg-brand-blue"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </td>
              <td className="px-4 py-2.5 text-right text-xs text-muted-foreground w-16">{pct}%</td>
              <td className="px-4 py-2.5 text-right font-semibold w-16 text-brand-blue" >{item.count.toLocaleString()}</td>
            </tr>
          );
        })}
        {items.length === 0 && (
          <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">데이터가 없습니다.</td></tr>
        )}
      </tbody>
    </table>
  );
}
