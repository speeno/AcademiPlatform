export interface ReferrerMember {
  code: string;
  label: string;
  depositBank?: string;
  depositAccount?: string;
  depositHolder?: string;
}

export interface ReferrerGroup {
  id: string;
  groupName: string;
  members: ReferrerMember[];
  isActive: boolean;
}

export interface ReferrerOption {
  code: string;
  label: string;
  groupName: string;
}

/** 공개 설정 API 응답을 접수 화면용 권유자 목록으로 정규화 */
export function parseReferrerGroups(raw: unknown): ReferrerGroup[] {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];

  return value
    .filter((group): group is Record<string, unknown> => !!group && typeof group === 'object')
    .filter((group) => group.isActive !== false)
    .map((group, groupIndex) => {
      const id = String(group.id ?? `group-${groupIndex}`);
      const groupName = String(group.groupName ?? '권유자').trim() || '권유자';
      const rawMembers = Array.isArray(group.members) ? group.members : [];
      const seenCodes = new Set<string>();

      const members = rawMembers
        .filter((member): member is Record<string, unknown> => !!member && typeof member === 'object')
        .map((member, memberIndex) => {
          const code = String(member.code ?? '').trim() || `${id}-member-${memberIndex + 1}`;
          const label =
            String(member.label ?? member.name ?? member.memberName ?? code).trim() || code;
          return {
            code,
            label,
            depositBank: typeof member.depositBank === 'string' ? member.depositBank : undefined,
            depositAccount:
              typeof member.depositAccount === 'string' ? member.depositAccount : undefined,
            depositHolder:
              typeof member.depositHolder === 'string' ? member.depositHolder : undefined,
          } satisfies ReferrerMember;
        })
        .filter((member) => {
          if (seenCodes.has(member.code)) return false;
          seenCodes.add(member.code);
          return true;
        });

      return {
        id,
        groupName,
        members,
        isActive: true,
      };
    })
    .filter((group) => group.members.length > 0);
}

export function flattenReferrerOptions(groups: ReferrerGroup[]): ReferrerOption[] {
  return groups.flatMap((group) =>
    group.members.map((member) => ({
      code: member.code,
      label: `${group.groupName} · ${member.label}`,
      groupName: group.groupName,
    })),
  );
}

export interface DepositAccountInfo {
  bank: string;
  account: string;
  holder: string;
  sourceLabel?: string;
  isDefault?: boolean;
}

export const DEFAULT_EXAM_DEPOSIT_ACCOUNT: DepositAccountInfo = {
  bank: '농협은행',
  account: '302-0608-9280-11',
  holder: '이현길',
  isDefault: true,
};

function normalize(value?: string | null) {
  return value?.trim() ?? '';
}

export function findReferrerMemberByCode(
  groups: ReferrerGroup[],
  code?: string | null,
): ReferrerMember | null {
  if (!code) return null;
  for (const group of groups) {
    const member = group.members?.find((m) => m.code === code);
    if (member) return member;
  }
  return null;
}

/** 접수 시점 스냅샷 → referrerCode → 기본 계좌 순으로 해석 */
export function resolveApplicationDepositAccount(
  referrerCode: string | null | undefined,
  formJson?: Record<string, unknown> | null,
  groups: ReferrerGroup[] = [],
): DepositAccountInfo {
  const snapshot = formJson?.depositAccount as Partial<DepositAccountInfo> | undefined;
  const snapshotBank = normalize(snapshot?.bank);
  const snapshotAccount = normalize(snapshot?.account);

  if (snapshotBank && snapshotAccount) {
    return {
      bank: snapshotBank,
      account: snapshotAccount,
      holder: normalize(snapshot?.holder) || DEFAULT_EXAM_DEPOSIT_ACCOUNT.holder,
      sourceLabel: snapshot?.sourceLabel ? String(snapshot.sourceLabel) : undefined,
      isDefault: false,
    };
  }

  const member = findReferrerMemberByCode(groups, referrerCode);
  if (member) {
    return getMemberDepositAccount(member);
  }

  return DEFAULT_EXAM_DEPOSIT_ACCOUNT;
}

export function getMemberDepositAccount(member?: ReferrerMember | null): DepositAccountInfo {
  const bank = normalize(member?.depositBank);
  const account = normalize(member?.depositAccount);

  if (!member || !bank || !account) {
    return DEFAULT_EXAM_DEPOSIT_ACCOUNT;
  }

  return {
    bank,
    account,
    holder: normalize(member.depositHolder) || member.label || DEFAULT_EXAM_DEPOSIT_ACCOUNT.holder,
    sourceLabel: member.label,
    isDefault: false,
  };
}
