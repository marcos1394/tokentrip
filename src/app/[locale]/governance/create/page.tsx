'use client';

import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Lightbulb, Loader } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const SUI_SYSTEM_CLOCK_OBJECT_ID = "0x6";

export default function CreateProposalPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const currentAccount = useCurrentAccount();
    const locale = params.locale as string;

    // Estado para el formulario
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');

    const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();

    const handleCreateProposal = () => {
        if (!currentAccount) {
            toast({ variant: 'destructive', title: 'Billetera no conectada' });
            return;
        }
        if (!title.trim() || !description.trim() || !recipient.trim() || !amount.trim()) {
            toast({ variant: 'destructive', title: 'Formulario incompleto' });
            return;
        }
        
        const tx = new Transaction();
        const amountInMist = BigInt(parseFloat(amount) * (10 ** 9));

        tx.moveCall({
            target: `${suiConfig.daoPackageId}::dao::create_proposal`,
            arguments: [
                tx.object(suiConfig.daoId),
                tx.pure.string(title),
                tx.pure.string(description),
                tx.pure.address(recipient),
                tx.pure.u64(amountInMist),
                tx.object(SUI_SYSTEM_CLOCK_OBJECT_ID)
            ],
        });

        signAndExecuteTransaction({ transaction: tx }, {
            onSuccess: (result) => {
                toast({ title: '✅ ¡Propuesta Creada!', description: 'Tu propuesta ha sido publicada en la blockchain.' });
                // Podríamos redirigir a la lista de propuestas o a la página de la nueva propuesta
                router.push(`/${locale}/governance`); 
            },
            onError: (error) => {
                toast({ variant: "destructive", title: '❌ Error al Crear Propuesta', description: error.message });
            }
        });
    };
    
    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        {/* Este enlace debería llevar a la futura página principal de gobernanza */}
                        <Link href={`/${locale}/governance`}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Gobernanza
                        </Link>
                    </Button>
                </div>
                
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold heading-gradient text-balance">Crear Nueva Propuesta</h1>
                        <p className="text-muted-foreground mt-2">Inicia una votación para la comunidad de TokenTrip.</p>
                    </div>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-2xl text-foreground">Detalles de la Propuesta</CardTitle>
                            <CardDescription>Describe tu idea claramente. Una vez creada, no podrá ser modificada.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-muted-foreground">Título</Label>
                                <Input id="title" placeholder="Ej: Financiar campaña de marketing en Asia" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isPending} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-muted-foreground">Descripción</Label>
                                <Textarea id="description" placeholder="Explica el objetivo, los beneficios y los costos de tu propuesta..." value={description} onChange={(e) => setDescription(e.target.value)} disabled={isPending} rows={6} />
                            </div>
                            
                            <div className="border-t pt-6 space-y-6">
                                <h3 className="text-lg font-semibold text-foreground">Acción Propuesta: Transferencia de Fondos</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="recipient" className="text-muted-foreground">Dirección del Destinatario</Label>
                                    <Input id="recipient" placeholder="0x..." value={recipient} onChange={(e) => setRecipient(e.target.value)} disabled={isPending} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="text-muted-foreground">Monto de TKT a Transferir</Label>
                                    <Input id="amount" type="number" placeholder="Ej: 50000" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isPending} />
                                </div>
                            </div>

                            <Button size="lg" className="w-full text-lg py-6 btn-sui" onClick={handleCreateProposal} disabled={isPending || !currentAccount}>
                                {isPending ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Lightbulb className="w-5 h-5 mr-2" />}
                                {isPending ? "Publicando..." : "Enviar Propuesta a Votación"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Toaster />
        </div>
    );
}