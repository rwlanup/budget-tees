import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailTemplate } from '../enums/email.enums';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

interface Block {
  /** Hidden inbox-preview line. */
  preheader: string;
  heading: string;
  /** Body paragraphs (HTML-safe plain strings). */
  intro: string[];
  cta?: { label: string; href: string };
  /** label → value detail rows. */
  details?: [string, string][];
  /** Closing note (muted). */
  note?: string;
  /** Accent for the heading rule: neutral | success | danger. */
  accent?: 'neutral' | 'success' | 'danger';
}

/**
 * Brand palette mirrors the frontend design system (apps/frontend/CLAUDE.md §2):
 * cool-neutral zinc canvas, near-black `primary` CTA, `brand` accent.
 * Tokens are hex (email-safe) approximations of the oklch theme.
 */
const C = {
  bg: '#f4f4f4', // cool neutral canvas (zinc-100)
  card: '#ffffff',
  elevated: '#fafafa',
  border: '#e4e4e7', // zinc-200 hairline
  ink: '#18181b', // foreground (zinc-900)
  muted: '#71717a', // muted-foreground (zinc-500)
  primary: '#18181b', // confident near-black CTA
  brand: '#204b7f', // brand accent (the spark)
  brandStrong: '#02376f', // brand-strong (gradient end)
  brandSoft: '#e8eff9', // brand-muted tint
  shadow: '0 8px 28px -6px rgba(24, 59, 109, 0.35)',
  success: '#16a34a', // emerald — savings / in-stock
  danger: '#dc2626', // red — errors
  // Bricolage Grotesque (display) + Inter (body) with web-safe fallbacks.
  fontHeading:
    "'Bricolage Grotesque','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  fontBody:
    "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
};

/**
 * Production-grade transactional email templates: table-based, inline-styled, mobile-safe
 * (≤600px), bulletproof CTA buttons, plain-text alternative. Same `render` interface as before.
 */
@Injectable()
export class TemplateRenderer {
  constructor(private readonly config: ConfigService) {}

  private get storeName(): string {
    return this.config.get<string>('app.storeName') ?? 'Budget Tees';
  }
  private get webUrl(): string {
    return (this.config.get<string>('payment.websiteUrl') ?? 'http://localhost:3000').replace(
      /\/$/,
      '',
    );
  }
  private get currency(): string {
    return this.config.get<string>('app.defaultCurrency') ?? 'NPR';
  }
  private get contact(): string {
    return this.config.get<string>('smtp.fromAddress') ?? '';
  }

  render(template: string, data: Record<string, unknown>): RenderedEmail {
    const block = this.block(template as EmailTemplate, data ?? {});
    return {
      subject: this.subject(template as EmailTemplate, data ?? {}),
      html: this.html(block),
      text: this.text(block),
    };
  }

  // ---- per-template content ----

  private subject(template: EmailTemplate, d: Record<string, unknown>): string {
    const store = this.storeName;
    switch (template) {
      case EmailTemplate.EMAIL_VERIFICATION:
        return `Verify your email · ${store}`;
      case EmailTemplate.PASSWORD_RESET:
        return `Reset your password · ${store}`;
      case EmailTemplate.PASSWORD_CHANGED:
        return `Your password was changed · ${store}`;
      case EmailTemplate.ORDER_CONFIRMATION:
        return `Order ${d.orderNumber} confirmed`;
      case EmailTemplate.ORDER_STATUS_UPDATE:
        return `Order ${d.orderNumber} · ${this.titleCase(String(d.status ?? 'updated'))}`;
      case EmailTemplate.PAYMENT_RECEIPT:
        return `Payment received · Order ${d.orderNumber}`;
      case EmailTemplate.REFUND_PROCESSED:
        return `Refund processed · Order ${d.orderNumber}`;
      case EmailTemplate.RETURN_UPDATE:
        return `Return ${d.returnNumber} · ${this.titleCase(String(d.status ?? 'updated'))}`;
      default:
        return store;
    }
  }

  private block(template: EmailTemplate, d: Record<string, unknown>): Block {
    const orderHref = (n: unknown) =>
      `${this.webUrl}/account/orders/${encodeURIComponent(String(n))}`;

    switch (template) {
      case EmailTemplate.EMAIL_VERIFICATION:
        return {
          preheader: 'Confirm your email address to finish setting up your account.',
          heading: 'Verify your email',
          intro: [
            'Welcome! Confirm this email address to activate your account and start shopping.',
            'This link expires in 24 hours.',
          ],
          cta: {
            label: 'Verify email',
            href: `${this.webUrl}/verify-email?token=${encodeURIComponent(String(d.token ?? ''))}`,
          },
          note: 'If you didn’t create an account, you can safely ignore this email.',
        };

      case EmailTemplate.PASSWORD_RESET:
        return {
          preheader: 'Reset your password with the secure link inside.',
          heading: 'Reset your password',
          intro: [
            'We received a request to reset your password. Tap the button below to choose a new one.',
            'This link expires in 1 hour.',
          ],
          cta: {
            label: 'Reset password',
            href: `${this.webUrl}/reset-password?token=${encodeURIComponent(String(d.token ?? ''))}`,
          },
          note: 'Didn’t request this? Your password is unchanged — you can ignore this email.',
        };

      case EmailTemplate.PASSWORD_CHANGED:
        return {
          preheader: 'Your password was just changed.',
          heading: 'Password changed',
          intro: ['This confirms your account password was changed successfully.'],
          accent: 'success',
          note: this.contact
            ? `If this wasn’t you, contact us immediately at ${this.contact}.`
            : 'If this wasn’t you, contact support immediately.',
        };

      case EmailTemplate.ORDER_CONFIRMATION:
        return {
          preheader: `Order ${d.orderNumber} is confirmed.`,
          heading: 'Order confirmed',
          intro: [
            'Thanks for your order! We’re getting it ready and will email you as it progresses.',
          ],
          accent: 'success',
          details: [
            ['Order number', String(d.orderNumber ?? '')],
            ['Order total', this.money(d.grandTotal)],
          ],
          cta: { label: 'View your order', href: orderHref(d.orderNumber) },
        };

      case EmailTemplate.ORDER_STATUS_UPDATE:
        return {
          preheader: `Order ${d.orderNumber} is now ${this.titleCase(String(d.status ?? ''))}.`,
          heading: 'Order update',
          intro: [`Your order status has changed to ${this.titleCase(String(d.status ?? ''))}.`],
          details: [
            ['Order number', String(d.orderNumber ?? '')],
            ['Status', this.titleCase(String(d.status ?? ''))],
          ],
          cta: { label: 'Track your order', href: orderHref(d.orderNumber) },
        };

      case EmailTemplate.PAYMENT_RECEIPT:
        return {
          preheader: `We received your payment for order ${d.orderNumber}.`,
          heading: 'Payment received',
          intro: ['Thank you — your payment has been received and your order is confirmed.'],
          accent: 'success',
          details: [
            ['Order number', String(d.orderNumber ?? '')],
            ['Amount paid', this.money(d.amount)],
          ],
          cta: { label: 'View your order', href: orderHref(d.orderNumber) },
        };

      case EmailTemplate.REFUND_PROCESSED:
        return {
          preheader: `A refund was processed for order ${d.orderNumber}.`,
          heading: 'Refund processed',
          intro: [
            'We’ve processed a refund for your order. It may take a few business days to appear on your statement.',
          ],
          details: [
            ['Order number', String(d.orderNumber ?? '')],
            ['Refund amount', this.money(d.amount)],
          ],
          cta: { label: 'View your order', href: orderHref(d.orderNumber) },
        };

      case EmailTemplate.RETURN_UPDATE:
        return {
          preheader: `Return ${d.returnNumber} is now ${this.titleCase(String(d.status ?? ''))}.`,
          heading: 'Return update',
          intro: [
            `Your return request has been updated to ${this.titleCase(String(d.status ?? ''))}.`,
          ],
          details: [
            ['Return number', String(d.returnNumber ?? '')],
            ['Status', this.titleCase(String(d.status ?? ''))],
          ],
          cta: { label: 'View your returns', href: `${this.webUrl}/account/orders` },
        };

      default:
        return {
          preheader: '',
          heading: 'Notification',
          intro: [String(d.message ?? '')],
        };
    }
  }

  // ---- rendering ----

  private html(b: Block): string {
    // brand is the default accent moment; success/danger remap functionally.
    const accent =
      b.accent === 'success' ? C.success : b.accent === 'danger' ? C.danger : C.brand;
    const intro = b.intro
      .filter(Boolean)
      .map(
        (p) =>
          `<p style="margin:0 0 16px;color:${C.ink};font-size:15px;line-height:1.65;font-family:${C.fontBody}">${this.esc(p)}</p>`,
      )
      .join('');

    // Confident near-black CTA (design §2: CTAs are black/white; brand is the spark).
    const cta = b.cta
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0">
           <tr><td bgcolor="${C.primary}" style="border-radius:10px">
             <a href="${this.escAttr(b.cta.href)}" target="_blank"
               style="display:inline-block;padding:13px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.01em;font-family:${C.fontBody}">
               ${this.esc(b.cta.label)}</a>
           </td></tr>
         </table>`
      : '';

    const ctaFallback = b.cta
      ? `<p style="margin:0 0 14px;color:${C.muted};font-size:12px;line-height:1.5;word-break:break-all;font-family:${C.fontBody}">
           Or paste this link into your browser:<br/>
           <a href="${this.escAttr(b.cta.href)}" style="color:${C.brand};font-weight:600">${this.esc(b.cta.href)}</a>
         </p>`
      : '';

    const details =
      b.details && b.details.length
        ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"
              style="margin:8px 0 18px;background:${C.brandSoft};border:1px solid ${C.border};border-radius:12px;border-collapse:separate;font-family:${C.fontBody}">
             ${b.details
               .map(
                 ([label, value], i) =>
                   `<tr>
                      <td style="padding:12px 16px;color:${C.muted};font-size:13px;${i ? `border-top:1px solid ${C.border};` : ''}">${this.esc(label)}</td>
                      <td align="right" style="padding:12px 16px;color:${C.ink};font-size:13px;font-weight:700;${i ? `border-top:1px solid ${C.border};` : ''}">${this.esc(value)}</td>
                    </tr>`,
               )
               .join('')}
           </table>`
        : '';

    const note = b.note
      ? `<p style="margin:20px 0 0;color:${C.muted};font-size:13px;line-height:1.6;font-family:${C.fontBody}">${this.esc(b.note)}</p>`
      : '';

    const year = new Date().getFullYear();
    const footerContact = this.contact
      ? `<a href="mailto:${this.escAttr(this.contact)}" style="color:${C.brand}">${this.esc(this.contact)}</a> · `
      : '';

    return `<!doctype html>
          <html lang="en"><head><meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1"/>
          <meta name="color-scheme" content="light"/>
          <title>${this.esc(b.heading)}</title></head>
          <body style="margin:0;padding:0;background:${C.bg};">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0">${this.esc(b.preheader)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 12px">
            <tr><td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0"
                    style="max-width:600px;width:100%;background:${C.card};border:1px solid ${C.border};border-radius:16px;overflow:hidden;font-family:${C.fontBody};box-shadow:${C.shadow}">
                <tr><td style="height:4px;background:${C.brand};background-image:linear-gradient(90deg,${C.brand},${C.brandStrong});font-size:0;line-height:0">&nbsp;</td></tr>
                <tr><td align="center" style="background:${C.card};padding:28px 28px 24px;border-bottom:1px solid ${C.border}">
                  <img src="${this.escAttr(this.webUrl)}/logo.png" alt="${this.escAttr(this.storeName)}"
                      height="52" style="display:block;border:0;outline:none;height:52px;width:auto;margin:0 auto"/>
                </td></tr>
                <tr><td style="padding:32px 28px">
                  <p style="margin:0 0 10px;color:${accent};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;font-family:${C.fontBody}">${this.esc(this.storeName)}</p>
                  <h1 style="margin:0 0 16px;color:${C.ink};font-size:24px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;font-family:${C.fontHeading}">${this.esc(b.heading)}</h1>
                  ${intro}
                  ${cta}
                  ${details}
                  ${ctaFallback}
                  ${note}
                </td></tr>
                <tr><td style="padding:20px 28px;background:${C.elevated};border-top:1px solid ${C.border}">
                  <p style="margin:0;color:${C.muted};font-size:12px;line-height:1.6;font-family:${C.fontBody}">
                    ${footerContact}© ${year} ${this.esc(this.storeName)}<br/>
                    This is an automated message — please don’t reply directly.
                  </p>
                </td></tr>
              </table>
            </td></tr>
          </table>
          </body></html>
        `;
  }

  private text(b: Block): string {
    const lines: string[] = [this.storeName.toUpperCase(), '', b.heading, ''];
    lines.push(...b.intro.filter(Boolean));
    if (b.details?.length) {
      lines.push('');
      for (const [label, value] of b.details) lines.push(`${label}: ${value}`);
    }
    if (b.cta) {
      lines.push('', `${b.cta.label}: ${b.cta.href}`);
    }
    if (b.note) lines.push('', b.note);
    lines.push('', `© ${new Date().getFullYear()} ${this.storeName}`);
    return lines.join('\n');
  }

  // ---- helpers ----

  private money(n: unknown): string {
    return `${this.currency} ${Number(n ?? 0).toFixed(2)}`;
  }

  private titleCase(s: string): string {
    return s
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private escAttr(s: string): string {
    return this.esc(s).replace(/'/g, '&#39;');
  }
}
