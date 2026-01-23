import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

const MIN_AMOUNT = 100; // 1.00 EUR v centoch
const MAX_AMOUNT = 50000; // 500.00 EUR v centoch
const PRODUCT_ID = 'prod_TqQEeWQAlC24oD';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suma, poznamka } = body;

    // Validácia sumy
    if (!suma || typeof suma !== 'number') {
      return NextResponse.json(
        { error: 'Suma je povinná' },
        { status: 400 }
      );
    }

    const amountCents = Math.round(suma * 100);

    if (amountCents < MIN_AMOUNT) {
      return NextResponse.json(
        { error: 'Minimálna suma je 1 EUR' },
        { status: 400 }
      );
    }

    if (amountCents > MAX_AMOUNT) {
      return NextResponse.json(
        { error: 'Maximálna suma je 500 EUR' },
        { status: 400 }
      );
    }

    // Vytvorenie Checkout Session pre jednorazovú platbu
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product: PRODUCT_ID,
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      // Metadata pre evidenciu
      payment_intent_data: {
        metadata: {
          typ: 'taxi-platba',
          poznamka: poznamka?.trim() || '',
        },
      },
      // URLs
      success_url: `${getBaseUrl(request)}/taxi-platba/success`,
      cancel_url: `${getBaseUrl(request)}/taxi-platba`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('Taxi platba error:', error);
    return NextResponse.json(
      { error: 'Nepodarilo sa vytvoriť platbu' },
      { status: 500 }
    );
  }
}

function getBaseUrl(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}
