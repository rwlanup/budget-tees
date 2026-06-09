import { Global, Injectable, Module } from '@nestjs/common';
import * as argon2 from 'argon2';

/** argon2id password hashing — shared by User (create/reset) and Auth (verify). */
@Injectable()
export class PasswordService {
  hash(plain: string): Promise<string> {
    return argon2.hash(plain, { type: argon2.argon2id });
  }

  verify(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain).catch(() => false);
  }
}

@Global()
@Module({
  providers: [PasswordService],
  exports: [PasswordService],
})
export class SecurityModule {}
