import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface Cache<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}

export class FileCache<T> implements Cache<T> {
  constructor(private readonly directory: string) {
    mkdirSync(directory, { recursive: true });
  }

  private resolvePath(key: string): string {
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    return path.join(this.directory, `${hash}.json`);
  }

  async get(key: string): Promise<T | null> {
    const filePath = this.resolvePath(key);
    if (!existsSync(filePath)) {
      return null;
    }

    const raw = readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  }

  async set(key: string, value: T): Promise<void> {
    const filePath = this.resolvePath(key);
    writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolvePath(key);
    if (existsSync(filePath)) {
      const fs = await import('node:fs');
      fs.rmSync(filePath);
    }
  }
}
