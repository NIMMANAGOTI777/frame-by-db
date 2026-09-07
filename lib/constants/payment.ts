export const PAYMENT_DETAILS = {
  accountName: 'Dasari Bharadwaj',
  accountNumber: '36300863175',
  ifsc: 'SBIN0018857',
  accountType: 'Savings',
  bank: 'State Bank of India',
  branch: 'Mudigubba',
  qrCodeUrl: 'https://res.cloudinary.com/do4nuj2kh/image/upload/v1788762025/WhatsApp_Image_2026-09-07_at_11.49.03_AM_npr4oq.jpg',
  instructions: 'Scan the QR code or use the bank details above to complete your payment.',
  postPaymentNote: 'After payment, please share the payment confirmation with Frame by DB.'
};

export type PaymentStatusType = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export const PAYMENT_METHODS = ['UPI', 'Bank Transfer', 'Cash', 'Other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function computeInvoicePaymentStatus(invoice: {
  total: number;
  paidAmount?: number;
  dueDate?: Date | string;
  status?: string;
}): PaymentStatusType {
  const total = Number(invoice.total || 0);
  const paid = Number(invoice.paidAmount || 0);

  if (total > 0 && paid >= total) {
    return 'PAID';
  }

  if (paid > 0 && paid < total) {
    return 'PARTIALLY_PAID';
  }

  if (invoice.dueDate) {
    const dueDate = new Date(invoice.dueDate);
    if (!isNaN(dueDate.getTime()) && dueDate.getTime() < Date.now()) {
      return 'OVERDUE';
    }
  }

  return 'PENDING';
}

export function formatPaymentStatusLabel(status: string | PaymentStatusType): string {
  const normalized = (status || '').toUpperCase().replace(/[\s_-]+/g, '_');
  switch (normalized) {
    case 'PAID':
      return 'PAID';
    case 'PARTIALLY_PAID':
    case 'PARTIAL':
      return 'PARTIALLY PAID';
    case 'OVERDUE':
      return 'OVERDUE';
    case 'PENDING':
    case 'DRAFT':
    case 'SENT':
    default:
      return 'PENDING';
  }
}
