import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailLog } from './entities/email-log.entity';
import { EmailService, EMAIL_QUEUE } from './email.service';
import { EmailProcessor } from './email.processor';
import { MailerService } from './mailer/mailer.service';
import { TemplateRenderer } from './mailer/template.renderer';
import { EmailEventListener } from './listeners/email-event.listener';
import { AdminEmailController } from './email.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailLog]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
        },
      }),
    }),
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
  ],
  controllers: [AdminEmailController],
  providers: [EmailService, EmailProcessor, MailerService, TemplateRenderer, EmailEventListener],
  exports: [EmailService],
})
export class EmailModule {}
