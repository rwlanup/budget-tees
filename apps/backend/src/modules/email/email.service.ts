import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { EmailLog } from './entities/email-log.entity';
import { EmailStatus } from './enums/email.enums';
import { TemplateRenderer } from './mailer/template.renderer';

export interface EnqueueEmail {
  template: string;
  to: string;
  data?: Record<string, unknown>;
  refType?: string;
  refId?: string;
  userId?: string;
}

export const EMAIL_QUEUE = 'email';

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(EmailLog) private readonly repo: Repository<EmailLog>,
    @InjectQueue(EMAIL_QUEUE) private readonly queue: Queue,
    private readonly renderer: TemplateRenderer,
  ) {}

  /** Create a QUEUED log row and enqueue a send job (retried with backoff). */
  async enqueue(input: EnqueueEmail): Promise<EmailLog> {
    const subject = this.renderer.render(input.template, input.data ?? {}).subject;
    const log = await this.repo.save(
      this.repo.create({
        template: input.template,
        toAddress: input.to,
        subject,
        status: EmailStatus.QUEUED,
        refType: input.refType ?? null,
        refId: input.refId ?? null,
        userId: input.userId ?? null,
        data: input.data ?? null,
      }),
    );
    await this.queue.add(
      'send',
      { logId: log.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true, removeOnFail: 100 },
    );
    return log;
  }

  list(status?: EmailStatus) {
    return this.repo.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async resend(id: string): Promise<EmailLog> {
    const log = await this.repo.findOneOrFail({ where: { id } });
    await this.queue.add('send', { logId: log.id }, { attempts: 3 });
    return log;
  }
}
