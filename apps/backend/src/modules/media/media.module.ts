import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { MediaVariant } from './entities/media-variant.entity';
import { MediaService } from './services/media.service';
import { ImageProcessorService } from './services/image-processor.service';
import { MediaController } from './controllers/media.controller';
import { STORAGE_DRIVER, StorageDriver } from './storage/storage.interface';
import { LocalDriver } from './storage/local.driver';
import { S3Driver } from './storage/s3.driver';

@Module({
  imports: [TypeOrmModule.forFeature([Media, MediaVariant])],
  controllers: [MediaController],
  providers: [
    MediaService,
    ImageProcessorService,
    {
      provide: STORAGE_DRIVER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): StorageDriver => {
        const driver = config.get<string>('storage.driver');
        if (driver === 's3') {
          return new S3Driver({
            bucket: config.get<string>('storage.s3Bucket')!,
            region: config.get<string>('storage.s3Region')!,
            endpoint: config.get<string>('storage.s3Endpoint') || undefined,
            accessKey: config.get<string>('storage.s3AccessKey')!,
            secretKey: config.get<string>('storage.s3SecretKey')!,
            cdnBaseUrl: config.get<string>('storage.cdnBaseUrl') || undefined,
          });
        }
        return new LocalDriver(
          config.get<string>('storage.localDir')!,
          config.get<string>('storage.publicBaseUrl')!,
        );
      },
    },
  ],
  exports: [MediaService],
})
export class MediaModule {}
