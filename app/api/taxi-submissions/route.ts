import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { escapeHtml, escapeHtmlWithBreaks } from '@/lib/html-escape';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// Zod schéma pre validáciu
const submissionSchema = z.object({
  citySlug: z.string().min(1, 'Mesto je povinné'),
  cityName: z.string().min(1, 'Názov mesta je povinný'),
  name: z.string().min(2, 'Názov taxislužby musí mať aspoň 2 znaky').max(200),
  phone: z.string().min(9, 'Telefónne číslo musí mať aspoň 9 znakov').max(20),
  description: z.string().max(2000).optional(),
  ico: z.string().min(6, 'IČO musí mať aspoň 6 znakov').max(20),
});

// Lazy init Resend
function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

// Email template
const SubmissionEmail = ({
  cityName,
  citySlug,
  name,
  phone,
  description,
  ico,
}: {
  cityName: string;
  citySlug: string;
  name: string;
  phone: string;
  description?: string;
  ico: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .field { margin-bottom: 20px; }
    .field-label { font-weight: bold; color: #059669; margin-bottom: 5px; }
    .field-value { background: white; padding: 10px; border-radius: 5px; border-left: 3px solid #10b981; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 2px solid #e0e0e0; font-size: 12px; color: #666; }
    .cta { display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚕 Nový návrh taxislužby</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">Používateľ navrhol pridanie taxislužby</p>
    </div>
    <div class="content">
      <div class="field">
        <div class="field-label">🏙️ Mesto:</div>
        <div class="field-value">${escapeHtml(cityName)}</div>
      </div>

      <div class="field">
        <div class="field-label">🚖 Názov taxislužby:</div>
        <div class="field-value"><strong>${escapeHtml(name)}</strong></div>
      </div>

      <div class="field">
        <div class="field-label">📞 Telefónne číslo:</div>
        <div class="field-value"><a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></div>
      </div>

      <div class="field">
        <div class="field-label">🏢 IČO:</div>
        <div class="field-value">${escapeHtml(ico)}</div>
      </div>

      ${description ? `
      <div class="field">
        <div class="field-label">📝 Popis:</div>
        <div class="field-value">${escapeHtmlWithBreaks(description)}</div>
      </div>
      ` : ''}

      <a href="https://taxinearme.sk/admin/taxi-submissions" class="cta">
        Schváliť v admin paneli →
      </a>

      <div class="footer">
        <p>Tento email bol vygenerovaný automaticky z <strong>taxinearme.sk</strong></p>
        <p>Mesto: <a href="https://taxinearme.sk/taxi/${escapeHtml(citySlug)}">${escapeHtml(cityName)}</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// POST - vytvorenie nového návrhu
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const log = logger.with({ endpoint: 'taxi-submissions' });

  try {
    const body = await request.json();

    // Validácia
    const validationResult = submissionSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { citySlug, cityName, name, phone, description, ico } = validationResult.data;

    // Uloženie do databázy
    const supabase = await createClient();
    const { data: submission, error: dbError } = await supabase
      .from('taxi_submissions')
      .insert({
        city_slug: citySlug,
        city_name: cityName,
        name,
        phone,
        description: description || null,
        ico,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      log.error('Database error', { error: dbError.message });
      await logger.flush();
      return NextResponse.json(
        { error: 'Nepodarilo sa uložiť návrh' },
        { status: 500 }
      );
    }

    // Odoslanie email notifikácie
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = getResendClient();
        const recipientEmail = process.env.CONTACT_EMAIL || 'info@taxinearme.sk';
        const fromEmail = process.env.FROM_EMAIL || 'noreply@taxinearme.sk';

        await resend.emails.send({
          from: `Taxi NearMe <${fromEmail}>`,
          to: [recipientEmail],
          subject: `🚕 Nový návrh taxislužby: ${name} (${cityName})`,
          html: SubmissionEmail({ cityName, citySlug, name, phone, description, ico }),
        });
      } catch (emailError) {
        // Email zlyhanie neblokuje úspešnú odpoveď
        log.error('Email notification failed', {
          error: emailError instanceof Error ? emailError.message : 'Unknown',
        });
      }
    }

    const duration = Date.now() - startTime;
    log.info('Taxi submission created', {
      submissionId: submission.id,
      citySlug,
      name,
      duration,
    });
    await logger.flush();

    return NextResponse.json({
      success: true,
      message: 'Návrh bol úspešne odoslaný',
      id: submission.id,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error('Taxi submission error', {
      error: error instanceof Error ? error.message : 'Unknown',
      duration,
    });
    await logger.flush();

    return NextResponse.json(
      { error: 'Nastala neočakávaná chyba' },
      { status: 500 }
    );
  }
}

// GET - získanie návrhov (iba pre adminov)
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('taxi_submissions')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submissions: data });
}

// PATCH - aktualizácia statusu (schválenie/odmietnutie)
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, status, notes } = body;

  if (!id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('taxi_submissions')
    .update({
      status,
      notes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.username,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, submission: data });
}
