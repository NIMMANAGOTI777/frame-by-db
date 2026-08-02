import React from 'react';

interface InvoiceNotificationProps {
  clientName: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: string;
}

export default function InvoiceNotification({
  clientName,
  invoiceNumber,
  totalAmount,
  dueDate,
}: InvoiceNotificationProps) {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      backgroundColor: '#111111',
      color: '#ffffff',
      padding: '40px 20px',
      margin: '0',
      width: '100%',
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#0a0a0a',
        border: '1px solid #D4AF37',
        borderRadius: '0px',
        padding: '30px',
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          borderBottom: '1px solid #D4AF37',
          paddingBottom: '20px',
          marginBottom: '30px',
        }}>
          <h1 style={{
            fontSize: '18px',
            color: '#D4AF37',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            margin: '0 0 10px 0',
            fontWeight: '300',
          }}>
            Frame by DB
          </h1>
          <p style={{
            fontSize: '12px',
            color: '#888888',
            margin: '0',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            New Invoice Generated
          </p>
        </div>

        {/* Content */}
        <div style={{ marginBottom: '30px' }}>
          <p style={{ fontSize: '15px', color: '#ffffff', margin: '0 0 15px 0', fontWeight: '500' }}>
            Hi {clientName},
          </p>
          
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#cccccc', margin: '0 0 15px 0' }}>
            An invoice has been generated for your booking with Frame by DB. Please find the details below and the invoice PDF attached to this email.
          </p>

          <div style={{
            backgroundColor: '#111111',
            borderLeft: '3px solid #D4AF37',
            padding: '15px',
            margin: '20px 0',
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#888888' }}>
              <strong>Invoice Number:</strong> <span style={{ color: '#ffffff' }}>{invoiceNumber}</span>
            </p>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#888888' }}>
              <strong>Total Amount:</strong> <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
            </p>
            <p style={{ margin: '0', fontSize: '13px', color: '#888888' }}>
              <strong>Due Date:</strong> <span style={{ color: '#ffffff' }}>{dueDate}</span>
            </p>
          </div>

          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#cccccc', margin: '0 0 20px 0' }}>
            You can also log in to the Client Portal using your private event access key to view your invoices, download receipts, review your event timeline, and pay online.
          </p>

          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <a href={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/client-portal`} style={{
              display: 'inline-block',
              backgroundColor: '#D4AF37',
              color: '#111111',
              textDecoration: 'none',
              padding: '12px 30px',
              fontSize: '12px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              Access Client Portal
            </a>
          </div>

          <div style={{
            borderTop: '1px solid #222222',
            paddingTop: '20px',
            fontSize: '14px',
            color: '#888888',
          }}>
            <p style={{ margin: '0 0 5px 0', color: '#ffffff', fontWeight: 'bold' }}>Regards,</p>
            <p style={{ margin: '0', color: '#D4AF37', fontWeight: '500' }}>Dasari Bharadwaj</p>
            <p style={{ margin: '0', fontSize: '12px', color: '#666666' }}>Director of Photography | Frame by DB</p>
            <p style={{ margin: '0', fontSize: '12px', color: '#666666' }}>Hyderabad, India</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          borderTop: '1px solid #222222',
          paddingTop: '20px',
          fontSize: '11px',
          color: '#555555',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          © {new Date().getFullYear()} Frame by DB. All rights reserved.
        </div>
      </div>
    </div>
  );
}
