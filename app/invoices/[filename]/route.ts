import { connectToDatabase } from '@/lib/mongodb';
import { Invoice, Setting, Booking } from '@/lib/models';
import { generateInvoicePDF } from '@/lib/utils/generateInvoicePDF';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  props: { params: Promise<{ filename: string }> }
) {
  try {
    const params = await props.params;
    const { filename } = params;

    if (!filename.toLowerCase().endsWith('.pdf')) {
      return new Response('Not Found', { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const queryTheme = searchParams.get('theme')?.toLowerCase().trim();

    // Strip .pdf
    const rawName = filename.substring(0, filename.length - 4);
    
    // Check if filename has theme suffix e.g. DB056-blue or DB056_blue
    const themePattern = /^(.+?)[-_](purple|blue|green|orange|red|black|teal|minimal)$/i;
    const themeMatch = rawName.match(themePattern);
    const parsedInvoiceNumber = themeMatch ? themeMatch[1] : rawName;
    const parsedFileTheme = themeMatch ? themeMatch[2].toLowerCase() : null;

    await connectToDatabase();

    // Look up invoice by parsed invoice number, fallback to rawName
    let invoice = await Invoice.findOne({ invoiceNumber: parsedInvoiceNumber })
      .populate('clientId')
      .populate('bookingId');

    if (!invoice && parsedInvoiceNumber !== rawName) {
      invoice = await Invoice.findOne({ invoiceNumber: rawName })
        .populate('clientId')
        .populate('bookingId');
    }

    if (!invoice || !invoice.clientId) {
      return new Response('Invoice not found in database', { status: 404 });
    }

    // Determine active theme
    const activeTheme = queryTheme || parsedFileTheme || invoice.invoiceTheme || 'purple';

    // ALWAYS dynamically generate the PDF directly from the latest MongoDB data
    // This completely prevents the stale PDF cache bug when payments or items change
    const settings = (await Setting.findOne()) || {};
    const pdfBuffer = await generateInvoicePDF(
      invoice,
      invoice.clientId,
      invoice.items || [],
      invoice.bookingId,
      settings,
      activeTheme
    );

    const downloadFilename = `${invoice.invoiceNumber}-${activeTheme}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${downloadFilename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('Dynamic PDF server error:', error);
    return new Response(`Failed to serve PDF: ${error.message}`, { status: 500 });
  }
}
