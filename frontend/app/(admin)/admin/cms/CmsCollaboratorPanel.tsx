import { Plus } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { toast } from 'sonner';
import type { CmsTree, CollaboratorRole, InstructorOption } from './_types';

interface Props {
  tree: CmsTree | null;
  instructors: InstructorOption[];
  instructorsLoading: boolean;
  ownerUserId: string;
  ownerSelectRef: React.RefObject<HTMLSelectElement | null>;
  collaboratorUserId: string;
  collaboratorRole: CollaboratorRole;
  onOwnerUserIdChange: (v: string) => void;
  onCollaboratorUserIdChange: (v: string) => void;
  onCollaboratorRoleChange: (v: CollaboratorRole) => void;
  onSetCourseOwner: (ownerId?: string) => Promise<void>;
  onAddCollaborator: () => Promise<void>;
  onRemoveCollaborator: (userId: string) => Promise<void>;
}

export function CmsCollaboratorPanel({
  tree, instructors, instructorsLoading,
  ownerUserId, ownerSelectRef,
  collaboratorUserId, collaboratorRole,
  onOwnerUserIdChange, onCollaboratorUserIdChange, onCollaboratorRoleChange,
  onSetCourseOwner, onAddCollaborator, onRemoveCollaborator,
}: Props) {
  const availableCollaborators = instructors.filter(
    (i) => !tree?.cmsCollaborators.some((c) => c.user.id === i.id),
  );

  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <h2 className="font-semibold text-foreground">공동편집자 관리(운영자)</h2>
      <div className="flex gap-2">
        <select
          ref={ownerSelectRef}
          className="border rounded-lg px-3 py-2 text-sm bg-white min-w-72"
          value={ownerUserId}
          onChange={(e) => onOwnerUserIdChange(e.target.value)}
          disabled={instructorsLoading}
        >
          {instructors.length === 0 ? (
            <option value="">{instructorsLoading ? '강사 목록 로딩 중...' : '선택 가능한 강사가 없습니다.'}</option>
          ) : (
            instructors.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.email})</option>)
          )}
        </select>
        <BrandButton size="sm" onClick={() => onSetCourseOwner(ownerSelectRef.current?.value).catch((err: unknown) => toast.error(err instanceof Error ? err.message : '담당 강사 지정 실패'))}>
          담당 강사 지정
        </BrandButton>
      </div>
      <div className="flex gap-2">
        <select
          className="border rounded-lg px-3 py-2 text-sm bg-white min-w-72"
          value={collaboratorUserId}
          onChange={(e) => onCollaboratorUserIdChange(e.target.value)}
          disabled={instructorsLoading}
        >
          {availableCollaborators.length === 0 ? (
            <option value="">{instructorsLoading ? '강사 목록 로딩 중...' : '선택 가능한 강사가 없습니다.'}</option>
          ) : (
            availableCollaborators.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.email})</option>)
          )}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={collaboratorRole} onChange={(e) => onCollaboratorRoleChange(e.target.value as CollaboratorRole)}>
          <option value="EDITOR">EDITOR</option>
          <option value="ASSISTANT">ASSISTANT</option>
        </select>
        <BrandButton size="sm" onClick={() => onAddCollaborator().catch((err: unknown) => toast.error(err instanceof Error ? err.message : '공동편집자 추가 실패'))}>
          <Plus className="w-4 h-4 mr-1" />추가
        </BrandButton>
      </div>
      <div className="space-y-2">
        {(tree?.cmsCollaborators ?? []).map((collab) => (
          <div key={collab.id} className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm">
            <span>{collab.user.name} ({collab.user.email}) - {collab.role}</span>
            <BrandButton size="sm" variant="outline" onClick={() => onRemoveCollaborator(collab.user.id).catch((err: unknown) => toast.error(err instanceof Error ? err.message : '삭제 실패'))}>
              삭제
            </BrandButton>
          </div>
        ))}
      </div>
    </div>
  );
}
