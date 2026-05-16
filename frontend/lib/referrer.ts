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
