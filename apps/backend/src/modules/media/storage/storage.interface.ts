export const STORAGE_DRIVER = 'STORAGE_DRIVER';

export interface StorageDriver {
  readonly name: string;
  /** Persist bytes at key; returns the publicly resolvable URL. */
  put(key: string, body: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  url(key: string): string;
}
