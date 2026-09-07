import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { PAYMENT_DETAILS, BILLED_BY_DETAILS, computeInvoicePaymentStatus, formatPaymentStatusLabel } from '@/lib/constants/payment';
import { getInvoiceTheme, hexToRgb } from '@/lib/constants/invoiceThemes';

let cachedQrBytes: Uint8Array | null = null;
async function fetchQrImageBytes(): Promise<Uint8Array | null> {
  if (cachedQrBytes) return cachedQrBytes;
  try {
    const res = await fetch(PAYMENT_DETAILS.qrCodeUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      cachedQrBytes = new Uint8Array(buffer).slice();
      return cachedQrBytes;
    }
  } catch (err) {
    console.warn('Failed to fetch payment QR code for invoice PDF:', err);
  }
  return null;
}

let cachedSignatureBytes: Uint8Array | null = null;
function getSignatureBytes(): Uint8Array | null {
  if (cachedSignatureBytes) return cachedSignatureBytes;
  try {
    const sigPath = path.join(process.cwd(), 'public', 'images', 'signature.jpg');
    if (fs.existsSync(sigPath)) {
      const fileBuf = fs.readFileSync(sigPath);
      cachedSignatureBytes = new Uint8Array(fileBuf).slice();
      return cachedSignatureBytes;
    }
  } catch (err) {
    console.warn('Could not read signature file:', err);
  }
  return null;
}

export async function generateInvoicePDF(
  invoice: any,
  client: any,
  items: any[],
  booking?: any,
  settings?: any,
  requestedTheme?: string
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // A4 size: 595.28 x 841.89
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Determine active theme
  const theme = getInvoiceTheme(requestedTheme || invoice.invoiceTheme || 'purple');
  const primaryRgbObj = hexToRgb(theme.primary);
  const primaryColor = rgb(primaryRgbObj.r, primaryRgbObj.g, primaryRgbObj.b);

  const lightBgObj = hexToRgb(theme.lightBackground);
  const cardBgColor = rgb(lightBgObj.r, lightBgObj.g, lightBgObj.b);

  const borderObj = hexToRgb(theme.border);
  const borderColor = rgb(borderObj.r, borderObj.g, borderObj.b);

  const darkColor = rgb(0.08, 0.08, 0.08);
  const grayColor = rgb(0.38, 0.38, 0.38);
  const lightGrayColor = rgb(0.55, 0.55, 0.55);
  const whiteColor = rgb(1, 1, 1);

  // Fonts loading with custom TTF fallback to standard
  let fontRegular: any;
  let fontBold: any;
  let currencySym = '₹';

  try {
    const regularFontBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf'));
    const boldFontBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf'));
    fontRegular = await pdfDoc.embedFont(regularFontBytes);
    fontBold = await pdfDoc.embedFont(boldFontBytes);
  } catch {
    fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    currencySym = 'Rs. ';
  }

  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const formatDate = (dateInput: any) => {
    if (!dateInput) return 'N/A';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const paymentStatus = computeInvoicePaymentStatus(invoice);
  const statusLabel = formatPaymentStatusLabel(paymentStatus);

  // 1. TOP HEADER SECTION
  const y = height - 42;

  // Title: "Invoice"
  page.drawText('Invoice', {
    x: 40,
    y,
    size: 26,
    font: fontBold,
    color: primaryColor,
  });

  // Invoice Metadata below header
  const metaStartX = 40;
  const metaValX = 115;
  const metaY = y - 26;

  page.drawText('Invoice No', { x: metaStartX, y: metaY, size: 8.5, font: fontRegular, color: grayColor });
  page.drawText(invoice.invoiceNumber || 'INV-001', { x: metaValX, y: metaY, size: 8.5, font: fontBold, color: darkColor });

  page.drawText('Invoice Date', { x: metaStartX, y: metaY - 14, size: 8.5, font: fontRegular, color: grayColor });
  page.drawText(formatDate(invoice.issueDate), { x: metaValX, y: metaY - 14, size: 8.5, font: fontRegular, color: darkColor });

  page.drawText('Created By', { x: metaStartX, y: metaY - 28, size: 8.5, font: fontRegular, color: grayColor });
  page.drawText(invoice.createdBy || BILLED_BY_DETAILS.name, { x: metaValX, y: metaY - 28, size: 8.5, font: fontRegular, color: darkColor });

  // Status Badge top right
  const badgeWidth = 72;
  const badgeHeight = 16;
  const badgeX = width - 40 - badgeWidth;
  const badgeY = y + 4;
  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeWidth,
    height: badgeHeight,
    color: cardBgColor,
    borderColor: borderColor,
    borderWidth: 0.75,
  });
  const statusColor = statusLabel === 'PAID'
    ? rgb(0.08, 0.55, 0.25)
    : statusLabel === 'OVERDUE'
    ? rgb(0.85, 0.15, 0.15)
    : primaryColor;

  page.drawText(statusLabel, {
    x: badgeX + (badgeWidth - fontBold.widthOfTextAtSize(statusLabel, 7)) / 2,
    y: badgeY + 4.5,
    size: 7,
    font: fontBold,
    color: statusColor,
  });

  // 2. BILLING SECTION (Two Side-by-Side Cards)
  const billingCardY = metaY - 42;
  const cardWidth = 249;
  const cardHeight = 104;

  // Billed By Card (Left)
  page.drawRectangle({
    x: 40,
    y: billingCardY - cardHeight,
    width: cardWidth,
    height: cardHeight,
    color: cardBgColor,
    borderColor: borderColor,
    borderWidth: 0.75,
  });

  const bBy = invoice.billedBy || {};
  const billedByName = bBy.name || BILLED_BY_DETAILS.name;
  const billedByAddr1 = bBy.addressLine1 || BILLED_BY_DETAILS.addressLine1;
  const billedByAddr2 = bBy.addressLine2 || '';
  const billedByCity = bBy.city || BILLED_BY_DETAILS.city;
  const billedByStateZip = bBy.stateZip || (bBy.state ? `${bBy.state}, ${bBy.country || 'India'} - ${bBy.pinCode || '500045'}` : BILLED_BY_DETAILS.stateZip);
  const billedByPan = bBy.pan || BILLED_BY_DETAILS.pan;
  const billedByEmail = bBy.email || BILLED_BY_DETAILS.email;
  const billedByPhone = bBy.phone || BILLED_BY_DETAILS.phone;

  let byY = billingCardY - 15;
  page.drawText('Billed By', { x: 52, y: byY, size: 9.5, font: fontBold, color: primaryColor });
  byY -= 13;
  page.drawText(billedByName.substring(0, 36), { x: 52, y: byY, size: 8, font: fontBold, color: darkColor });
  byY -= 11;
  page.drawText(billedByAddr1.substring(0, 42), { x: 52, y: byY, size: 7.5, font: fontRegular, color: grayColor });
  byY -= 10;
  if (billedByAddr2) {
    page.drawText(billedByAddr2.substring(0, 42), { x: 52, y: byY, size: 7.5, font: fontRegular, color: grayColor });
    byY -= 10;
  } else {
    page.drawText(billedByCity.substring(0, 42), { x: 52, y: byY, size: 7.5, font: fontRegular, color: grayColor });
    byY -= 10;
  }
  page.drawText(billedByStateZip.substring(0, 42), { x: 52, y: byY, size: 7.5, font: fontRegular, color: grayColor });
  byY -= 11;
  page.drawText(`PAN: ${billedByPan}`, { x: 52, y: byY, size: 7.5, font: fontBold, color: darkColor });
  byY -= 11;
  page.drawText(`Email: ${billedByEmail}`, { x: 52, y: byY, size: 7.5, font: fontRegular, color: darkColor });
  byY -= 10;
  page.drawText(`Phone: ${billedByPhone}`, { x: 52, y: byY, size: 7.5, font: fontRegular, color: darkColor });

  // Billed To Card (Right)
  const toCardX = 40 + cardWidth + 17;
  page.drawRectangle({
    x: toCardX,
    y: billingCardY - cardHeight,
    width: cardWidth,
    height: cardHeight,
    color: cardBgColor,
    borderColor: borderColor,
    borderWidth: 0.75,
  });

  const bTo = invoice.billedTo || {};
  let toY = billingCardY - 15;
  page.drawText('Billed To', { x: toCardX + 12, y: toY, size: 9.5, font: fontBold, color: primaryColor });
  toY -= 13;
  const clientName = bTo.clientName || bTo.name || client?.name || client?.companyName || 'Valued Client';
  page.drawText(clientName.substring(0, 36), { x: toCardX + 12, y: toY, size: 8, font: fontBold, color: darkColor });
  toY -= 11;

  const clientCompany = bTo.companyName || (client?.companyName && client?.companyName !== clientName ? client.companyName : '');
  if (clientCompany) {
    page.drawText(clientCompany.substring(0, 38), { x: toCardX + 12, y: toY, size: 7.5, font: fontRegular, color: grayColor });
    toY -= 10;
  }

  const clientAddr1 = bTo.addressLine1 || '';
  const clientAddr2 = bTo.addressLine2 || '';
  const clientCity = bTo.city || '';
  const clientState = bTo.state ? `${bTo.state}, ${bTo.country || 'India'} - ${bTo.pinCode || ''}` : '';

  if (clientAddr1 || clientAddr2) {
    if (clientAddr1) {
      page.drawText(clientAddr1.substring(0, 42), { x: toCardX + 12, y: toY, size: 7.5, font: fontRegular, color: grayColor });
      toY -= 10;
    }
    if (clientAddr2 || clientCity) {
      const line2 = [clientAddr2, clientCity].filter(Boolean).join(', ');
      page.drawText(line2.substring(0, 42), { x: toCardX + 12, y: toY, size: 7.5, font: fontRegular, color: grayColor });
      toY -= 10;
    }
    if (clientState) {
      page.drawText(clientState.substring(0, 42), { x: toCardX + 12, y: toY, size: 7.5, font: fontRegular, color: grayColor });
      toY -= 10;
    }
  } else {
    const fallbackAddress = client?.billingAddress || client?.location || '';
    if (fallbackAddress) {
      const addrParts = fallbackAddress.split(',').map((p: string) => p.trim()).filter(Boolean);
      const line1 = addrParts.slice(0, 2).join(', ');
      const line2 = addrParts.slice(2, 4).join(', ');
      if (line1) {
        page.drawText(line1.substring(0, 42), { x: toCardX + 12, y: toY, size: 7.5, font: fontRegular, color: grayColor });
        toY -= 10;
      }
      if (line2) {
        page.drawText(line2.substring(0, 42), { x: toCardX + 12, y: toY, size: 7.5, font: fontRegular, color: grayColor });
        toY -= 10;
      }
    } else {
      page.drawText('Hyderabad, Telangana', { x: toCardX + 12, y: toY, size: 7.5, font: fontRegular, color: grayColor });
      toY -= 10;
    }
  }

  const clientEmail = bTo.email || client?.email;
  if (clientEmail) {
    page.drawText(`Email: ${clientEmail}`, { x: toCardX + 12, y: toY, size: 7.5, font: fontRegular, color: darkColor });
    toY -= 10;
  }
  const clientPhone = bTo.phone || client?.phone;
  if (clientPhone) {
    page.drawText(`Phone: ${clientPhone}`, { x: toCardX + 12, y: toY, size: 7.5, font: fontRegular, color: darkColor });
    toY -= 10;
  }
  const clientGstin = bTo.gstin || client?.gstin || client?.gstNumber;
  if (clientGstin) {
    page.drawText(`GSTIN: ${clientGstin}`, { x: toCardX + 12, y: toY, size: 7.5, font: fontBold, color: darkColor });
    toY -= 10;
  }

  // 3. ITEMS TABLE
  const tableTopY = billingCardY - cardHeight - 16;
  const colX = {
    item: 40,
    gstRate: 235,
    qty: 280,
    rate: 320,
    amount: 365,
    cgst: 415,
    sgst: 460,
    total: 505,
    end: 555,
  };

  // Table Header bar
  const headerHeight = 22;
  page.drawRectangle({
    x: 40,
    y: tableTopY - headerHeight,
    width: 515,
    height: headerHeight,
    color: primaryColor,
  });

  const headerTextY = tableTopY - 14.5;
  page.drawText('Item', { x: colX.item + 8, y: headerTextY, size: 7.5, font: fontBold, color: whiteColor });
  page.drawText('GST Rate', { x: colX.gstRate + 4, y: headerTextY, size: 7.5, font: fontBold, color: whiteColor });
  page.drawText('Quantity', { x: colX.qty + 3, y: headerTextY, size: 7.5, font: fontBold, color: whiteColor });
  page.drawText('Rate', { x: colX.rate + 12, y: headerTextY, size: 7.5, font: fontBold, color: whiteColor });
  page.drawText('Amount', { x: colX.amount + 10, y: headerTextY, size: 7.5, font: fontBold, color: whiteColor });
  page.drawText('CGST', { x: colX.cgst + 12, y: headerTextY, size: 7.5, font: fontBold, color: whiteColor });
  page.drawText('SGST', { x: colX.sgst + 12, y: headerTextY, size: 7.5, font: fontBold, color: whiteColor });
  page.drawText('Total', { x: colX.total + 18, y: headerTextY, size: 7.5, font: fontBold, color: whiteColor });

  // Table Body Rows
  let currentY = tableTopY - headerHeight;
  const parsedItems = (items && items.length > 0)
    ? items
    : [{ serviceName: 'Photography & Media Production', description: 'Production and cinematography deliverables', quantity: 1, price: invoice.total || 0, total: invoice.total || 0 }];

  // Helper to split multiline item description
  const splitDescriptionLines = (desc: string): string[] => {
    if (!desc) return [];
    const rawLines = desc.split('\n');
    const result: string[] = [];
    for (const raw of rawLines) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      // Word wrap long line at ~42 characters
      if (trimmed.length <= 42) {
        result.push(trimmed);
      } else {
        const words = trimmed.split(' ');
        let cur = '';
        for (const w of words) {
          if ((cur + ' ' + w).length <= 42) {
            cur = cur ? cur + ' ' + w : w;
          } else {
            if (cur) result.push(cur);
            cur = w;
          }
        }
        if (cur) result.push(cur);
      }
    }
    return result;
  };

  parsedItems.forEach((it: any, idx: number) => {
    const descLines = splitDescriptionLines(it.description || '');
    // Calculate row height dynamically to support multiline item descriptions
    const lineSpacing = 8.5;
    const descHeight = descLines.length * lineSpacing;
    const rowHeight = Math.max(26, 18 + descHeight);

    // Row bottom separator line
    page.drawLine({
      start: { x: 40, y: currentY - rowHeight },
      end: { x: colX.end, y: currentY - rowHeight },
      thickness: 0.5,
      color: borderColor,
    });

    const textBaseline = currentY - 12;

    // Item index and service title
    const itemTitle = `${idx + 1}.  ${it.serviceName || 'Service'}`;
    page.drawText(itemTitle.substring(0, 36), {
      x: colX.item + 8,
      y: textBaseline,
      size: 7.5,
      font: fontBold,
      color: darkColor,
    });

    // Multiline description lines
    let dY = textBaseline - 9.5;
    descLines.forEach((dLine) => {
      page.drawText(dLine, {
        x: colX.item + 18,
        y: dY,
        size: 6.5,
        font: fontRegular,
        color: grayColor,
      });
      dY -= lineSpacing;
    });

    // Calculations
    const qty = Number(it.quantity || 1);
    const rate = Number(it.price || 0);
    const amount = rate * qty;
    const tax = Number(it.tax || 0);
    const cgst = tax / 2;
    const sgst = tax / 2;
    const total = Number(it.total || (amount + tax));
    const gstRateVal = it.gstRate !== undefined && it.gstRate !== null ? it.gstRate : (tax > 0 ? Math.round((tax / amount) * 100) : 0);
    const gstRateStr = typeof gstRateVal === 'string' && gstRateVal.includes('%') ? gstRateVal : `${gstRateVal}%`;

    // Numbers alignment
    page.drawText(gstRateStr, { x: colX.gstRate + 12, y: textBaseline, size: 7.5, font: fontRegular, color: darkColor });
    page.drawText(String(qty), { x: colX.qty + 16, y: textBaseline, size: 7.5, font: fontRegular, color: darkColor });

    const rateStr = `${currencySym}${rate.toLocaleString('en-IN')}`;
    page.drawText(rateStr, { x: colX.amount - fontRegular.widthOfTextAtSize(rateStr, 7) - 6, y: textBaseline, size: 7, font: fontRegular, color: darkColor });

    const amtStr = `${currencySym}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    page.drawText(amtStr, { x: colX.cgst - fontRegular.widthOfTextAtSize(amtStr, 7) - 6, y: textBaseline, size: 7, font: fontRegular, color: darkColor });

    const cgstStr = `${currencySym}${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    page.drawText(cgstStr, { x: colX.sgst - fontRegular.widthOfTextAtSize(cgstStr, 7) - 6, y: textBaseline, size: 7, font: fontRegular, color: darkColor });

    const sgstStr = `${currencySym}${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    page.drawText(sgstStr, { x: colX.total - fontRegular.widthOfTextAtSize(sgstStr, 7) - 6, y: textBaseline, size: 7, font: fontRegular, color: darkColor });

    const totStr = `${currencySym}${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    page.drawText(totStr, { x: colX.end - fontBold.widthOfTextAtSize(totStr, 7) - 4, y: textBaseline, size: 7, font: fontBold, color: darkColor });

    currentY -= rowHeight;
  });

  // Outer border of items table
  page.drawLine({ start: { x: 40, y: tableTopY }, end: { x: 40, y: currentY }, thickness: 0.5, color: borderColor });
  page.drawLine({ start: { x: colX.end, y: tableTopY }, end: { x: colX.end, y: currentY }, thickness: 0.5, color: borderColor });

  // 4. BOTTOM THREE-SECTION FOOTER (Bank Details, UPI QR, Totals & Signature)
  // Ensure comfortable spacing for 1-page fit
  const bottomBoxY = Math.min(currentY - 14, 230);
  const bottomSectionHeight = 165;

  // BLOCK 1: BANK DETAILS (Left)
  const bankCardX = 40;
  const bankCardWidth = 175;
  page.drawRectangle({
    x: bankCardX,
    y: bottomBoxY - bottomSectionHeight,
    width: bankCardWidth,
    height: bottomSectionHeight,
    color: cardBgColor,
    borderColor: borderColor,
    borderWidth: 0.75,
  });

  let bY = bottomBoxY - 16;
  page.drawText('Bank Details', { x: bankCardX + 10, y: bY, size: 9, font: fontBold, color: primaryColor });

  const bk = invoice.bankDetails || {};
  const bankRows = [
    { label: 'Account Name', val: bk.accountName || PAYMENT_DETAILS.accountName },
    { label: 'Account Number', val: bk.accountNumber || PAYMENT_DETAILS.accountNumber },
    { label: 'IFSC', val: bk.ifsc || PAYMENT_DETAILS.ifsc },
    { label: 'Account Type', val: bk.accountType || PAYMENT_DETAILS.accountType },
    { label: 'Bank', val: bk.bankName || bk.bank || PAYMENT_DETAILS.bank },
    { label: 'Branch', val: bk.branch || PAYMENT_DETAILS.branch },
  ];

  bY -= 16;
  bankRows.forEach((r) => {
    page.drawText(r.label, { x: bankCardX + 10, y: bY, size: 6.8, font: fontRegular, color: grayColor });
    page.drawText(r.val, { x: bankCardX + 82, y: bY, size: 6.8, font: fontBold, color: darkColor });
    bY -= 14;
  });

  // BLOCK 2: SCAN TO PAY VIA UPI (Center)
  const upiBoxX = bankCardX + bankCardWidth + 14;
  const upiBoxWidth = 142;
  const upiCenterX = upiBoxX + (upiBoxWidth / 2);

  let upiY = bottomBoxY - 16;
  const scanTitle = invoice.upiInstruction || PAYMENT_DETAILS.scanInstruction;
  page.drawText(scanTitle, {
    x: upiCenterX - (fontBold.widthOfTextAtSize(scanTitle, 8.5) / 2),
    y: upiY,
    size: 8.5,
    font: fontBold,
    color: primaryColor,
  });

  upiY -= 11;
  const upiNotice = invoice.upiNote || PAYMENT_DETAILS.upiNotice || 'Maximum of 1 lakh can be transferred via upi in a single day';
  const noticeLines = upiNotice.split('.').map((s: string) => s.trim()).filter(Boolean);
  if (noticeLines.length === 0) {
    noticeLines.push('Maximum of 1 lakh can', 'be transferred via upi in a', 'single day');
  }
  noticeLines.slice(0, 3).forEach((nl: string) => {
    page.drawText(nl, {
      x: upiCenterX - (fontRegular.widthOfTextAtSize(nl, 5.8) / 2),
      y: upiY,
      size: 5.8,
      font: fontRegular,
      color: lightGrayColor,
    });
    upiY -= 7.5;
  });

  // Embed QR code image
  const qrBytes = await fetchQrImageBytes();
  if (qrBytes) {
    try {
      let qrImg: any = null;
      try {
        qrImg = await pdfDoc.embedPng(qrBytes.slice());
      } catch {
        qrImg = await pdfDoc.embedJpg(qrBytes.slice());
      }
      if (qrImg) {
        const qrSize = 64;
        page.drawImage(qrImg, {
          x: upiCenterX - (qrSize / 2),
          y: upiY - qrSize - 4,
          width: qrSize,
          height: qrSize,
        });
        upiY -= (qrSize + 12);
      }
    } catch (qrErr) {
      console.warn('Could not draw QR in PDF:', qrErr);
    }
  }

  const upiIdStr = invoice.upiId || PAYMENT_DETAILS.upiId;
  page.drawText(upiIdStr, {
    x: upiCenterX - (fontBold.widthOfTextAtSize(upiIdStr, 7.5) / 2),
    y: upiY,
    size: 7.5,
    font: fontBold,
    color: darkColor,
  });

  // BLOCK 3: TOTALS & SIGNATURE (Right)
  const totalsX = upiBoxX + upiBoxWidth + 14;
  const totalsEndValX = colX.end;

  let totY = bottomBoxY - 12;
  const subtotalVal = Number(invoice.subtotal || invoice.total || 0);
  const totalTaxVal = Number(invoice.tax || 0);
  const cgstVal = Number(invoice.cgst ?? (totalTaxVal / 2));
  const sgstVal = Number(invoice.sgst ?? (totalTaxVal / 2));
  const discountVal = Number(invoice.discount || 0);
  const grandTotalVal = Number(invoice.total || (subtotalVal + totalTaxVal - discountVal));
  const paidVal = Number(invoice.paidAmount || 0);
  const balanceVal = Number(invoice.balanceAmount ?? (grandTotalVal - paidVal));

  const drawRow = (label: string, value: string, isBold = false, valColor = darkColor) => {
    const f = isBold ? fontBold : fontRegular;
    page.drawText(label, { x: totalsX, y: totY, size: 7.5, font: f, color: darkColor });
    const valWidth = f.widthOfTextAtSize(value, 7.5);
    page.drawText(value, { x: totalsEndValX - valWidth, y: totY, size: 7.5, font: f, color: valColor });
    totY -= 11.5;
  };

  drawRow('Amount', `${currencySym}${subtotalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  drawRow('CGST', `${currencySym}${cgstVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  drawRow('SGST', `${currencySym}${sgstVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  if (discountVal > 0) {
    drawRow('Discount', `-${currencySym}${discountVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, false, rgb(0.85, 0.15, 0.15));
  }

  // Total (INR) box / border lines matching reference PDF
  totY -= 2;
  page.drawLine({ start: { x: totalsX, y: totY }, end: { x: totalsEndValX, y: totY }, thickness: 0.75, color: borderColor });
  totY -= 12;

  const totalInrLabel = 'Total (INR)';
  const totalInrVal = `${currencySym}${grandTotalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  page.drawText(totalInrLabel, { x: totalsX, y: totY, size: 9.5, font: fontBold, color: primaryColor });
  const inrValWidth = fontBold.widthOfTextAtSize(totalInrVal, 9.5);
  page.drawText(totalInrVal, { x: totalsEndValX - inrValWidth, y: totY, size: 9.5, font: fontBold, color: primaryColor });
  totY -= 5;
  page.drawLine({ start: { x: totalsX, y: totY }, end: { x: totalsEndValX, y: totY }, thickness: 0.75, color: borderColor });

  // Payment tracking lines
  totY -= 11;
  drawRow('Amount Paid', `${currencySym}${paidVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, false, rgb(0.08, 0.55, 0.25));
  drawRow('Balance Due', `${currencySym}${balanceVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, true, rgb(0.85, 0.45, 0.05));
  drawRow('Status', statusLabel, true, statusColor);

  // Authorised Signatory Section
  const sigBytes = getSignatureBytes();
  let sigImg: any = null;
  if (sigBytes) {
    try {
      sigImg = await pdfDoc.embedJpg(sigBytes.slice());
    } catch {
      try {
        sigImg = await pdfDoc.embedPng(sigBytes.slice());
      } catch (err) {
        console.warn('Could not embed signature:', err);
      }
    }
  }

  totY -= 16;
  const sigWidth = 72;
  const sigHeight = 36;
  const sigCenterX = totalsX + ((totalsEndValX - totalsX) / 2);

  if (sigImg) {
    page.drawImage(sigImg, {
      x: sigCenterX - (sigWidth / 2),
      y: totY - sigHeight + 12,
      width: sigWidth,
      height: sigHeight,
    });
  } else {
    // Fallback cursive text
    page.drawText(BILLED_BY_DETAILS.name, {
      x: sigCenterX - (fontOblique.widthOfTextAtSize(BILLED_BY_DETAILS.name, 11) / 2),
      y: totY - 8,
      size: 11,
      font: fontOblique,
      color: darkColor,
    });
  }

  // Underline beneath signature
  const lineW = 96;
  page.drawLine({
    start: { x: sigCenterX - (lineW / 2), y: totY - 14 },
    end: { x: sigCenterX + (lineW / 2), y: totY - 14 },
    thickness: 0.5,
    color: borderColor,
  });

  // Label: "Authorised Signatory"
  const sigLabel = 'Authorised Signatory';
  page.drawText(sigLabel, {
    x: sigCenterX - (fontRegular.widthOfTextAtSize(sigLabel, 7) / 2),
    y: totY - 24,
    size: 7,
    font: fontRegular,
    color: grayColor,
  });

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  // Write file locally / to tmp with standardized naming
  const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
  const dirPath = isVercel
    ? '/tmp/invoices'
    : path.join(process.cwd(), 'public', 'invoices');

  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const activeThemeId = (requestedTheme || invoice.invoiceTheme || 'purple').toLowerCase().trim();
    const themedHyphenPath = path.join(dirPath, `${invoice.invoiceNumber}-${activeThemeId}.pdf`);
    const themedUnderscorePath = path.join(dirPath, `${invoice.invoiceNumber}_${activeThemeId}.pdf`);
    const standardFilePath = path.join(dirPath, `${invoice.invoiceNumber}.pdf`);

    await Promise.all([
      fs.promises.writeFile(themedHyphenPath, pdfBuffer),
      fs.promises.writeFile(themedUnderscorePath, pdfBuffer),
      fs.promises.writeFile(standardFilePath, pdfBuffer)
    ]);
  } catch (writeErr) {
    console.warn('Could not cache invoice PDF to disk:', writeErr);
  }

  return pdfBuffer;
}
