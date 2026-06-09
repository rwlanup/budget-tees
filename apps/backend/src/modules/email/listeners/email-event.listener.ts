import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService, EnqueueEmail } from '../email.service';

/** Domain modules emit `email.send`; this enqueues without coupling them to EmailModule. */
@Injectable()
export class EmailEventListener {
  constructor(private readonly email: EmailService) {}

  @OnEvent('email.send')
  async handle(payload: EnqueueEmail): Promise<void> {
    await this.email.enqueue(payload);
  }
}
