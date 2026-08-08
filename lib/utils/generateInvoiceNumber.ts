import { Invoice } from '@/lib/models';

export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  try {
    const latest = await Invoice.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let nextNum = 1;
    if (latest && latest.invoiceNumber) {
      const parts = latest.invoiceNumber.split('-');
      if (parts.length === 3 && parts[1] === String(year)) {
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed)) {
          nextNum = parsed + 1;
        }
      }
    }
    const nextNumber = String(nextNum).padStart(6, '0');
    return `INV-${year}-${nextNumber}`;
  } catch (error) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `INV-${year}-${randomSuffix}`;
  }
}
