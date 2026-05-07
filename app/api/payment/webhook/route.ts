import { NextRequest, NextResponse } from 'next/server';
import { handleSuccessfulPayment } from '@/lib/services/paymentService';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest('hex');

    // Verify the request actually came from Paystack
    if (hash !== req.headers.get('x-paystack-signature')) {
      console.warn('[Webhook] Invalid signature — possible spoofed request');
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);

    // Only process successful charges
    if (event.event === 'charge.success') {
      console.log('[Webhook] charge.success received for reference:', event.data?.reference);
      await handleSuccessfulPayment(event.data);
    }

    // Always return 200 so Paystack does not retry.
    // Any processing errors are caught below and logged — we still return 200
    // to prevent Paystack from firing the webhook again and double-crediting.
    return new NextResponse('Webhook Received', { status: 200 });
  } catch (err: any) {
    console.error('[Webhook] Unhandled error:', {
      message: err.message,
      stack: err.stack,
    });
    // Return 200 even on error to prevent Paystack retries.
    // The idempotency check in handleSuccessfulPayment prevents double-processing
    // if a retry does slip through.
    return new NextResponse('Webhook Received', { status: 200 });
  }
}