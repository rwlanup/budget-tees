import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import { SettingsService } from '../../settings/services/settings.service';
import { Order, AddressSnapshot } from '../entities/order.entity';
import { ReturnRequest } from '../../return/entities/return-request.entity';

/** A pill colour pair (background + foreground). */
interface Pill {
  bg: string;
  fg: string;
}

/**
 * Generates an order invoice as a polished, brand-aligned A4 PDF buffer.
 *
 * Pure pdfkit (no headless browser) with the standard Helvetica family, so it
 * runs anywhere and is deterministic. The visual language mirrors the storefront
 * design system: a clean neutral canvas punctuated by a single deep-blue brand
 * accent (header band + grand-total emphasis), generous whitespace, hairline
 * rules, and a tabular line-item table.
 */
@Injectable()
export class InvoiceService {
  constructor(
    private readonly settings: SettingsService,
    @InjectRepository(ReturnRequest) private readonly returns: Repository<ReturnRequest>,
  ) {}

  // A4 geometry (points) + content frame.
  private static readonly PAGE = { w: 595.28, h: 841.89 };
  private static readonly M = 48; // content margin
  private static readonly C = {
    ink: '#18181B', // foreground
    inkSoft: '#3F3F46',
    muted: '#71717A',
    faint: '#A1A1AA',
    line: '#E4E4E7', // hairline
    lineSoft: '#F4F4F5', // table header fill
    brand: '#1F4E84', // logo brand accent (deep blue)
    brandStrong: '#16395F',
    brandMuted: '#EAF1FB', // tinted emphasis surface
    bandSub: '#B9C7DC', // secondary text on the brand band
    white: '#FFFFFF',
  };
  private static readonly PILL: Record<string, Pill> = {
    green: { bg: '#DCFCE7', fg: '#15803D' },
    amber: { bg: '#FEF3C7', fg: '#92400E' },
    red: { bg: '#FEE2E2', fg: '#B91C1C' },
    zinc: { bg: '#F4F4F5', fg: '#3F3F46' },
  };

  async generate(order: Order): Promise<Buffer> {
    const [storeName, supportEmail, returns] = await Promise.all([
      this.settings.getString('store.name').catch(() => 'Budget Tees'),
      this.settings.getString('store.supportEmail').catch(() => ''),
      this.returns.find({ where: { orderId: order.id }, order: { createdAt: 'ASC' } }),
    ]);

    const { PAGE, M, C } = InvoiceService;
    const contentW = PAGE.w - M * 2;
    const right = PAGE.w - M;
    const FOOTER_Y = PAGE.h - 50;

    const currency = order.currency || 'NPR';
    const nf = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const money = (n: number) => `${currency} ${nf.format(Number(n ?? 0))}`;
    const dateLong = (d: Date | string | null) =>
      d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
    const titleCase = (s: string) =>
      s.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const paymentMethod = (m: string) =>
      ({ ESEWA: 'eSewa', COD: 'Cash on Delivery' })[m] ?? titleCase(m);
    const fulfillment = (f: string) =>
      ({ DELIVERY: 'Delivery', PICKUP: 'Store Pickup' })[f] ?? titleCase(f);
    const statusStyle = (s: string): Pill => {
      if (['PAID', 'CONFIRMED', 'DELIVERED', 'PICKED_UP', 'COMPLETED'].includes(s))
        return InvoiceService.PILL.green;
      if (
        [
          'PENDING', 'PROCESSING', 'SHIPPED', 'READY_FOR_PICKUP', 'UNPAID', 'PARTIALLY_REFUNDED',
          'REQUESTED', 'APPROVED', 'AWAITING_ITEMS', 'RECEIVED',
        ].includes(s)
      )
        return InvoiceService.PILL.amber;
      if (['CANCELLED', 'FAILED', 'REFUNDED', 'RETURNED', 'REJECTED'].includes(s))
        return InvoiceService.PILL.red;
      return InvoiceService.PILL.zinc;
    };

    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      bufferPages: true,
      info: { Title: `Invoice ${order.orderNumber}`, Author: storeName, Subject: 'Order invoice' },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

    // ── small drawing helpers ──────────────────────────────────────────────
    const eyebrow = (label: string, x: number, y: number, color = C.faint, width?: number) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(color)
        .text(label.toUpperCase(), x, y, { characterSpacing: 1.2, width, lineBreak: false });
    };
    const pillRight = (label: string, rx: number, y: number, style: Pill) => {
      const up = label.toUpperCase();
      doc.font('Helvetica-Bold').fontSize(8);
      const w = doc.widthOfString(up, { characterSpacing: 0.6 }) + 16;
      doc.roundedRect(rx - w, y, w, 16, 8).fill(style.bg);
      doc.fillColor(style.fg).text(up, rx - w + 8, y + 4.3, { characterSpacing: 0.6, lineBreak: false });
    };
    const hairline = (y: number) => {
      doc.moveTo(M, y).lineTo(right, y).lineWidth(0.5).strokeColor(C.line).stroke();
    };

    // ── header band ────────────────────────────────────────────────────────
    doc.rect(0, 0, PAGE.w, 128).fill(C.brand);
    doc.rect(0, 124, PAGE.w, 4).fill(C.brandStrong); // layered accent baseline

    const badge = { x: M, y: 38, s: 42 };
    const initials =
      storeName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase() || 'BT';
    doc.roundedRect(badge.x, badge.y, badge.s, badge.s, 11).fill(C.white);
    doc
      .fillColor(C.brand)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(initials, badge.x, badge.y + 13, { width: badge.s, align: 'center', characterSpacing: 0.5 });

    const wmX = badge.x + badge.s + 14;
    doc
      .fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(19)
      .text(storeName, wmX, badge.y + 4, { lineBreak: false });
    eyebrow('Premium Streetwear', wmX, badge.y + 28, C.bandSub);

    doc
      .fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(24)
      .text('INVOICE', M, 40, { width: contentW, align: 'right', characterSpacing: 1 });
    doc
      .fillColor(C.bandSub)
      .font('Helvetica')
      .fontSize(10)
      .text(`#${order.orderNumber}`, M, 73, { width: contentW, align: 'right' });
    pillRight(titleCase(order.paymentStatus), right, 92, statusStyle(order.paymentStatus));

    let y = 156;

    // ── meta strip ───────────────────────────────────────────────────────────
    const stripH = 54;
    doc.roundedRect(M, y, contentW, stripH, 12).fill(C.brandMuted);
    const fields: Array<[string, string, string?]> = [
      ['Order date', dateLong(order.placedAt ?? order.createdAt)],
      ['Payment', paymentMethod(order.paymentMethod)],
      ['Fulfillment', fulfillment(order.fulfillmentMethod)],
      ['Status', titleCase(order.status), statusStyle(order.status).fg],
    ];
    const fieldW = contentW / fields.length;
    fields.forEach(([label, value, valueColor], i) => {
      const fx = M + 18 + i * fieldW;
      eyebrow(label, fx, y + 13, C.brandStrong);
      doc
        .font('Helvetica-Bold')
        .fontSize(10.5)
        .fillColor(valueColor ?? C.ink)
        .text(value, fx, y + 27, { width: fieldW - 22, lineBreak: false });
    });
    y += stripH + 30;

    // ── billed to / shipped to ────────────────────────────────────────────────
    const colGap = 32;
    const partyW = (contentW - colGap) / 2;
    const partyTop = y;

    const renderParty = (title: string, x: number, name: string, lines: string[]): number => {
      eyebrow(title, x, partyTop, C.faint);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(C.ink).text(name || '—', x, partyTop + 15, { width: partyW });
      doc.font('Helvetica').fontSize(9.5).fillColor(C.muted);
      let yy = doc.y + 3;
      for (const l of lines) {
        if (!l) continue;
        doc.text(l, x, yy, { width: partyW });
        yy = doc.y + 1;
      }
      return yy;
    };

    const billAddr = order.billingAddress;
    const shipAddr = order.shippingAddress;
    const billedName = billAddr?.recipientName ?? shipAddr?.recipientName ?? storeName;
    const billedLines = [order.contactEmail, order.contactPhone];
    if (billAddr) billedLines.push(...this.addressLines(billAddr).slice(1));
    else if (shipAddr) billedLines.push('Same as delivery address');
    const billedBottom = renderParty('Billed to', M, billedName, billedLines);

    const rightColX = M + partyW + colGap;
    let shippedBottom = partyTop;
    if (order.fulfillmentMethod === 'PICKUP') {
      const p = (order.pickupLocation ?? {}) as Record<string, unknown>;
      const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
      const pickName = str(p.name) ?? 'Store pickup';
      const pickLines = [
        str(p.line1) ?? str(p.address),
        [str(p.city), str(p.region)].filter(Boolean).join(', ') || undefined,
        str(p.phone),
      ].filter(Boolean) as string[];
      shippedBottom = renderParty('Pickup location', rightColX, pickName, pickLines);
    } else if (shipAddr) {
      const shipLines = this.addressLines(shipAddr).slice(1);
      if (shipAddr.nearestLandmark) shipLines.push(`Landmark: ${shipAddr.nearestLandmark}`);
      if (shipAddr.phone) shipLines.push(shipAddr.phone);
      shippedBottom = renderParty('Shipped to', rightColX, shipAddr.recipientName, shipLines);
    }
    y = Math.max(billedBottom, shippedBottom) + 26;

    // ── line items table ──────────────────────────────────────────────────────
    const COL = {
      itemX: M, itemW: 250,
      unitX: 305, unitW: 78, // right edge 383
      qtyX: 393, qtyW: 47, // right edge 440
      amtX: 447, amtW: right - 447, // right edge = content right
    };
    const drawTableHeader = () => {
      doc.roundedRect(M, y, contentW, 26, 6).fill(C.lineSoft);
      doc.font('Helvetica-Bold').fontSize(8).fillColor(C.muted);
      const ty = y + 9;
      doc.text('ITEM', COL.itemX + 12, ty, { characterSpacing: 1, lineBreak: false });
      doc.text('UNIT PRICE', COL.unitX, ty, { width: COL.unitW, align: 'right', characterSpacing: 0.8 });
      doc.text('QTY', COL.qtyX, ty, { width: COL.qtyW, align: 'right', characterSpacing: 0.8 });
      doc.text('AMOUNT', COL.amtX, ty, { width: COL.amtW - 12, align: 'right', characterSpacing: 0.8 });
      y += 26 + 4;
    };
    const ensureRow = (h: number) => {
      if (y + h > FOOTER_Y - 12) {
        doc.addPage();
        y = M;
        drawTableHeader();
      }
    };
    const ensure = (h: number) => {
      if (y + h > FOOTER_Y - 12) {
        doc.addPage();
        y = M;
      }
    };

    drawTableHeader();
    for (const it of order.items) {
      const variant =
        it.variant && Object.keys(it.variant).length ? Object.values(it.variant).join(' / ') : '';
      const sub = [variant, it.skuCode ? `SKU ${it.skuCode}` : ''].filter(Boolean).join('   ·   ');

      doc.font('Helvetica-Bold').fontSize(10);
      const nameH = doc.heightOfString(it.productName, { width: COL.itemW });
      let subH = 0;
      if (sub) {
        doc.font('Helvetica').fontSize(8.5);
        subH = doc.heightOfString(sub, { width: COL.itemW }) + 2;
      }
      const rowH = Math.max(nameH + subH + 16, 34);
      ensureRow(rowH);

      const ty = y + 9;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(C.ink).text(it.productName, COL.itemX + 12, ty, {
        width: COL.itemW,
      });
      if (sub)
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor(C.muted)
          .text(sub, COL.itemX + 12, doc.y + 2, { width: COL.itemW });
      doc.font('Helvetica').fontSize(10).fillColor(C.ink);
      doc.text(money(it.unitPrice), COL.unitX, ty, { width: COL.unitW, align: 'right' });
      doc.text(String(it.quantity), COL.qtyX, ty, { width: COL.qtyW, align: 'right' });
      doc
        .font('Helvetica-Bold')
        .fillColor(C.ink)
        .text(money(it.lineTotal), COL.amtX, ty, { width: COL.amtW - 12, align: 'right' });

      y += rowH;
      hairline(y);
    }

    // ── summary: note (left) + totals (right) ───────────────────────────────
    y += 22;
    ensure(150);
    const summaryTop = y;

    const totalsW = 250;
    const tX = right - totalsW;
    const valW = 120;
    const totalLine = (label: string, value: string, opts: { strong?: boolean; valColor?: string } = {}) => {
      doc
        .font(opts.strong ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(opts.strong ? 10.5 : 9.5)
        .fillColor(opts.strong ? C.ink : C.muted)
        .text(label, tX, y, { width: totalsW - valW, align: 'left', lineBreak: false });
      doc
        .fillColor(opts.valColor ?? C.ink)
        .text(value, tX + (totalsW - valW), y, { width: valW, align: 'right', lineBreak: false });
      y += 19;
    };

    totalLine('Subtotal', money(order.subtotal));
    if (order.saleSavings > 0)
      totalLine('Sale savings', `- ${money(order.saleSavings)}`, { valColor: C.brand });
    if (order.discountTotal > 0)
      totalLine(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`, `- ${money(order.discountTotal)}`, {
        valColor: C.brand,
      });
    totalLine('Shipping', order.shippingCost > 0 ? money(order.shippingCost) : 'Free');

    y += 6;
    const gh = 42;
    doc.roundedRect(tX, y, totalsW, gh, 10).fill(C.brandMuted);
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(C.brandStrong)
      .text('GRAND TOTAL', tX + 16, y + 16, { characterSpacing: 0.8, lineBreak: false });
    doc
      .fontSize(15)
      .fillColor(C.brand)
      .text(money(order.grandTotal), tX, y + 13, { width: totalsW - 16, align: 'right', lineBreak: false });
    y += gh + 8;
    doc
      .font('Helvetica-Oblique')
      .fontSize(8)
      .fillColor(C.faint)
      .text(`Includes ${money(order.taxTotal)} tax · tax-inclusive pricing`, tX, y, {
        width: totalsW,
        align: 'right',
      });
    const totalsBottom = y;

    if (order.customerNote) {
      eyebrow('Order note', M, summaryTop, C.faint);
      doc
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor(C.muted)
        .text(order.customerNote, M, summaryTop + 15, { width: tX - M - 28 });
    }

    y = Math.max(totalsBottom, doc.y) + 30;

    // ── returns (if any) ───────────────────────────────────────────────────
    if (returns.length) {
      ensure(54);
      eyebrow('Returns', M, y, C.faint);
      y += 18;
      for (const r of returns) {
        const resolution = r.resolutionType === 'EXCHANGE' ? 'Exchange' : 'Refund';
        const sub = [resolution, titleCase(r.reason), dateLong(r.resolvedAt ?? r.createdAt)].join(
          '   ·   ',
        );
        const amount =
          r.refundAmount != null
            ? `Refund ${money(r.refundAmount)}`
            : r.priceDifference != null && r.priceDifference !== 0
              ? `Price diff. ${money(r.priceDifference)}`
              : '';
        const exchangeNames = (r.items ?? [])
          .map((i) => i.exchangeSku?.productName)
          .filter((n): n is string => !!n);

        const rowH = exchangeNames.length ? 48 : 34;
        ensure(rowH);
        const ty = y + 6;

        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(C.ink)
          .text(r.returnNumber, M + 2, ty, { width: contentW - 170, lineBreak: false });
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor(C.muted)
          .text(sub, M + 2, ty + 14, { width: contentW - 170, lineBreak: false });
        if (exchangeNames.length)
          doc
            .font('Helvetica')
            .fontSize(8.5)
            .fillColor(C.brand)
            .text(`Exchanged for: ${exchangeNames.join(', ')}`, M + 2, ty + 27, {
              width: contentW - 170,
              lineBreak: false,
            });
        pillRight(titleCase(r.status), right - 2, y + 3, statusStyle(r.status));
        if (amount)
          doc
            .font('Helvetica-Bold')
            .fontSize(9)
            .fillColor(C.ink)
            .text(amount, right - 160, ty + 15, { width: 158, align: 'right', lineBreak: false });

        y += rowH;
        hairline(y);
      }
      y += 16;
    }

    // Closing line — fit it on the current page or skip it (never strand a near-empty page).
    if (y + 26 <= FOOTER_Y - 12) {
      hairline(y);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(C.muted)
        .text(`Thank you for shopping with ${storeName}.`, M, y + 12, { width: contentW, align: 'center' });
    }

    // ── footer (every page) ──────────────────────────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      hairline(FOOTER_Y);
      doc.font('Helvetica').fontSize(8).fillColor(C.faint);
      doc.text(`${storeName}${supportEmail ? `   ·   ${supportEmail}` : ''}`, M, FOOTER_Y + 9, {
        width: contentW * 0.7,
        align: 'left',
        lineBreak: false,
      });
      doc.text(`Page ${i - range.start + 1} of ${range.count}`, M + contentW * 0.7, FOOTER_Y + 9, {
        width: contentW * 0.3,
        align: 'right',
        lineBreak: false,
      });
    }

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
