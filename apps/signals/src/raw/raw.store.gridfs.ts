import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { IRawStore } from './interfaces';
import { RawPayload, StorageResult, StorageStats } from '../types';
import * as crypto from 'crypto';
import * as zlib from 'zlib';

interface GridFSFile {
  _id: ObjectId;
  length: number;
  uploadDate: Date;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class RawStoreGridFS implements IRawStore {
  private bucket: GridFSBucket;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService
  ) {
    if (!this.connection.db) {
      throw new Error('Database connection not available');
    }
    this.bucket = new GridFSBucket(this.connection.db, {
      bucketName: 'rawPayloads',
    });
  }

  async store(payload: RawPayload): Promise<string> {
    try {
      // Compress the payload
      const jsonString = JSON.stringify(payload);
      const compressed = zlib.gzipSync(Buffer.from(jsonString, 'utf8'));

      // Generate hash for deduplication
      const hash = crypto.createHash('sha256').update(compressed).digest('hex');

      // Check if file already exists
      const existingFiles = await this.bucket.find({ 'metadata.hash': hash }).toArray();
      if (existingFiles.length > 0) {
        // Return existing file reference
        return existingFiles[0]._id.toString();
      }

      // Create upload stream
      const uploadStream = this.bucket.openUploadStream(`${hash}.json.gz`, {
        metadata: {
          hash,
          contentType: 'application/gzip',
          originalSize: jsonString.length,
          compressedSize: compressed.length,
          timestamp: new Date(),
        },
        contentType: 'application/gzip',
      });

      // Upload the compressed data
      uploadStream.end(compressed);

      // Wait for upload to complete and return the ObjectId
      return new Promise<string>((resolve, reject) => {
        uploadStream.on('finish', () => {
          resolve(uploadStream.id.toString());
        });
        uploadStream.on('error', reject);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to store payload in GridFS: ${errorMessage}`);
    }
  }

  getPresignedUrl(ref: string, _ttlSec: number): Promise<string> {
    // For GridFS, we'll create a temporary access endpoint
    // In production, you might want to implement a proper temporary URL system
    const baseUrl = this.configService.get<string>('API_BASE_URL');
    return Promise.resolve(`${baseUrl}/api/signals/raw/${ref}`);
  }

  async getMetadata(ref: string): Promise<StorageResult> {
    try {
      const objectId = new ObjectId(ref);
      const files = await this.bucket.find({ _id: objectId }).toArray();

      if (files.length === 0) {
        throw new Error('File not found');
      }

      const file = files[0] as GridFSFile;
      return {
        id: file._id.toString(),
        size: file.length,
        hash: (file.metadata?.hash as string) || '',
        url: undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get file metadata: ${errorMessage}`);
    }
  }

  async delete(ref: string): Promise<boolean> {
    try {
      const objectId = new ObjectId(ref);
      await this.bucket.delete(objectId);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete file: ${errorMessage}`);
    }
  }

  async exists(ref: string): Promise<boolean> {
    try {
      const objectId = new ObjectId(ref);
      const files = await this.bucket.find({ _id: objectId }).toArray();
      return files.length > 0;
    } catch {
      return false;
    }
  }

  // Get file size for storage metrics
  async getFileSize(ref: string): Promise<number> {
    try {
      const objectId = new ObjectId(ref);
      const files = await this.bucket.find({ _id: objectId }).toArray();

      if (files.length === 0) {
        throw new Error('File not found');
      }

      return files[0].length;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get file size: ${errorMessage}`);
    }
  }

  // Get storage statistics
  async getStorageStats(): Promise<StorageStats> {
    try {
      if (!this.connection.db) {
        throw new Error('Database connection not available');
      }

      const stats = (await this.connection.db.admin().command({
        collStats: 'rawPayloads.files',
      })) as {
        count: number;
        size: number;
        storageSize: number;
        totalIndexSize: number;
      };

      return {
        totalFiles: stats.count || 0,
        totalSize: stats.size || 0,
        avgFileSize: stats.count && stats.size ? stats.size / stats.count : 0,
        storageSize: stats.storageSize || 0,
        indexSize: stats.totalIndexSize || 0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get storage stats: ${errorMessage}`);
    }
  }
}
