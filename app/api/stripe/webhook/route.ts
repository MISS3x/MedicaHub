
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';


export async function POST(req: Request) {
    try {
        console.log('Webhook started');

        // 1. Env Check
        if (!process.env.STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY');
        if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('Missing STRIPE_WEBHOOK_SECRET');
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

        // 2. Init Clients
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            // @ts-ignore
            apiVersion: '2025-01-27.acacia',
        });

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 3. Parse Request
        const body = await req.text();
        const signature = headers().get('Stripe-Signature');

        if (!signature) throw new Error('Missing Stripe-Signature header');

        // 4. Verify Signature
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err: any) {
            console.error(`Webhook Signature Error: ${err.message}`);
            return new NextResponse(`Webhook Signature Error: ${err.message}`, { status: 400 });
        }

        console.log('Event Type:', event.type);

        // 5. Handle Event
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const metadata = session.metadata || {};
            const userId = session.client_reference_id;

            console.log('Processing session for user:', userId);

            if (!userId) {
                return new NextResponse('Missing userId in session', { status: 400 });
            }

            // Fetch profile
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('organization_id')
                .eq('id', userId)
                .single();

            if (profileError || !profile?.organization_id) {
                console.error('Profile lookup failed:', profileError);
                return new NextResponse(`Profile lookup failed: ${profileError?.message || 'No org id'}`, { status: 500 });
            }

            const orgId = profile.organization_id;
            console.log('Found Org ID:', orgId);

            if (metadata.product_type === 'credits') {
                const amount = parseInt(metadata.credits_amount || '0');
                console.log('Adding credits:', amount);

                const { data: org, error: readError } = await supabaseAdmin.from('organizations').select('credits').eq('id', orgId).single();

                if (readError) {
                    // Check if error is "column doesn't exist" or similar
                    throw new Error('Org read failed (check if credits column exists): ' + readError.message);
                }

                const newCredits = (org.credits || 0) + amount;

                const { error: updateError } = await supabaseAdmin.from('organizations').update({ credits: newCredits }).eq('id', orgId);
                if (updateError) throw new Error('Org credits update failed: ' + updateError.message);

                console.log('Credits updated to:', newCredits);

            } else if (metadata.product_type === 'subscription') {
                console.log('Activating PRO subscription');
                const { error: subError } = await supabaseAdmin
                    .from('organizations')
                    .update({
                        is_pro: true,
                        subscription_plan: 'pro'
                    })
                    .eq('id', orgId);

                if (subError) throw new Error('Subscription update failed (check columns): ' + subError.message);
                console.log('PRO activated');
            }
        }

        return new NextResponse('Webhook Processed Successfully', { status: 200 });

    } catch (err: any) {
        console.error('Webhook Fatal Error:', err);
        // Ensure we return a string body even for 500
        return new NextResponse(`Fatal Webhook Error: ${err.message}`, { status: 500 });
    }
}
