import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Funkcia pre lazy inicializáciu Resend klienta
// (inicializuje sa až pri použití, nie pri importe)
function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

// Email template komponenta
const ContactFormEmail = ({
  name,
  email,
  city,
  taxiName,
  message,
}: {
  name: string;
  email: string;
  city: string;
  taxiName: string;
  message: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .field { margin-bottom: 20px; }
    .field-label { font-weight: bold; color: #667eea; margin-bottom: 5px; }
    .field-value { background: white; padding: 10px; border-radius: 5px; border-left: 3px solid #667eea; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 2px solid #e0e0e0; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚕 Nový príspevok z Taxi NearMe</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">Niečo tu chýba - Kontaktný formulár</p>
    </div>
    <div class="content">
      <div class="field">
        <div class="field-label">👤 Meno odosielateľa:</div>
        <div class="field-value">${name}</div>
      </div>

      <div class="field">
        <div class="field-label">📧 Email odosielateľa:</div>
        <div class="field-value"><a href="mailto:${email}">${email}</a></div>
      </div>

      <div class="field">
        <div class="field-label">🏙️ Mesto:</div>
        <div class="field-value">${city}</div>
      </div>

      <div class="field">
        <div class="field-label">🚖 Názov taxislužby:</div>
        <div class="field-value">${taxiName}</div>
      </div>

      <div class="field">
        <div class="field-label">💬 Správa / Údaje na doplnenie:</div>
        <div class="field-value">${message.replace(/\n/g, '<br>')}</div>
      </div>

      <div class="footer">
        <p>Tento email bol odoslaný z kontaktného formulára na <strong>taxinearme.sk</strong></p>
        <p>Môžete odpovedať priamo na email odosielateľa: ${email}</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export async function POST(request: NextRequest) {
  try {
    // Kontrola API kľúča
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      );
    }

    // Parsovanie form data
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const city = formData.get('city') as string;
    const taxiName = formData.get('taxiName') as string;
    const message = formData.get('message') as string;

    // Validácia povinných polí
    if (!name || !email || !city || !taxiName || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validácia email formátu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Odoslanie emailu cez Resend
    const resend = getResendClient();
    const { data, error: resendError } = await resend.emails.send({
      from: 'Taxi NearMe <noreply@taxinearme.sk>', // Toto bude potrebné zmeniť po nastavení vlastnej domény v Resend
      to: ['info@taxinearme.sk'],
      replyTo: email, // Umožní priamu odpoveď na email odosielateľa
      subject: `Nový príspevok z Taxi NearMe - ${city} - ${taxiName}`,
      html: ContactFormEmail({ name, email, city, taxiName, message }),
    });

    // Kontrola chyby od Resend
    if (resendError) {
      console.error('Resend API error:', resendError);
      return NextResponse.json(
        {
          error: 'Failed to send email',
          details: process.env.NODE_ENV === 'development' ? resendError.message : undefined,
        },
        { status: 500 }
      );
    }

    // Logovanie úspechu
    console.log('Email sent successfully:', {
      id: data?.id,
      from: email,
      city,
      taxiName,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email sent successfully',
        id: data?.id,
      },
      { status: 200 }
    );
  } catch (error) {
    // Error handling a logovanie
    console.error('Error sending email:', error);

    // Detailnejšie error handling pre Resend errors
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Failed to send email',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
