'use client';

import { useState } from 'react';
import { useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, Loader } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

// Interfaces
interface PurchaseReceiptFields {
  id: { id: string };
  provider_id: string;
  nft_name: string;
  nft_image_url: { url: string };
}

export default function ReviewPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const currentAccount = useCurrentAccount();
    
    const receiptId = params.receiptId as string;
    const locale = params.locale as string;

    // Estado para el formulario de la reseña
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
    
    // Obtener los datos del recibo de compra
    const { data: receiptData, isLoading, isError } = useSuiClientQuery(
        'getObject',
        { id: receiptId, options: { showContent: true } },
        { enabled: !!receiptId }
    );

    const handleAddReview = () => {
        if (rating === 0 || !comment.trim()) {
            toast({ variant: 'destructive', title: 'Formulario incompleto', description: 'Por favor, selecciona una calificación y escribe un comentario.' });
            return;
        }
        if (!receiptData?.data) return;

        const fields = receiptData.data.content?.dataType === 'moveObject' ? receiptData.data.content.fields as unknown as PurchaseReceiptFields : null;
        if (!fields) return;

        const tx = new Transaction();

        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::add_review`,
            arguments: [
                tx.object(fields.provider_id),
                tx.object(receiptId),
                tx.pure.u8(rating),
                tx.pure.string(comment),
            ],
        });

        signAndExecuteTransaction({ transaction: tx }, {
            onSuccess: (result) => {
                toast({ title: '✅ ¡Gracias por tu reseña!', description: 'Tu calificación ha sido publicada en la blockchain.' });
                router.push(`/${locale}/`);
            },
            onError: (error) => {
                toast({ variant: 'destructive', title: '❌ Error al publicar la reseña', description: error.message });
            }
        });
    };

    const receiptFields = receiptData?.data?.content?.dataType === 'moveObject' ? receiptData.data.content.fields as unknown as PurchaseReceiptFields : null;

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;
    if (isError || !receiptFields) return <div className="min-h-screen flex items-center justify-center">Error: No se pudo cargar el recibo de compra.</div>;

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href={`/${locale}`}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                        </Link>
                    </Button>
                </div>
                
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold heading-gradient text-balance">Califica tu Experiencia</h1>
                        <p className="text-muted-foreground mt-2">Tu opinión ayuda a otros viajeros a tomar mejores decisiones.</p>
                    </div>

                    <Card className="mb-8 glass-card">
                        <CardHeader>
                            <CardTitle className="text-foreground">{receiptFields.nft_name}</CardTitle>
                            <CardDescription>Estás calificando esta experiencia.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <img src={receiptFields.nft_image_url.url} alt={receiptFields.nft_name} className="w-full h-48 object-cover rounded-lg" />
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-foreground">Tu Calificación</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex justify-center" onMouseLeave={() => setHoverRating(0)}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-10 h-10 cursor-pointer transition-all duration-200 ${
                                            (hoverRating || rating) >= star 
                                                ? 'text-yellow-400 scale-110' 
                                                : 'text-gray-300 dark:text-gray-600'
                                        }`}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'}
                                    />
                                ))}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="comment" className="text-muted-foreground">Tu Comentario</Label>
                                <Textarea
                                    id="comment"
                                    placeholder="¿Qué te pareció la experiencia? ¿La recomendarías?"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={5}
                                />
                            </div>
                            <Button
                                size="lg"
                                className="w-full text-lg py-6 btn-sui"
                                onClick={handleAddReview}
                                disabled={isPending || !currentAccount || rating === 0 || !comment.trim()}
                            >
                                {isPending ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Star className="w-5 h-5 mr-2" />}
                                {isPending ? "Publicando..." : "Publicar Reseña"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Toaster />
        </div>
    );
}