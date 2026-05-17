import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../src/auth/auth.service';

describe('AuthService refresh flow', () => {
  const jwt = new JwtService();
  const config = new ConfigService({
    JWT_SECRET: 'test-access-secret-min-32-chars-long',
    JWT_REFRESH_SECRET: 'test-refresh-secret-min-32-chars-long',
  });

  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
        status: 'ACTIVE',
      }),
    },
  };

  const authService = new AuthService(prisma as any, jwt, config);

  it('refreshToken 호출 시 새 access/refresh 토큰을 발급해야 한다', async () => {
    const tokens = await authService.refreshToken('user-1');
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    const accessPayload = jwt.verify(tokens.accessToken, {
      secret: config.get('JWT_SECRET'),
    });
    expect(accessPayload.sub).toBe('user-1');
  });
});
