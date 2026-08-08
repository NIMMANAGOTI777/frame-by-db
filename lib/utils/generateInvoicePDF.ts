import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

export async function generateInvoicePDF(
  invoice: any,
  client: any,
  items: any[],
  booking?: any,
  settings?: any
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();

  // Load fonts safely
  let fontHelvetica: any;
  let fontHelveticaBold: any;
  try {
    const regularFontBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf'));
    const boldFontBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf'));
    fontHelvetica = await pdfDoc.embedFont(regularFontBytes);
    fontHelveticaBold = await pdfDoc.embedFont(boldFontBytes);
  } catch (err) {
    fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const goldColor = rgb(0.83, 0.69, 0.22); // #D4AF37
  const darkColor = rgb(0.1, 0.1, 0.1);
  const grayColor = rgb(0.4, 0.4, 0.4);
  const lightGrayColor = rgb(0.95, 0.95, 0.95);
  const borderGrayColor = rgb(0.85, 0.85, 0.85);

  let y = height - 50;

  page.drawRectangle({
    x: 40,
    y: y - 5,
    width: width - 80,
    height: 3,
    color: goldColor,
  });

  const businessName = settings?.businessName || 'FRAME BY DB';
  const founderName = settings?.founderName || 'Dasari Bharadwaj';

  page.drawText(businessName, {
    x: 40,
    y: y - 25,
    size: 20,
    font: fontHelveticaBold,
    color: darkColor,
  });

  page.drawText(founderName, {
    x: 40,
    y: y - 38,
    size: 9,
    font: fontHelvetica,
    color: goldColor,
  });

  page.drawText('INVOICE', {
    x: width - 180,
    y: y - 25,
    size: 22,
    font: fontHelveticaBold,
    color: darkColor,
  });

  const formatDate = (dateInput: any) => {
    if (!dateInput) return 'N/A';
    if (dateInput instanceof Date) {
      return dateInput.toISOString().split('T')[0];
    }
    if (typeof dateInput === 'string') {
      return dateInput.split('T')[0];
    }
    return String(dateInput);
  };

  const metaY = y - 48;
  page.drawText(`Invoice No:  ${invoice.invoiceNumber}`, { x: width - 180, y: metaY, size: 9, font: fontHelveticaBold, color: darkColor });
  page.drawText(`Date:          ${formatDate(invoice.issueDate)}`, { x: width - 180, y: metaY - 14, size: 9, font: fontHelvetica, color: grayColor });
  page.drawText(`Due Date:    ${formatDate(invoice.dueDate)}`, { x: width - 180, y: metaY - 28, size: 9, font: fontHelvetica, color: grayColor });
  page.drawText(`Status:        ${(invoice.status || 'Draft').toUpperCase()}`, { x: width - 180, y: metaY - 42, size: 9, font: fontHelveticaBold, color: invoice.status === 'Paid' ? rgb(0.1, 0.6, 0.1) : goldColor });

  y -= 90;

  page.drawLine({
    start: { x: 40, y: y },
    end: { x: width - 40, y: y },
    thickness: 0.5,
    color: borderGrayColor,
  });

  y -= 25;

  page.drawText('BILL TO:', { x: 40, y: y, size: 9, font: fontHelveticaBold, color: goldColor });
  page.drawText(client.name || 'Client Name', { x: 40, y: y - 14, size: 10, font: fontHelveticaBold, color: darkColor });
  if (client.companyName) {
    page.drawText(client.companyName, { x: 40, y: y - 26, size: 9, font: fontHelvetica, color: darkColor });
  }
  const clientAddrY = client.companyName ? y - 38 : y - 26;
  page.drawText(client.email || '', { x: 40, y: clientAddrY, size: 9, font: fontHelvetica, color: grayColor });
  page.drawText(client.phone || '', { x: 40, y: clientAddrY - 12, size: 9, font: fontHelvetica, color: grayColor });

  const compX = width - 240;
  page.drawText('FROM:', { x: compX, y: y, size: 9, font: fontHelveticaBold, color: goldColor });
  page.drawText(businessName, { x: compX, y: y - 14, size: 10, font: fontHelveticaBold, color: darkColor });
  page.drawText(settings?.phone || '', { x: compX, y: y - 26, size: 9, font: fontHelvetica, color: grayColor });
  page.drawText(settings?.email || '', { x: compX, y: y - 38, size: 9, font: fontHelvetica, color: grayColor });
  page.drawText(settings?.location || 'Hyderabad, India', { x: compX, y: y - 50, size: 9, font: fontHelvetica, color: grayColor });

  y -= 90;

  if (booking) {
    page.drawRectangle({
      x: 40,
      y: y - 45,
      width: width - 80,
      height: 40,
      color: lightGrayColor,
    });
    page.drawText('PROJECT DETAILS:', { x: 50, y: y - 15, size: 8, font: fontHelveticaBold, color: goldColor });
    page.drawText(`Event: ${booking.eventType || 'N/A'} | Date: ${formatDate(booking.date)} | Venue: ${booking.location || 'N/A'}`, {
      x: 50,
      y: y - 30,
      size: 9,
      font: fontHelvetica,
      color: darkColor,
    });
    y -= 60;
  } else {
    y -= 10;
  }

  const colX = [40, 320, 400, 500];

  page.drawRectangle({
    x: 40,
    y: y - 18,
    width: width - 80,
    height: 18,
    color: goldColor,
  });

  page.drawText('Item & Description', { x: colX[0] + 5, y: y - 12, size: 8, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  page.drawText('Qty', { x: colX[1], y: y - 12, size: 8, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  page.drawText('Unit Price', { x: colX[2], y: y - 12, size: 8, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  page.drawText('Total Amount', { x: colX[3], y: y - 12, size: 8, font: fontHelveticaBold, color: rgb(1, 1, 1) });

  y -= 18;

  items.forEach((item, index) => {
    if (index % 2 === 1) {
      page.drawRectangle({
        x: 40,
        y: y - 28,
        width: width - 80,
        height: 28,
        color: lightGrayColor,
      });
    }

    page.drawLine({
      start: { x: 40, y: y - 28 },
      end: { x: width - 40, y: y - 28 },
      thickness: 0.5,
      color: borderGrayColor,
    });

    page.drawText(item.serviceName || 'Service', { x: colX[0] + 5, y: y - 12, size: 9, font: fontHelveticaBold, color: darkColor });
    if (item.description) {
      const descText = item.description.length > 55 ? item.description.substring(0, 52) + '...' : item.description;
      page.drawText(descText, { x: colX[0] + 5, y: y - 22, size: 7, font: fontOblique, color: grayColor });
    }

    page.drawText(String(item.quantity || 1), { x: colX[1] + 5, y: y - 15, size: 9, font: fontHelvetica, color: darkColor });
    page.drawText(`₹${Number(item.price || 0).toLocaleString('en-IN')}`, { x: colX[2], y: y - 15, size: 9, font: fontHelvetica, color: darkColor });
    page.drawText(`₹${Number(item.total || 0).toLocaleString('en-IN')}`, { x: colX[3], y: y - 15, size: 9, font: fontHelveticaBold, color: darkColor });

    y -= 28;
  });

  y -= 15;

  const summaryX = width - 240;
  const summaryValX = width - 100;

  const drawSummaryLine = (label: string, value: number, isBold = false) => {
    const currentFont = isBold ? fontHelveticaBold : fontHelvetica;
    page.drawText(label, { x: summaryX, y, size: 9, font: currentFont, color: isBold ? darkColor : grayColor });
    page.drawText(`₹${Math.round(value || 0).toLocaleString('en-IN')}`, {
      x: summaryValX,
      y,
      size: 9,
      font: currentFont,
      color: isBold ? goldColor : darkColor,
    });
    y -= 14;
  };

  drawSummaryLine('Subtotal:', invoice.subtotal || 0);
  if (invoice.tax > 0) {
    drawSummaryLine('GST:', invoice.tax);
  }
  if (invoice.discount > 0) {
    drawSummaryLine('Discount:', invoice.discount);
  }

  y -= 4;
  page.drawLine({
    start: { x: summaryX, y },
    end: { x: width - 40, y },
    thickness: 0.75,
    color: darkColor,
  });
  y -= 12;

  drawSummaryLine('Grand Total:', invoice.total || 0, true);
  drawSummaryLine('Amount Paid:', invoice.paidAmount || 0);

  y -= 4;
  page.drawLine({
    start: { x: summaryX, y },
    end: { x: width - 40, y },
    thickness: 0.5,
    color: borderGrayColor,
  });
  y -= 12;

  drawSummaryLine('Balance Due:', invoice.balanceAmount || 0, true);

  y = 170;

  page.drawLine({
    start: { x: 40, y: y + 10 },
    end: { x: width - 40, y: y + 10 },
    thickness: 0.5,
    color: borderGrayColor,
  });

  page.drawText('PAYMENT INFORMATION:', { x: 40, y, size: 8, font: fontHelveticaBold, color: goldColor });

  const bankY = y - 12;
  page.drawText(`Account Holder: ${founderName}`, { x: 40, y: bankY, size: 7.5, font: fontHelvetica, color: darkColor });
  page.drawText(`Bank Name:      ${settings?.bankName || 'HDFC Bank'}`, { x: 40, y: bankY - 10, size: 7.5, font: fontHelvetica, color: darkColor });
  page.drawText(`Account Number: ${settings?.accountNumber || 'N/A'}`, { x: 40, y: bankY - 20, size: 7.5, font: fontHelvetica, color: darkColor });
  page.drawText(`IFSC Code:      ${settings?.ifscCode || 'N/A'}`, { x: 40, y: bankY - 30, size: 7.5, font: fontHelvetica, color: darkColor });
  page.drawText(`UPI ID:         ${settings?.upiId || 'N/A'}`, { x: 40, y: bankY - 40, size: 7.5, font: fontHelveticaBold, color: darkColor });

  const sigX = width - 160;
  page.drawText('AUTHORIZED SIGNATORY:', { x: sigX, y, size: 8, font: fontHelveticaBold, color: goldColor });

  page.drawText(founderName, {
    x: sigX + 10,
    y: y - 25,
    size: 16,
    font: fontOblique,
    color: darkColor,
  });

  page.drawLine({
    start: { x: sigX, y: y - 32 },
    end: { x: sigX + 120, y: y - 32 },
    thickness: 0.5,
    color: borderGrayColor,
  });
  page.drawText('Founder & Lead Photographer', { x: sigX, y: y - 42, size: 7.5, font: fontHelvetica, color: grayColor });

  const footerY = 50;
  page.drawLine({
    start: { x: 40, y: footerY + 20 },
    end: { x: width - 40, y: footerY + 20 },
    thickness: 0.5,
    color: borderGrayColor,
  });

  page.drawText('TERMS & CONDITIONS:', { x: 40, y: footerY + 10, size: 7, font: fontHelveticaBold, color: grayColor });
  page.drawText('1. Payment of the balance due is required as per the contract timeline.', { x: 40, y: footerY + 2, size: 6.5, font: fontHelvetica, color: grayColor });
  page.drawText('2. All video/photo deliverables remain copyrighted by Frame by DB until full clearance.', { x: 40, y: footerY - 6, size: 6.5, font: fontHelvetica, color: grayColor });

  page.drawText('Thank you for your business!', {
    x: width - 160,
    y: footerY + 6,
    size: 9,
    font: fontOblique,
    color: goldColor,
  });

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
  const dirPath = isVercel
    ? '/tmp/invoices'
    : path.join(process.cwd(), 'public', 'invoices');

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  const filePath = path.join(dirPath, `${invoice.invoiceNumber}.pdf`);
  await fs.promises.writeFile(filePath, pdfBuffer);

  return pdfBuffer;
}
