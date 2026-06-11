import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { EmailLog } from './entities/email-log.entity';
import { EmailStatus } from './enums/email.enums';
import { EMAIL_QUEUE } from './email.service';
import { MailerService } from './mailer/mailer.service';
import { TemplateRenderer } from './mailer/template.renderer';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    @InjectRepository(EmailLog) private readonly repo: Repository<EmailLog>,
    private readonly mailer: MailerService,
    private readonly renderer: TemplateRenderer,
  ) {
    super();
  }

  async process(job: Job<{ logId: string }>): Promise<void> {
    const log = await this.repo.findOne({ where: { id: job.data.logId } });
    if (!log) return;

    log.status = EmailStatus.SENDING;
    log.attempts += 1;
    await this.repo.save(log);

    try {
      const rendered = this.renderer.render(log.template, log.data ?? {});
      const messageId = await this.mailer.send(log.toAddress, rendered);
      log.status = EmailStatus.SENT;
      log.providerMessageId = messageId;
      log.sentAt = new Date();
      log.lastError = null;
      await this.repo.save(log);
    } catch (err) {
      log.lastError = (err as Error).message?.slice(0, 500) ?? 'send failed';
      // After max attempts BullMQ stops retrying → mark DEAD.
      log.status =
        job.attemptsMade + 1 >= (job.opts.attempts ?? 1) ? EmailStatus.DEAD : EmailStatus.FAILED;
      await this.repo.save(log);
      throw err; // let BullMQ handle retry/backoff
    }
  }
}
