import { ForbiddenException } from '@nestjs/common';
import { TrainingPermissionGuard } from '../src/training/guards/training-permission.guard';

/**
 * 교육 운영 권한 가드 매트릭스.
 * - OPERATOR/SUPER_ADMIN: 그랜트 없이 통과(관리자 바이패스)
 * - USER/INSTRUCTOR: TrainingPermission 행이 있어야 통과
 * - 메타데이터 없는 라우트: 검사하지 않고 통과
 */
describe('TrainingPermissionGuard', () => {
  const buildContext = (user: any) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as any;

  const buildGuard = (opts: { required?: boolean; grant?: any } = {}) => {
    const reflector = {
      getAllAndOverride: jest.fn(() => opts.required ?? true),
    } as any;
    const prisma = {
      trainingPermission: {
        findUnique: jest.fn(async () => opts.grant ?? null),
      },
    } as any;
    return { guard: new TrainingPermissionGuard(reflector, prisma), prisma };
  };

  it('메타데이터가 없으면 검사 없이 통과한다', async () => {
    const { guard, prisma } = buildGuard({ required: false });
    await expect(
      guard.canActivate(buildContext({ id: 'u1', role: 'USER' })),
    ).resolves.toBe(true);
    expect(prisma.trainingPermission.findUnique).not.toHaveBeenCalled();
  });

  it.each(['OPERATOR', 'SUPER_ADMIN'])(
    '%s 는 그랜트 없이 통과한다',
    async (role) => {
      const { guard, prisma } = buildGuard();
      await expect(
        guard.canActivate(buildContext({ id: 'admin-1', role })),
      ).resolves.toBe(true);
      expect(prisma.trainingPermission.findUnique).not.toHaveBeenCalled();
    },
  );

  it.each(['USER', 'INSTRUCTOR'])(
    '그랜트 없는 %s 는 403 이다',
    async (role) => {
      const { guard } = buildGuard({ grant: null });
      await expect(
        guard.canActivate(buildContext({ id: 'u1', role })),
      ).rejects.toThrow(ForbiddenException);
    },
  );

  it('그랜트가 있는 USER 는 통과한다', async () => {
    const { guard, prisma } = buildGuard({ grant: { id: 'grant-1' } });
    await expect(
      guard.canActivate(buildContext({ id: 'u1', role: 'USER' })),
    ).resolves.toBe(true);
    expect(prisma.trainingPermission.findUnique).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      select: { id: true },
    });
  });

  it('user 가 없으면 403 이다', async () => {
    const { guard } = buildGuard();
    await expect(guard.canActivate(buildContext(undefined))).rejects.toThrow(
      ForbiddenException,
    );
  });
});
