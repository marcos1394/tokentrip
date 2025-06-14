'use client';

import { useState } from 'react';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';

// Componentes
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/components/ui/use-toast";
import { ListPlus, Loader, Edit, Gavel } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ListableNftCardProps {
    nft: {
        objectId: string;
        display: {
            data: {
                name: string;
                image_url: string;
                description: string;
            }
        }
    };
    providerProfileId: string;
    onActionSuccess: () => void; 
}

const SUI_SYSTEM_CLOCK_OBJECT_ID = "0x6";

export function ListableNftCard({ nft, providerProfileId, onActionSuccess }: ListableNftCardProps) {
    // Estados para los modales
    const [isListOpen, setIsListOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAuctionOpen, setIsAuctionOpen] = useState(false);
    
    // Estados para los formularios
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState<'SUI' | 'TKT'>('SUI');
    const [newDescription, setNewDescription] = useState(nft.display.data.description || '');
    const [startPrice, setStartPrice] = useState('');
    const [duration, setDuration] = useState('86400000'); // 1 día en ms por defecto

    const { toast } = useToast();
    
    // Hooks de transacción
    const { mutate: executeList, isPending: isListPending } = useSignAndExecuteTransaction();
    const { mutate: executeUpdate, isPending: isUpdatePending } = useSignAndExecuteTransaction();
    const { mutate: executeAuction, isPending: isAuctionPending } = useSignAndExecuteTransaction();

    const handleListForSale = () => {
        const priceAsNumber = parseFloat(price);
        if (isNaN(priceAsNumber) || priceAsNumber <= 0) { toast({ variant: 'destructive', title: 'Precio inválido' }); return; }
        
        const priceInMist = BigInt(priceAsNumber * (10 ** 9));
        const tx = new Transaction();
        const functionName = currency === 'TKT' ? 'list_for_sale_with_tkt' : 'list_for_sale';

        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::${functionName}`,
            arguments: [tx.object(providerProfileId), tx.object(nft.objectId), tx.pure.u64(priceInMist)]
        });

        executeList({ transaction: tx }, {
            onSuccess: () => {
                toast({ title: '✅ ¡Éxito!', description: `Tu experiencia ha sido listada en ${currency}.` });
                setIsListOpen(false);
                onActionSuccess();
            },
            onError: (error) => { toast({ variant: 'destructive', title: '❌ Error al listar', description: error.message }); }
        });
    }

    const handleUpdateDescription = () => {
        if (!newDescription.trim()) { toast({ variant: 'destructive', title: 'La descripción no puede estar vacía.' }); return; }
        const tx = new Transaction();
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::update_nft_description`,
            arguments: [ tx.object(providerProfileId), tx.object(nft.objectId), tx.pure.string(newDescription) ]
        });
        executeUpdate({ transaction: tx }, {
            onSuccess: () => {
                toast({ title: '✅ Descripción Actualizada' });
                setIsEditOpen(false);
                onActionSuccess();
            },
            onError: (error) => { toast({ variant: 'destructive', title: '❌ Error al actualizar', description: error.message }); }
        });
    }

    // --- LÓGICA DE SUBASTA ---
    const handleCreateAuction = () => {
        const startPriceNum = parseFloat(startPrice);
        if (isNaN(startPriceNum) || startPriceNum <= 0) {
            toast({ variant: 'destructive', title: 'Precio de salida inválido' });
            return;
        }

        const tx = new Transaction();
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::create_auction`,
            arguments: [
                tx.object(providerProfileId),
                tx.object(nft.objectId),
                tx.pure.u64(startPriceNum * 1_000_000_000),
                tx.pure.u64(Number(duration)),
                tx.object(SUI_SYSTEM_CLOCK_OBJECT_ID)
            ]
        });

        executeAuction({ transaction: tx }, {
            onSuccess: () => {
                toast({ title: '✅ ¡Subasta Creada!', description: 'Tu experiencia ahora está en subasta.'});
                setIsAuctionOpen(false);
                onActionSuccess();
            },
            onError: (err) => {
                toast({ variant: 'destructive', title: '❌ Error al crear la subasta', description: err.message });
            }
        });
    }

    const { name, image_url } = nft.display.data;

    return (
        <Card className="glass-card card-hover flex flex-col">
            <CardHeader className="p-0">
                <img src={image_url} alt={name} className="w-full h-48 object-cover rounded-t-lg" />
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <CardTitle className="line-clamp-2 text-foreground">{name}</CardTitle>
            </CardContent>
            {/* Se ajusta el footer para acomodar 3 acciones */}
            <CardFooter className="flex flex-col gap-2">
                <Dialog open={isListOpen} onOpenChange={setIsListOpen}>
                    <DialogTrigger asChild><Button className="w-full btn-sui"><ListPlus className="w-4 h-4 mr-2" /> Poner a la Venta</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] glass-effect">
                        {/* ... Modal de Listar (sin cambios) ... */}
                    </DialogContent>
                </Dialog>
                <div className="grid grid-cols-2 gap-2 w-full">
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogTrigger asChild><Button variant="secondary" className="w-full"><Edit className="w-4 h-4 mr-2" /> Editar</Button></DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] glass-effect">
                           {/* ... Modal de Editar (sin cambios) ... */}
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isAuctionOpen} onOpenChange={setIsAuctionOpen}>
                        <DialogTrigger asChild><Button variant="secondary" className="w-full"><Gavel className="w-4 h-4 mr-2" /> Subastar</Button></DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] glass-effect">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">Crear Subasta</DialogTitle>
                                <DialogDescription>Establece las condiciones iniciales para tu subasta.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-price" className="text-muted-foreground">Precio de Salida (SUI)</Label>
                                    <Input id="start-price" type="number" value={startPrice} onChange={(e) => setStartPrice(e.target.value)} placeholder="Ej: 50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration" className="text-muted-foreground">Duración</Label>
                                    <Select onValueChange={setDuration} defaultValue={duration}>
                                        <SelectTrigger><SelectValue placeholder="Selecciona duración" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="3600000">1 Hora</SelectItem>
                                            <SelectItem value="86400000">1 Día</SelectItem>
                                            <SelectItem value="259200000">3 Días</SelectItem>
                                            <SelectItem value="604800000">7 Días</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateAuction} disabled={isAuctionPending} className="w-full btn-sui">
                                    {isAuctionPending && <Loader className="w-4 h-4 mr-2 animate-spin"/>}
                                    Iniciar Subasta
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardFooter>
        </Card>
    )
}