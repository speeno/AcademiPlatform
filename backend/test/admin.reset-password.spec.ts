import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminService } from '../src/admin/admin.service';

describe('AdminService.resetUserPassword', () => {
  const targetUser = {
    id: 'user-2',
    email: 'instructor@academiq.kr',
    name: '테스트 강사',
    role: UserRole.INSTRUCTOR,
  };

  function makePrisma(target = targetUser) {
    return {
      user: {
        findUnique: jest.fn().mockResolvedValue(target),
        update: jest.fn().mockResolvedValue(target),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn(async (ops: Promise<unknown>[]) => {
        await Promise.all(ops);
      }),
    } as any;
  }

  it('운영자가 일반 회원 비밀번호를 초기화하면 임시 비밀번호를 반환한다', async () => {
    const prisma = makePrisma();
    const service = new AdminService(prisma, {} as any);

    const result = await service.resetUserPassword(
      'user-2',
      {},
      { id: 'admin-1', role: UserRole.OPERATOR },
    );

    expect(result.email).toBe('instructor@academiq.kr');
    expect(result.temporaryPassword).toMatch(/^Aq[a-z2-9]{8}$/);
    expect(prisma.user.update).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'USER_PASSWORD_RESET' }),
      }),
    );
  });

  it('본인 비밀번호 초기화는 거부한다', async () => {
    const prisma = makePrisma();
    const service = new AdminService(prisma, {} as any);

    await expect(
      service.resetUserPassword(
        'user-2',
        {},
        { id: 'user-2', role: UserRole.INSTRUCTOR },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('최고관리자 비밀번호는 최고관리자만 초기화할 수 있다', async () => {
    const prisma = makePrisma({
      ...targetUser,
      id: 'super-1',
      role: UserRole.SUPER_ADMIN,
    });
    const service = new AdminService(prisma, {} as any);

    await expect(
      service.resetUserPassword(
        'super-1',
        {},
        { id: 'admin-1', role: UserRole.OPERATOR },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('존재하지 않는 회원은 404', async () => {
    const prisma = makePrisma(null);
    prisma.user.findUnique.mockResolvedValue(null);
    const service = new AdminService(prisma, {} as any);

    await expect(
      service.resetUserPassword(
        'missing',
        {},
        { id: 'admin-1', role: UserRole.SUPER_ADMIN },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
