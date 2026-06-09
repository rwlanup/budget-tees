import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { RenderedEmail } from './template.renderer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('smtp.host'),
      port: this.config.get<number>('smtp.port'),
      secure: false,
      auth: this.config.get<string>('smtp.user')
        ? {
            user: this.config.get<string>('smtp.user'),
            pass: this.config.get<string>('smtp.password'),
          }
        : undefined,
    });
  }

  async send(to: string, email: RenderedEmail): Promise<string> {
    const from = `${this.config.get<string>('smtp.fromName')} <${this.config.get<string>('smtp.fromAddress')}>`;
    const info = await this.transporter.sendMail({
      from,
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    return info.messageId;
  }
}
