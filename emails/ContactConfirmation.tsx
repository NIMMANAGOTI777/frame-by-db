import React from 'react';

interface ContactConfirmationProps {
  name: string;
}

export default function ContactConfirmation({ name }: ContactConfirmationProps) {
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
            Inquiry Received
          </p>
        </div>

        {/* Content */}
        <div style={{ marginBottom: '30px' }}>
          <p style={{ fontSize: '15px', color: '#ffffff', margin: '0 0 15px 0', fontWeight: '500' }}>
            Hi {name},
          </p>
          
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#cccccc', margin: '0 0 15px 0' }}>
            Thank you for contacting Frame by DB.
          </p>

          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#cccccc', margin: '0 0 15px 0' }}>
            We have received your inquiry and our team will review it shortly. We usually respond within 24 hours to set up an initial creative consultation.
          </p>

          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#cccccc', margin: '0 0 30px 0' }}>
            If you have any urgent updates or additional event details to share, feel free to reply directly to this email or connect with us on WhatsApp.
          </p>

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
