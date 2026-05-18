import { CheckCircle2 } from 'lucide-react';
import { Section } from '@/components/layout/Section';
import { PageShell } from '@/components/layout/PageShell';
import { BUSY_MODERN_MARKETING_COPY } from '@/lib/marketing-copy';
import { cn } from '@/lib/utils';

interface MarketingHighlightProps {
  variant?: 'home' | 'inline';
}

export function MarketingHighlight({ variant = 'home' }: MarketingHighlightProps) {
  const isInline = variant === 'inline';

  return (
    <Section
      spacing={isInline ? 'sm' : 'lg'}
      className={cn(
        'bg-white border-border',
        isInline ? 'border-b' : 'border-y',
      )}
    >
      <PageShell size={isInline ? 'content' : 'wide'} flush>
        <div
          className={cn(
            'grid gap-8',
            isInline ? 'md:grid-cols-[0.9fr_1.1fr]' : 'lg:grid-cols-[0.95fr_1.05fr]',
          )}
        >
          <div>
            <p className="text-sm font-semibold text-brand-orange mb-2">
              {BUSY_MODERN_MARKETING_COPY.eyebrow}
            </p>
            <h2 className="text-heading text-brand-blue">
              {BUSY_MODERN_MARKETING_COPY.title}
            </h2>
            <p className="text-body text-muted-foreground mt-3">
              {BUSY_MODERN_MARKETING_COPY.description}
            </p>
          </div>

          <div className="space-y-3">
            {BUSY_MODERN_MARKETING_COPY.points.map((point) => (
              <div
                key={point}
                className="flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
                <p className="text-sm leading-relaxed text-foreground">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </PageShell>
    </Section>
  );
}
