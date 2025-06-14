'use client';

import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui'; // Ahora importa la config actualizada
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, UserPlus, UserX, Loader, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AdminPage() {
    const params = useParams();
    const currentAccount = useCurrentAccount();
    const { toast } = useToast();
    const locale = params.locale as string;

    const [providerAddress, setProviderAddress] = useState('');
    const { mutate: executeTx, isPending } = useSignAndExecuteTransaction();

    const handleVipAction = (action: 'add' | 'remove') => {
        if (!currentAccount || currentAccount.address !== process.env.NEXT_PUBLIC_ADMIN_ADDRESS) {
            toast({ variant: 'destructive', title: 'Acción no autorizada' });
            return;
        }
        if (!providerAddress.trim()) {
            toast({ variant: 'destructive', title: 'Dirección requerida' });
            return;
        }

        const tx = new Transaction();
        const functionName = action === 'add' ? 'add_vip' : 'remove_vip';

        // CORRECCIÓN: Ahora lee los IDs desde el objeto suiConfig actualizado
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::${functionName}`,
            arguments: [
                tx.object(suiConfig.adminCapId),
                tx.object(suiConfig.vipRegistryId),
                tx.pure.address(providerAddress),
            ],
        });

        executeTx({ transaction: tx }, {
            onSuccess: () => {
                toast({ title: '✅ ¡Éxito!', description: `Proveedor ${action === 'add' ? 'añadido a' : 'eliminado de'} la lista VIP.` });
                setProviderAddress('');
            },
            onError: (error) => {
                toast({ variant: 'destructive', title: '❌ Error en la operación', description: error.message });
            }
        });
    };

    // Renderizado del JSX (sin cambios)
    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href={`/${locale}`}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Inicio
                        </Link>
                    </Button>
                </div>
                
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold heading-gradient text-balance">Panel de Administración VIP</h1>
                        <p className="text-muted-foreground mt-2">Gestiona la lista de proveedores con comisiones reducidas.</p>
                    </div>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-foreground">Gestionar Proveedor</CardTitle>
                            <CardDescription>Introduce la dirección de la billetera del proveedor para añadirlo o quitarlo de la lista VIP.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input 
                                id="providerAddress" 
                                placeholder="0x..."
                                value={providerAddress}
                                onChange={(e) => setProviderAddress(e.target.value)}
                                disabled={isPending}
                            />
                            <div className="flex gap-4">
                                <Button className="w-full btn-sui" onClick={() => handleVipAction('add')} disabled={isPending}>
                                    {isPending ? <Loader className="animate-spin w-5 h-5"/> : <UserPlus className="w-5 h-5" />}
                                    <span className="ml-2">Añadir a VIP</span>
                                </Button>
                                <Button variant="destructive" className="w-full" onClick={() => handleVipAction('remove')} disabled={isPending}>
                                     {isPending ? <Loader className="animate-spin w-5 h-5"/> : <UserX className="w-5 h-5" />}
                                    <span className="ml-2">Quitar de VIP</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div className="mt-8">
                         <h3 className="text-2xl font-bold text-foreground mb-4">Lista de VIPs Actuales</h3>
                         <div className="p-8 text-center border-2 border-dashed rounded-lg text-muted-foreground">
                            <ShieldCheck className="mx-auto w-10 h-10 mb-2"/>
                            Próximamente: Aquí podrás ver la lista completa.
                         </div>
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}