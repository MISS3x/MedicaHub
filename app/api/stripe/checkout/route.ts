
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

// Initialize Stripe inside handler to avoid build-time errors if env vars are missing
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, ...);

export async function POST(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { priceId } = await req.json();

        if (!priceId) {
            return new NextResponse('Price ID is required', { status: 400 });
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            // @ts-ignore
            apiVersion: '2025-01-27.acacia',
        });


        // Determine mode and metadata based on Price ID
        let mode: Stripe.Checkout.SessionCreateParams.Mode = 'payment';
        let metadata = {};

        if (priceId === 'price_1SwVthEkWRb0lr92TGxTjKaQ') {
            mode = 'subscription';
            metadata = {
                product_type: 'subscription',
                userId: user.id
            };
        } else if (priceId === 'price_1SwVvCEkWRb0lr92lpwHLHD1') {
            mode = 'payment';
            metadata = {
                product_type: 'credits',
                credits_amount: '500',
                userId: user.id
            };
        } else {
            // Fallback or error if unknown price
            return new NextResponse('Invalid Price ID', { status: 400 });
        }

        // Determine Base URL
        let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) {
            // Vercel automatically sets VERCEL_URL but without protocol
            if (process.env.VERCEL_URL) {
                baseUrl = `https://${process.env.VERCEL_URL}`;
            } else {
                baseUrl = 'http://localhost:3000';
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: mode,
            success_url: `${baseUrl}/settings?success=true`,
            cancel_url: `${baseUrl}/settings?canceled=true`,
            client_reference_id: user.id,
            metadata: metadata,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('Stripe Checkout Error:', err);
        return new NextResponse(err.message || 'Internal Server Error', { status: 500 });
    }
}
