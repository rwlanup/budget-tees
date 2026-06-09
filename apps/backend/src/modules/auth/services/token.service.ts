import { createHash, randomBytes, randomUUID } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { VerificationToken } from '../entities/verification-token.entity';
import { VerificationTokenType } from '../enums/verification-token-type.enum';

export interface IssuedRefresh {
  raw: string;
  expiresAt: Date;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken) private readonly refreshRepo: Repository<RefreshToken>,
    @InjectRepository(VerificationToken)
    private readonly verifyRepo: Repository<VerificationToken>,
  ) {}

  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private random(): string {
    return randomBytes(48).toString('hex');
  }

  signAccessToken(payload: { sub: string; roleId: string }): string {
    return this.jwt.sign(
      { sub: payload.sub, roleId: payload.roleId, type: 'access' },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessTtl') ?? '15m',
      } as Record<string, unknown>,
    );
  }

  accessTtlSeconds(): number {
    const ttl = this.config.get<string>('jwt.accessTtl') ?? '15m';
    const m = ttl.match(/^(\d+)([smhd])$/);
    if (!m) return 900;
    const n = Number(m[1]);
    return { s: n, m: n * 60, h: n * 3600, d: n * 86400 }[m[2] as 's' | 'm' | 'h' | 'd'];
  }

  async issueRefreshToken(
    userId: string,
    opts: { familyId?: string; userAgent?: string; ip?: string } = {},
  ): Promise<IssuedRefresh> {
    const raw = this.random();
    const days = this.config.get<number>('jwt.refreshTtlDays') ?? 30;
    const expiresAt = new Date(Date.now() + days * 86400_000);
    await this.refreshRepo.save(
      this.refreshRepo.create({
        userId,
        tokenHash: this.hash(raw),
        familyId: opts.familyId ?? randomUUID(),
        expiresAt,
        userAgent: opts.userAgent ?? null,
        ip: opts.ip ?? null,
      }),
    );
    return { raw, expiresAt };
  }

  /** Rotate a refresh token. Detects reuse of an already-rotated token → revoke whole family. */
  async rotateRefreshToken(
    raw: string,
    opts: { userAgent?: string; ip?: string } = {},
  ): Promise<{ userId: string; refresh: IssuedRefresh }> {
    const tokenHash = this.hash(raw);
    const row = await this.refreshRepo.findOne({ where: { tokenHash } });
    if (!row) throw new UnauthorizedException('Invalid refresh token');

    if (row.revokedAt) {
      // Reuse of a rotated/revoked token → breach. Revoke the entire family.
      await this.refreshRepo.update(
        { familyId: row.familyId, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    if (row.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const next = await this.issueRefreshToken(row.userId, {
      familyId: row.familyId,
      userAgent: opts.userAgent,
      ip: opts.ip,
    });
    const successor = await this.refreshRepo.findOne({
      where: { tokenHash: this.hash(next.raw) },
    });
    row.revokedAt = new Date();
    row.replacedById = successor?.id ?? null;
    await this.refreshRepo.save(row);
    return { userId: row.userId, refresh: next };
  }

  async revokeRefreshToken(raw: string): Promise<void> {
    await this.refreshRepo.update(
      { tokenHash: this.hash(raw), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshRepo.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  listSessions(userId: string): Promise<RefreshToken[]> {
    return this.refreshRepo.find({
      where: { userId, revokedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeSession(userId: string, id: string): Promise<void> {
    await this.refreshRepo.update({ id, userId }, { revokedAt: new Date() });
  }

  // ---- Verification / reset tokens (hashed, single-use, expiring) ----

  async issueVerificationToken(
    userId: string,
    type: VerificationTokenType,
    ttlMs: number,
  ): Promise<string> {
    const raw = this.random();
    await this.verifyRepo.save(
      this.verifyRepo.create({
        userId,
        tokenHash: this.hash(raw),
        type,
        expiresAt: new Date(Date.now() + ttlMs),
      }),
    );
    return raw;
  }

  async consumeVerificationToken(raw: string, type: VerificationTokenType): Promise<string> {
    const row = await this.verifyRepo.findOne({ where: { tokenHash: this.hash(raw), type } });
    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    row.usedAt = new Date();
    await this.verifyRepo.save(row);
    return row.userId;
  }

  async purgeExpired(): Promise<void> {
    const now = new Date();
    await this.refreshRepo.delete({ expiresAt: LessThan(now) });
    await this.verifyRepo.delete({ expiresAt: LessThan(now) });
  }
}
