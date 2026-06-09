import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { StorageDriver } from './storage.interface';

/** Dev driver: writes under a local uploads dir, served statically by the app. */
export class LocalDriver implements StorageDriver {
  readonly name = 'local';

  constructor(
    private readonly baseDir: string,
    private readonly publicBaseUrl: string,
  ) {}

  async put(key: string, body: Buffer, _contentType: string): Promise<string> {
    const path = join(this.baseDir, key);
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(path, body);
    return this.url(key);
  }

  async delete(key: string): Promise<void> {
    await fs.rm(join(this.baseDir, key), { force: true });
  }

  url(key: string): string {
    return `${this.publicBaseUrl}/uploads/${key}`;
  }
}
