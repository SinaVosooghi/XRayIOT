import { Inject, Injectable } from '@nestjs/common';
import { IRawStore } from './interfaces';
import { RawPayload, StorageResult, StorageStats } from '@iotp/shared-types';

@Injectable()
export class RawService implements IRawStore {
  constructor(@Inject('IRawStore') private readonly rawStore: IRawStore) {}

  async store(payload: RawPayload): Promise<string> {
    return this.rawStore.store(payload);
  }

  async getPresignedUrl(ref: string, ttlSec: number): Promise<string> {
    return this.rawStore.getPresignedUrl(ref, ttlSec);
  }

  async getMetadata(ref: string): Promise<StorageResult> {
    return this.rawStore.getMetadata(ref);
  }

  async delete(ref: string): Promise<boolean> {
    return this.rawStore.delete(ref);
  }

  async exists(ref: string): Promise<boolean> {
    return this.rawStore.exists(ref);
  }

  async getFileSize(ref: string): Promise<number> {
    return this.rawStore.getFileSize(ref);
  }

  async getStorageStats(): Promise<StorageStats> {
    return this.rawStore.getStorageStats();
  }
}
