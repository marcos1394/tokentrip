// src/app/api/cron/process-events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function GET(req: NextRequest) {
    // --- 1. Inicializar Clientes ---
    const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const resend = new Resend(process.env.RESEND_API_KEY);

    // --- 2. Escuchar Eventos de Sobrepuja (Outbid) ---
    try {
        // Buscamos eventos de pujas de los últimos ~65 segundos
        const events = await suiClient.queryEvents({
            query: { MoveEventType: `${process.env.NEXT_PUBLIC_AUCTIONS_PACKAGE_ID}::auctions::BidPlaced` },
            order: 'descending',
            limit: 50,
        });

        const now = Date.now();
        const recentEvents = events.data.filter(e => now - Number(e.timestampMs) < 65000);

        for (const event of recentEvents) {
            const bidder = event.parsedJson?.bidder as string;
            // Aquí necesitaríamos una forma de saber quién era el *postor anterior*
            // Esta es una limitación de nuestro evento actual.
            // Para una V2, el evento 'BidPlaced' debería incluir 'previous_bidder'.
            
            // --- Simulación por ahora ---
            // const previousBidder = "0x...";
            // const { data: user } = await supabase.from('notification_settings').select('email').eq('sui_address', previousBidder).single();
            
            // if(user && user.email) {
            //     await resend.emails.send({
            //         from: 'TokenTrip <noreply@yourdomain.com>',
            //         to: user.email,
            //         subject: 'You have been outbid on TokenTrip!',
            //         html: `<p>Someone placed a higher bid on an auction you're participating in. Don't miss out!</p>`
            //     });
            // }
        }

        return NextResponse.json({ success: true, message: `Processed ${recentEvents.length} events.` });

    } catch (error) {
        console.error("Cron job error:", error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
