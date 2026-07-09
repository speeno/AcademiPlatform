import { BrandBadge } from '@/components/ui/brand-badge';
import {
  PROGRAM_STATUS_LABELS,
  type TrainingProgramStatus,
} from '@/lib/training-types';

const VARIANT_MAP: Record<TrainingProgramStatus, 'gray' | 'orange' | 'blue' | 'green' | 'red'> = {
  DRAFT: 'gray',
  RECRUITING: 'orange',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

export function ProgramStatusBadge({ status }: { status: TrainingProgramStatus }) {
  return (
    <BrandBadge variant={VARIANT_MAP[status] ?? 'gray'} dot>
      {PROGRAM_STATUS_LABELS[status] ?? status}
    </BrandBadge>
  );
}
