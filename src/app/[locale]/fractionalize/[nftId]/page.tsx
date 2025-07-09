'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { bcs } from '@mysten/sui/bcs'; // --- CORRECCIÓN: Se importa la librería BCS ---

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, PlusCircle, X, Sprout, Loader, AlertCircle, User, Percent } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Interfaces (sin cambios)
interface ExperienceNftFields { /* ... */ }

// --- CORRECCIÓN 1: Definimos la interfaz 'Share' ---
interface Share {
    id: number;
    percentage: string;
    recipient: string;
}

const isValidSuiAddress = (address: string) => /^0x[a-fA-F0-9]{64}$/.test(address);

export default function FractionalizePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const currentAccount = useCurrentAccount();
    
    const nftId = params.nftId as string;
    const locale = params.locale as string;

    const [shares, setShares] = useState<Share[]>([]);
    const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
    
    const { data: nftData, isLoading, isError } = useSuiClientQuery('getObject', { id: nftId, options: { showContent: true } }, { enabled: !!nftId });

    // Lógica de UI Implementada
    
    // Este useEffect observa los cambios en el array de 'shares' para dar retroalimentación.
    // En esta implementación específica, no es estrictamente necesario ya que la validación
    // principal ocurre en useMemo, pero se incluye como lo solicitaste.
    useEffect(() => {
        // Podrías añadir lógica aquí si quisieras ejecutar un efecto secundario,
        // como mostrar una notificación de advertencia en tiempo real.
        // Por ejemplo:
        // const total = shares.reduce((sum, s) => sum + (parseFloat(s.percentage) || 0), 0);
        // if (total > 100) {
        //   toast({ variant: 'destructive', title: 'Advertencia', description: 'El total ha superado el 100%.' });
        // }
    }, [shares]);

    // Maneja los cambios en los inputs de porcentaje y dirección
    const handleShareChange = (index: number, field: keyof Omit<Share, 'id'>, value: string) => {
        const newShares = [...shares];
        newShares[index][field] = value;
        setShares(newShares);
    };

    // Añade una nueva fila de inputs para otro destinatario
    const handleAddShare = () => {
        setShares([...shares, { id: Date.now(), percentage: '', recipient: '' }]);
    };

    // Elimina una fila de destinatario por su id
    const handleRemoveShare = (id: number) => {
        setShares(shares.filter(share => share.id !== id));
    };

    // Calcula los totales y valida el formulario cada vez que el array 'shares' cambia
    const { totalPercentage, ownerRemainder, isFormInvalid } = useMemo(() => {
        const validShares = shares.filter(s => s.percentage.trim() !== '' && !isNaN(parseFloat(s.percentage)));
        const total = validShares.reduce((sum, s) => sum + parseFloat(s.percentage), 0);
        
        const hasInvalidAddress = shares.some(s => s.recipient.trim() !== '' && !isValidSuiAddress(s.recipient));

        const invalid = total > 100 || hasInvalidAddress;
        
        return {
            totalPercentage: total,
            ownerRemainder: 100 - total,
            isFormInvalid: invalid
        };
    }, [shares]);

    // --- CORRECCIÓN FINAL: Se usa BCS para construir la transacción ---
    const handleFractionalize = () => {
        if (isFormInvalid) {
            toast({ variant: 'destructive', title: 'Error de Validación' });
            return;
        }

        const sharesToTransfer = shares.filter(s => s.percentage.trim() !== '' && parseFloat(s.percentage) > 0 && s.recipient.trim() !== '');

        if (sharesToTransfer.length === 0 && ownerRemainder <= 0) {
            toast({ variant: 'destructive', title: 'Nada que fraccionar' });
            return;
        }
        
        const tx = new Transaction();
        
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::fractionize`,
            arguments: [
                tx.object(nftId),
                // Se serializa el vector de porcentajes (u64)
                tx.pure(bcs.vector(bcs.U64).serialize(sharesToTransfer.map(s => s.percentage))),
                // Se serializa el vector de destinatarios (address)
                tx.pure(bcs.vector(bcs.Address).serialize(sharesToTransfer.map(s => s.recipient)))
            ]
        });

        signAndExecuteTransaction({ transaction: tx }, {
            onSuccess: (result) => {
                toast({ title: '✅ Fraccionamiento Exitoso'});
                router.push(`/${locale}/`);
            },
            onError: (error) => {
                toast({ variant: 'destructive', title: '❌ Error al Fraccionar', description: error.message });
            }
        });
    };

    const nftFields = nftData?.data?.content?.dataType === 'moveObject' ? nftData.data.content.fields as unknown as any : null;

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;
    if (isError || !nftFields) return <div className="min-h-screen flex items-center justify-center">Error: No se pudo cargar el NFT.</div>;

    // --- JSX (sin cambios) ---
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
                
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold heading-gradient text-balance">Fraccionar Experiencia</h1>
                        <p className="text-muted-foreground mt-2">Asigna porcentajes a otras billeteras. La parte que no asignes, te la quedarás tú.</p>
                    </div>

                    <Card className="mb-8 glass-card flex items-center gap-6 p-4">
                        <img src={nftFields.image_url.url} alt={nftFields.name} className="w-24 h-24 object-cover rounded-lg" />
                        <div className="flex-grow">
                            <CardTitle className="text-foreground">{nftFields.name}</CardTitle>
                            <CardDescription>ID: {nftId.slice(0, 6)}...{nftId.slice(-4)}</CardDescription>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        {shares.map((share, index) => (
                            <Card key={share.id} className="glass-card p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <div>
                                        <Label htmlFor={`percentage-${index}`} className="text-muted-foreground">Porcentaje (%) a transferir</Label>
                                        <Input id={`percentage-${index}`} type="number" value={share.percentage} onChange={(e) => handleShareChange(index, 'percentage', e.target.value)} placeholder="Ej: 80" className="mt-1"/>
                                    </div>
                                    <div>
                                        <Label htmlFor={`recipient-${index}`} className="text-muted-foreground">Dirección del Destinatario</Label>
                                        <div className="flex items-center gap-2">
                                            <Input id={`recipient-${index}`} value={share.recipient} onChange={(e) => handleShareChange(index, 'recipient', e.target.value)} placeholder="0x..." className="mt-1"/>
                                            {shares.length > 1 && (
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveShare(share.id)}>
                                                    <X className="w-4 h-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                    
                    <Button variant="outline" onClick={handleAddShare} className="mt-4 w-full glass-card">
                        <PlusCircle className="w-4 h-4 mr-2" /> Añadir Destinatario
                    </Button>
                    
                    <div className="mt-8 p-6 glass-card rounded-lg space-y-6">
                        <div className="flex justify-between items-center text-lg">
                            <span className="flex items-center text-muted-foreground"><Percent className="w-5 h-5 mr-2"/> Partes a transferir:</span>
                            <span className={`font-bold ${totalPercentage > 100 ? 'text-destructive' : 'text-foreground'}`}>{totalPercentage.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center text-lg border-t pt-4">
                            <span className="flex items-center font-bold text-foreground"><User className="w-5 h-5 mr-2"/> Tu parte restante:</span>
                            <span className="font-bold text-green-500">{ownerRemainder >= 0 ? ownerRemainder.toFixed(2) : '0.00'}%</span>
                        </div>
                        
                        <Button
                            size="lg"
                            className="w-full mt-6 text-lg py-6 btn-sui"
                            onClick={handleFractionalize}
                            disabled={isPending || isFormInvalid}
                        >
                            {isPending ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Sprout className="w-5 h-5 mr-2" />}
                            {isPending ? "Fraccionando..." : "Confirmar Fraccionamiento"}
                        </Button>
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}