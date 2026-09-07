export const PAYMENT_DETAILS = {
  accountName: 'Dasari Bharadwaj',
  accountNumber: '36300863175',
  ifsc: 'SBIN0018857',
  accountType: 'Savings',
  bank: 'State Bank',
  branch: 'Mudigubba',
  upiId: 'dasaribharadwaj@ybl',
  upiNotice: 'Maximum of 1 lakh can be transferred via upi in a single day',
  scanInstruction: 'Scan to pay via UPI',
  qrCodeUrl: 'https://res.cloudinary.com/do4nuj2kh/image/upload/v1788764321/cfd483f1-1d47-42dc-a45d-4984ec18bb57_ka98b0.png',
  instructions: 'Scan the QR code or use the bank details above to complete your payment.',
  postPaymentNote: 'After payment, please share the payment confirmation with Frame by DB.'
};

export const BILLED_BY_DETAILS = {
  name: 'Dasari Bharadwaj',
  addressLine1: '8-3-228/112/4A, Yousufguda, Hyderabad',
  city: 'Hyderabad',
  stateZip: 'Telangana, India - 500045',
  pan: 'BZUPB1327D',
  email: 'dopdasari@gmail.com',
  phone: '+91 88850 60808'
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
