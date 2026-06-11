import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { SettingsService } from '../../settings/services/settings.service';
import { Order } from '../entities/order.entity';
import { AddressSnapshot } from '../entities/order.entity';

/** Generates an order invoice as a PDF buffer (pdfkit, no headless browser). */
@Injectable()
export class InvoiceService {
  constructor(private readonly settings: SettingsService) {}

  async generate(order: Order): Promise<Buffer> {
    const [storeName, supportEmail] = await Promise.all([
      this.settings.getString('store.name').catch(() => 'Budget Tees'),
      this.settings.getString('store.supportEmail').catch(() => ''),
    ]);
    const currency = order.currency || 'NPR';
    const money = (n: number) => `${currency} ${Number(n ?? 0).toFixed(2)}`;
    const date = (d: Date | string | null) =>
      d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

    const ink = '#18181b';
    const muted = '#71717a';
    const line = '#e4e4e7';

    // Header
    doc.fillColor(ink).font('Helvetica-Bold').fontSize(20).text(storeName, { continued: false });
    doc
      .font('Helvetica')
      .fontSize(20)
      .fillColor(muted)
      .text('INVOICE', 0, 50, { align: 'right' });
    doc.moveDown(1.5);

    // Meta
    const metaTop = doc.y;
    doc.fontSize(10).fillColor(muted).text('Order', 50, metaTop);
    doc.fillColor(ink).font('Helvetica-Bold').text(order.orderNumber, 50, metaTop + 12);
    doc.font('Helvetica').fillColor(muted).text('Placed', 250, metaTop);
    doc.fillColor(ink).text(date(order.placedAt ?? order.createdAt), 250, metaTop + 12);
    doc.font('Helvetica').fillColor(muted).text('Status', 400, metaTop);
    doc
      .fillColor(ink)
      .text(`${order.status} · ${order.paymentStatus}`, 400, metaTop + 12, { width: 145 });
    doc.moveDown(3);

    // Bill to
    const addr = order.shippingAddress;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(ink).text('Bill to');
    doc.font('Helvetica').fontSize(10).fillColor(muted);
    if (addr) this.addressLines(addr).forEach((l) => doc.text(l));
    doc.text(order.contactEmail);
    doc.text(order.contactPhone);
    doc.text(`Payment: ${order.paymentMethod} · Fulfillment: ${order.fulfillmentMethod}`);
    doc.moveDown(1.5);

    // Items table
    const x = { name: 50, unit: 320, qty: 400, line: 470 };
    const headerY = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(ink);
    doc.text('Item', x.name, headerY);
    doc.text('Unit', x.unit, headerY, { width: 70, align: 'right' });
    doc.text('Qty', x.qty, headerY, { width: 50, align: 'right' });
    doc.text('Amount', x.line, headerY, { width: 75, align: 'right' });
    doc.moveTo(50, headerY + 15).lineTo(545, headerY + 15).strokeColor(line).stroke();
    doc.moveDown(1);

    doc.font('Helvetica').fontSize(10);
    for (const it of order.items) {
      const rowY = doc.y;
      const variant =
        it.variant && Object.keys(it.variant).length ? ` (${Object.values(it.variant).join(' / ')})` : '';
      doc.fillColor(ink).text(`${it.productName}${variant}`, x.name, rowY, { width: 260 });
      const nameH = doc.y - rowY;
      doc.fillColor(muted).fontSize(8).text(it.skuCode, x.name, doc.y, { width: 260 });
      doc.fontSize(10).fillColor(ink);
      doc.text(money(it.unitPrice), x.unit, rowY, { width: 70, align: 'right' });
      doc.text(String(it.quantity), x.qty, rowY, { width: 50, align: 'right' });
      doc.text(money(it.lineTotal), x.line, rowY, { width: 75, align: 'right' });
      doc.y = rowY + Math.max(nameH, 12) + 10;
    }

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(line).stroke();
    doc.moveDown(0.8);

    // Totals
    const totalRow = (label: string, value: string, bold = false) => {
      const y = doc.y;
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10);
      doc.fillColor(bold ? ink : muted).text(label, 320, y, { width: 120, align: 'right' });
      doc.fillColor(ink).text(value, 440, y, { width: 105, align: 'right' });
      doc.moveDown(0.4);
    };
    totalRow('Subtotal', money(order.subtotal));
    if (order.saleSavings > 0) totalRow('Sale savings', `- ${money(order.saleSavings)}`);
    if (order.discountTotal > 0)
      totalRow(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`, `- ${money(order.discountTotal)}`);
    totalRow('Shipping', money(order.shippingCost));
    totalRow('Grand total', money(order.grandTotal), true);
    doc.font('Helvetica').fontSize(8).fillColor(muted);
    doc.text(`Includes ${money(order.taxTotal)} tax (tax-inclusive pricing).`, 320, doc.y, {
      width: 225,
      align: 'right',
    });

    // Footer
    doc.fontSize(9).fillColor(muted);
    const footerY = 780;
    doc.text(
      supportEmail ? `Questions? ${supportEmail}` : 'Thank you for your purchase.',
      50,
      footerY,
      { align: 'center', width: 495 },
    );

    doc.end();
    return done;
  }

  private addressLines(a: AddressSnapshot): string[] {
    const lines: string[] = [];
    if (a.recipientName) lines.push(a.recipientName);
    if (a.line1) lines.push(a.line1);
    if (a.line2) lines.push(a.line2);
    const cityLine = [a.city, a.region, a.postalCode].filter(Boolean).join(', ');
    if (cityLine) lines.push(cityLine);
    if (a.countryCode) lines.push(a.countryCode);
    return lines;
  }
}
