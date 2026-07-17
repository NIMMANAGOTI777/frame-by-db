import React from 'react';

interface BookingNotificationProps {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  location: string;
  budget: string;
  message: string;
  date: string;
}

export default function BookingNotification({
  name,
  email,
  phone,
  eventType,
  eventDate,
  location,
  budget,
  message,
  date,
}: BookingNotificationProps) {
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
            New Booking Request 🎉
          </p>
        </div>

        {/* Content */}
        <div style={{ marginBottom: '30px' }}>
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#cccccc', margin: '0 0 20px 0' }}>
            A client has submitted a session booking request.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '12px', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '1px', width: '120px', fontWeight: 'bold' }}>Client:</td>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#ffffff' }}>{name}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '12px', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Email:</td>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#ffffff' }}>
                  <a href={`mailto:${email}`} style={{ color: '#D4AF37', textDecoration: 'none' }}>{email}</a>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '12px', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Phone:</td>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#ffffff' }}>
                  <a href={`tel:${phone}`} style={{ color: '#ffffff', textDecoration: 'none' }}>{phone}</a>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '12px', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Event:</td>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#ffffff', fontWeight: '500' }}>{eventType}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '12px', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Date:</td>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#ffffff' }}>{eventDate}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '12px', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Location:</td>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#ffffff' }}>{location}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '12px', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Budget:</td>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#D4AF37', fontWeight: 'bold' }}>{budget}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '12px', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Submitted:</td>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#888888' }}>{date}</td>
              </tr>
            </tbody>
          </table>

          {message && (
            <div style={{
              marginTop: '25px',
              padding: '20px',
              backgroundColor: '#111111',
              borderLeft: '2px solid #D4AF37',
            }}>
              <p style={{ fontSize: '12px', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0', fontWeight: 'bold' }}>Message / Requirements:</p>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#dddddd', margin: '0', whiteSpace: 'pre-wrap' }}>{message}</p>
            </div>
          )}
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
