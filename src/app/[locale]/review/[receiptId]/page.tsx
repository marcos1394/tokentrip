'use client';

import { useState, useEffect } from 'react';
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
import { ArrowLeft, Star, Loader, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

    // Estado para el formulario
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    const { mutateAsync: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
    
    // Obtener datos del recibo
    const { data: receiptData, isLoading, isError } = useSuiClientQuery('getObject', { id: receiptId, options: { showContent: true } }, { enabled: !!receiptId });
    const receiptFields = receiptData?.data?.content?.dataType === 'moveObject' ? receiptData.data.content.fields as unknown as PurchaseReceiptFields : null;

    // Lógica de transacción corregida
    const handleAddReview = async () => {
        if (rating === 0 || !comment.trim()) {
            toast({ variant: 'destructive', title: 'Incomplete Form', description: 'Please select a rating and write a comment.' });
            return;
        }
        if (!receiptFields) return;

        const tx = new Transaction();
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::add_review`,
            arguments: [
                tx.object(receiptFields.provider_id),
                tx.object(receiptId),
                tx.pure.u8(rating),
                tx.pure.string(comment),
            ],
        });

        try {
            await signAndExecuteTransaction({ transaction: tx });
            toast({ title: '✅ Thank you for your review!', description: 'Your feedback has been published on-chain.' });
            router.push('/');
        } catch (error: any) {
            toast({ variant: 'destructive', title: '❌ Failed to publish review', description: error.message });
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin h-10 w-10" /></div>;
    if (isError || !receiptFields) return (
        <div className="min-h-screen flex items-center justify-center text-center p-4">
            <Card className="glass-card p-8"><AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                <h1 className="text-2xl font-bold text-foreground">Receipt Not Found</h1>
                <p className="mt-2 text-muted-foreground">This purchase receipt is invalid or has already been used.</p>
                <Button asChild className="mt-6 btn-sui-outline"><Link href="/">Back to Home</Link></Button>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Link>
                    </Button>
                </div>
                
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold heading-gradient text-balance">Rate Your Experience</h1>
                    <p className="text-muted-foreground mt-2">Your feedback helps other travelers make better decisions.</p>
                </div>

                <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
                    {/* Columna Izquierda: Contexto de la experiencia */}
                    <div className="lg:col-span-2">
                        <Card className="glass-card sticky top-28">
                            <CardHeader>
                                <CardDescription>You are reviewing:</CardDescription>
                                <CardTitle className="text-foreground">{receiptFields.nft_name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <img src={receiptFields.nft_image_url.url} alt={receiptFields.nft_name} className="w-full h-auto object-cover rounded-lg aspect-video" />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Columna Derecha: Formulario de reseña */}
                    <div className="lg:col-span-3">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-foreground">Your Rating</CardTitle>
                                <CardDescription>Select a star rating and leave a comment about your experience.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex justify-center py-4" onMouseLeave={() => setHoverRating(0)}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-12 h-12 cursor-pointer transition-all duration-200 ${(hoverRating || rating) >= star ? 'text-yellow-400 scale-110' : 'text-gray-300 dark:text-gray-600'}`}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'}
                                        />
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="comment" className="text-muted-foreground">Your Comment</Label>
                                    <Textarea
                                        id="comment"
                                        placeholder="What did you like or dislike? Would you recommend it?"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={6}
                                        maxLength={500}
                                    />
                                    <p className="text-xs text-muted-foreground text-right">{comment.length} / 500</p>
                                </div>
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>Review Tips</AlertTitle>
                                    <AlertDescription>
                                        Be specific and honest. Your review will be permanently stored on the blockchain.
                                    </AlertDescription>
                                </Alert>
                                <Button
                                    size="lg"
                                    className="w-full text-lg py-6 btn-sui"
                                    onClick={handleAddReview}
                                    disabled={isPending || !currentAccount || rating === 0 || !comment.trim()}
                                >
                                    {isPending ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Star className="w-5 h-5 mr-2" />}
                                    {isPending ? "Publishing..." : "Publish Review"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}