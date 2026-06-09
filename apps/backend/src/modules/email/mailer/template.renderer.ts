import { Injectable } from '@nestjs/common';
import { EmailTemplate } from '../enums/email.enums';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Minimal template registry. Subjects + simple HTML bodies per template.
 * Swap for MJML/Handlebars file templates later without changing callers.
 */
@Injectable()
export class TemplateRenderer {
  render(template: string, data: Record<string, unknown>): RenderedEmail {
    const d = data ?? {};
    switch (template as EmailTemplate) {
      case EmailTemplate.EMAIL_VERIFICATION:
        return this.wrap('Verify your email', `Use this token to verify your email: <b>${d.token}</b>`);
      case EmailTemplate.PASSWORD_RESET:
        return this.wrap('Reset your password', `Use this token to reset your password: <b>${d.token}</b>`);
      case EmailTemplate.PASSWORD_CHANGED:
        return this.wrap('Password changed', 'Your password was changed. If this was not you, contact support.');
      case EmailTemplate.ORDER_CONFIRMATION:
        return this.wrap(`Order ${d.orderNumber} confirmed`, `Thanks! Your order <b>${d.orderNumber}</b> is confirmed.`);
      case EmailTemplate.ORDER_STATUS_UPDATE:
        return this.wrap(`Order ${d.orderNumber} update`, `Your order <b>${d.orderNumber}</b> is now <b>${d.status}</b>.`);
      case EmailTemplate.PAYMENT_RECEIPT:
        return this.wrap(`Payment received for ${d.orderNumber}`, `We received your payment for <b>${d.orderNumber}</b>.`);
      case EmailTemplate.REFUND_PROCESSED:
        return this.wrap(`Refund processed`, `A refund of <b>${d.amount}</b> was processed for order <b>${d.orderNumber}</b>.`);
      case EmailTemplate.RETURN_UPDATE:
        return this.wrap(`Return ${d.returnNumber} update`, `Your return <b>${d.returnNumber}</b> is now <b>${d.status}</b>.`);
      default:
        return this.wrap('Notification', String(d.message ?? ''));
    }
  }

  private wrap(subject: string, bodyHtml: string): RenderedEmail {
    const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto">
      <h2>${subject}</h2><p>${bodyHtml}</p>
      <hr/><small>Budget Tees</small></div>`;
    const text = bodyHtml.replace(/<[^>]+>/g, '');
    return { subject, html, text };
  }
}
