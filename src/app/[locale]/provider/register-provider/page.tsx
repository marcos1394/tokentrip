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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Store, Loader } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function RegisterProviderPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const currentAccount = useCurrentAccount();
    const locale = params.locale as string;

    // Estado para el formulario de registro
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();

    const handleRegister = () => {
        if (!currentAccount) {
            toast({ variant: 'destructive', title: 'Billetera no conectada' });
            return;
        }
        if (!name.trim() || !bio.trim() || !imageUrl.trim()) {
            toast({ variant: 'destructive', title: 'Formulario incompleto', description: 'Por favor, llena todos los campos.' });
            return;
        }

        const tx = new Transaction();

        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::register_provider`,
            arguments: [
                tx.pure.string(name),
                tx.pure.string(bio),
                tx.pure.string(imageUrl),
            ],
        });

        signAndExecuteTransaction({ transaction: tx }, {
            onSuccess: (result) => {
                toast({ title: '✅ ¡Registro Exitoso!', description: `Bienvenido, ${name}! Ahora eres un proveedor en TokenTrip.` });
                // Redirigimos a la página principal después del éxito
                setTimeout(() => router.push(`/${locale}`), 2000);
            },
            onError: (error) => {
                toast({ variant: "destructive", title: '❌ Error en el Registro', description: error.message });
            }
        });
    };
    
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
                        <h1 className="text-4xl font-bold heading-gradient text-balance">Conviértete en Proveedor</h1>
                        <p className="text-muted-foreground mt-2">Crea tu perfil para empezar a vender experiencias únicas en TokenTrip.</p>
                    </div>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-2xl text-foreground">Datos de tu Perfil</CardTitle>
                            <CardDescription>Esta información será pública y visible para todos los compradores.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-muted-foreground">Nombre de tu Tienda o Marca</Label>
                                <Input 
                                    id="name" 
                                    placeholder="Ej: Aventuras Mayas"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bio" className="text-muted-foreground">Biografía Corta</Label>
                                <Textarea 
                                    id="bio" 
                                    placeholder="Describe en una o dos frases lo que ofreces..."
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="imageUrl" className="text-muted-foreground">URL de tu Logo o Imagen de Perfil</Label>
                                <Input 
                                    id="imageUrl" 
                                    placeholder="https://..."
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    disabled={isPending}
                                />
                            </div>
                            <Button
                                size="lg"
                                className="w-full text-lg py-6 btn-sui"
                                onClick={handleRegister}
                                disabled={isPending || !currentAccount}
                            >
                                {isPending ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Store className="w-5 h-5 mr-2" />}
                                {isPending ? "Registrando..." : "Crear Perfil de Proveedor"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Toaster />
        </div>
    );
}