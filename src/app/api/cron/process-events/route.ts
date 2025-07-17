import { NextRequest, NextResponse } from 'next/server';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { suiConfig } from '@/config/sui';

// --- AÑADIDO: Se importa la plantilla de React y el renderizador ---
import { render } from '@react-email/render';
import { NotificationEmail } from '@/emails/NotificationEmail';

// Interfaces para los datos de los eventos
interface NftPurchasedEvent {
    buyer: string;
    seller: string;
    nft_id: string;
    listing_id: string;
}

interface ReviewAddedEvent {
    provider_id: string;
    reviewer: string;
    rating: number;
}

interface ProviderProfileFields {
    owner: string;
}

// Esta función se ejecuta como un Cron Job en Vercel
export async function GET(req: NextRequest) {
    // --- 1. Inicializar Clientes ---
    const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const resend = new Resend(process.env.RESEND_API_KEY!);

    try {
        const now = Date.now();
        // Se buscan eventos en los últimos 65 segundos para tener un pequeño margen
        const oneMinuteAgo = (now - 65000).toString(); 

        // --- 2. Procesar Eventos de Compra (`NftPurchased`) ---
        const purchaseEvents = await suiClient.queryEvents({
            query: { MoveEventType: `${suiConfig.packageId}::experience_nft::NftPurchased` },
            order: 'descending',
            limit: 50,
        });

        const recentPurchases = purchaseEvents.data.filter(e => Number(e.timestampMs) > Number(oneMinuteAgo));

        for (const event of recentPurchases) {
            const parsedData = event.parsedJson as NftPurchasedEvent;
            
            // Buscar emails en Supabase
            const { data: buyerData } = await supabase.from('notification_settings').select('email').eq('sui_address', parsedData.buyer).single();
            const { data: sellerData } = await supabase.from('notification_settings').select('email').eq('sui_address', parsedData.seller).single();

            // Enviar email al comprador
            if (buyerData?.email) {
                await resend.emails.send({
                    from: 'TokenTrip <notifications@yourdomain.com>', // Reemplazar con tu dominio verificado en Resend
                    to: buyerData.email,
                    subject: 'Your Purchase on TokenTrip is Confirmed!',
                    react: NotificationEmail({
                        title: 'Purchase Confirmed!',
                        mainText: 'Thank you for acquiring a new experience. You can now find it in your collection and, once enjoyed, leave a review.',
                        ctaText: 'View My Collection',
                        ctaUrl: 'https://tokentrip-3cri.vercel.app/dashboard' // URL a la página correspondiente
                    }),
                });
            }

            // Enviar email al vendedor
            if (sellerData?.email) {
                 await resend.emails.send({
                    from: 'TokenTrip <notifications@yourdomain.com>',
                    to: sellerData.email,
                    subject: "You've made a sale on TokenTrip!",
                    react: NotificationEmail({
                        title: "You've Made a Sale!",
                        mainText: 'Congratulations! One of your experiences has been sold. The funds have been transferred to your wallet.',
                        ctaText: 'View Your Dashboard',
                        ctaUrl: 'https://tokentrip-3cri.vercel.app/dashboard'
                    }),
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
            
            const providerProfile = await suiClient.getObject({ id: parsedData.provider_id, options: { showContent: true }});
            
            if (providerProfile.data?.content?.dataType === 'moveObject') {
                const fields = providerProfile.data.content.fields as unknown as ProviderProfileFields;                const { data: providerData } = await supabase.from('notification_settings').select('email').eq('sui_address', fields.owner).single();

                if (providerData?.email) {
                    await resend.emails.send({
                        from: 'TokenTrip <notifications@yourdomain.com>',
                        to: providerData.email,
                        subject: `You have a new ${parsedData.rating}-star review!`,
                        react: NotificationEmail({
                            title: 'You Have a New Review!',
                            mainText: `A traveler has left a ${parsedData.rating}-star rating on your profile. Great work! This improves your reputation on the platform.`,
                            ctaText: 'View My Profile',
                            ctaUrl: `https://tokentrip-3cri.vercel.app/provider/${parsedData.provider_id}`
                        }),
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
