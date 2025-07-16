// src/app/api/cron/process-events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { suiConfig } from '@/config/sui';

// Interfaces para los datos de los eventos
interface NftPurchasedEvent {
    buyer: string;
    seller: string;
    nft_id: string;
}

interface ReviewAddedEvent {
    provider_id: string;
    reviewer: string;
    rating: number;
}

interface ProviderProfileFields {
    owner: string;
}

export async function GET(req: NextRequest) {
    // --- 1. Inicializar Clientes ---
    const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const now = Date.now();
        const oneMinuteAgo = (now - 65000).toString(); // Un poco más de 1 min para no perder eventos

        // --- 2. Procesar Eventos de Compra (`NftPurchased`) ---
        const purchaseEvents = await suiClient.queryEvents({
            query: { MoveEventType: `${suiConfig.packageId}::experience_nft::NftPurchased` },
            order: 'descending',
            limit: 50,
        });

        const recentPurchases = purchaseEvents.data.filter(e => Number(e.timestampMs) > Number(oneMinuteAgo));

        for (const event of recentPurchases) {
            const parsedData = event.parsedJson as NftPurchasedEvent;
            
            // Buscar email del comprador y vendedor en Supabase
            const { data: buyerData } = await supabase.from('notification_settings').select('email').eq('sui_address', parsedData.buyer).single();
            const { data: sellerData } = await supabase.from('notification_settings').select('email').eq('sui_address', parsedData.seller).single();

            // Enviar email al comprador
            if (buyerData?.email) {
                await resend.emails.send({
                    from: 'TokenTrip <notifications@yourdomain.com>',
                    to: buyerData.email,
                    subject: 'Your Purchase on TokenTrip is Confirmed!',
                    html: `<p>Thank you for your purchase! You can now view your new experience in your collection.</p>`
                });
            }

            // Enviar email al vendedor
            if (sellerData?.email) {
                 await resend.emails.send({
                    from: 'TokenTrip <notifications@yourdomain.com>',
                    to: sellerData.email,
                    subject: "You've made a sale on TokenTrip!",
                    html: `<p>Congratulations! Your experience has been sold. The funds have been transferred to your wallet.</p>`
                });
            }
        }

        // --- 3. Procesar Eventos de Reseña (`ReviewAdded`) ---
        const reviewEvents = await suiClient.queryEvents({
            query: { MoveEventType: `${suiConfig.packageId}::experience_nft::ReviewAdded` },
            order: 'descending',
            limit: 50,
        });

        const recentReviews = reviewEvents.data.filter(e => Number(e.timestampMs) > Number(oneMinuteAgo));
        
        for (const event of recentReviews) {
            const parsedData = event.parsedJson as ReviewAddedEvent;
            
            // El evento nos da el ID del Perfil de Proveedor, no la dirección del dueño.
            // Necesitamos hacer una llamada extra para obtener el perfil y de ahí la dirección.
            const providerProfile = await suiClient.getObject({ id: parsedData.provider_id, options: { showContent: true }});
            
            if (providerProfile.data?.content?.dataType === 'moveObject') {
                const fields = providerProfile.data.content.fields as ProviderProfileFields;
                const { data: providerData } = await supabase.from('notification_settings').select('email').eq('sui_address', fields.owner).single();

                if (providerData?.email) {
                    await resend.emails.send({
                        from: 'TokenTrip <notifications@yourdomain.com>',
                        to: providerData.email,
                        subject: `You have a new ${parsedData.rating}-star review!`,
                        html: `<p>A traveler has left a new review on your TokenTrip profile. Check it out on your dashboard!</p>`
                    });
                }
            }
        }

        return NextResponse.json({ success: true, message: `Processed ${recentPurchases.length} purchases and ${recentReviews.length} reviews.` });

    } catch (error) {
        console.error("Cron job error:", error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
