// src/components/ListableNftCard.tsx
'use client';

import { useState } from 'react';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';

// Componentes
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { ListPlus, Loader, Edit, Gavel, MoreVertical } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ListableNftCardProps {
    nft: {
        objectId: string;
        display?: {
            data: {
                name: string;
                image_url: string;
                description: string;
            }
        }
    };
    providerProfileId?: string;
    onActionSuccess: () => void;
    
    // --- LÍNEAS AÑADIDAS ---
    isListing?: boolean;      // Opcional: true si el NFT ya está listado
    listingData?: any;        // Opcional: para pasar los datos del objeto Listing
    isFraction?: boolean; // <-- AÑADIDO: Para saber si es una fracción

}

const SUI_SYSTEM_CLOCK_OBJECT_ID = "0x6";

export function ListableNftCard({ nft, providerProfileId, onActionSuccess, isListing, listingData, isFraction }: ListableNftCardProps) {    
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAuctionOpen, setIsAuctionOpen] = useState(false);
     // --- ESTADOS PARA EL MODAL DE ALQUILER ---
    const [isRentOpen, setIsRentOpen] = useState(false);
    const [rentPrice, setRentPrice] = useState('');
    const [rentCurrency, setRentCurrency] = useState<'SUI' | 'TKT'>('SUI');
    const [rentStartDate, setRentStartDate] = useState<Date>();
    const [rentEndDate, setRentEndDate] = useState<Date>();
    
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState<'SUI' | 'TKT'>('SUI');
    const [newDescription, setNewDescription] = useState(nft.display?.data?.description || '');
    const [startPrice, setStartPrice] = useState('');
    const [duration, setDuration] = useState('86400000'); // 1 day in ms

    const { toast } = useToast();
    const { mutateAsync: execute, isPending } = useSignAndExecuteTransaction();

     // --- FUNCIÓN PARA LISTAR EN ALQUILER ---
    const handleListForRent = async () => {
        const rentPriceNum = parseFloat(rentPrice);
        if (isNaN(rentPriceNum) || rentPriceNum <= 0) {
             toast({ variant: 'destructive', title: 'Invalid Price' }); return;
        }
        if (!rentStartDate || !rentEndDate || rentEndDate <= rentStartDate) {
             toast({ variant: 'destructive', title: 'Invalid Dates', description: 'Please select a valid start and end date for the rental.' }); return;
        }

        const tx = new Transaction();
        const functionPrefix = isFraction ? 'list_fraction_for_rent' : 'list_nft_for_rent';
        const functionName = rentCurrency === 'TKT' ? `${functionPrefix}_tkt` : functionPrefix;

        const args = [
            tx.object(nft.objectId),
            tx.pure.u64(BigInt(rentPriceNum * 1e9).toString()),
            tx.pure.u64(rentStartDate.getTime().toString()),
            tx.pure.u64(rentEndDate.getTime().toString()),
        ];
        
        // Los listados de NFTs completos necesitan el Clock para la verificación de expiración
        if (!isFraction) {
            args.push(tx.object(SUI_SYSTEM_CLOCK_OBJECT_ID));
        }

        tx.moveCall({
            target: `${suiConfig.rentalPackageId}::rental_market::${functionName}`,
            arguments: args,
        });

        try {
            await execute({ transaction: tx });
            toast({ title: '✅ Success!', description: `Your asset has been listed for rent in ${rentCurrency}.` });
            setIsRentOpen(false);
            onActionSuccess();
        } catch (error: any) {
            toast({ variant: 'destructive', title: '❌ Rental Listing Failed', description: error.message });
        }
    }


    const handleListForSale = async () => {
        // --- CORRECCIÓN: Se añade esta verificación al principio ---
        if (!providerProfileId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Provider profile ID is missing. Cannot list item.' });
            return;
        }

        const priceAsNumber = parseFloat(price);
        if (isNaN(priceAsNumber) || priceAsNumber <= 0) { 
            toast({ variant: 'destructive', title: 'Invalid Price' }); 
            return; 
        }
        
        const tx = new Transaction();
        const functionName = currency === 'TKT' ? 'list_for_sale_with_tkt' : 'list_for_sale';
        
        // Ahora TypeScript sabe que providerProfileId es un string.
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::${functionName}`,
            arguments: [
                tx.object(providerProfileId), 
                tx.object(nft.objectId), 
                tx.pure.u64(BigInt(priceAsNumber * (10 ** 9)).toString())
            ]
        });

        try {
            await execute({ transaction: tx });
            toast({ title: '✅ Success!', description: `Your experience has been listed for sale in ${currency}.` });
            setIsListOpen(false);
            onActionSuccess();
        } catch (error: any) {
            toast({ variant: 'destructive', title: '❌ Listing Failed', description: error.message });
        }
    }

   const handleUpdateDescription = async () => {
        // --- CORRECCIÓN: Se añade esta verificación al principio ---
        if (!providerProfileId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Provider profile ID is missing.' });
            return;
        }

        if (!newDescription.trim()) { 
            toast({ variant: 'destructive', title: 'Description cannot be empty.' }); 
            return; 
        }

        const tx = new Transaction();
        // Ahora TypeScript sabe que `providerProfileId` es un string y no dará error.
        tx.moveCall({
            target: `${suiConfig.packageId}::experience_nft::update_nft_description`,
            arguments: [ 
                tx.object(providerProfileId), 
                tx.object(nft.objectId), 
                tx.pure.string(newDescription),
                tx.object("0x6") // La función necesita el Clock
            ]
        });

        try {
            await execute({ transaction: tx });
            toast({ title: '✅ Description Updated' });
            setIsEditOpen(false);
            onActionSuccess();
        } catch (error: any) {
            toast({ variant: 'destructive', title: '❌ Update Failed', description: error.message });
        }
    }

    const handleCreateAuction = async () => {
        // --- CORRECCIÓN: Se añade esta verificación al principio ---
        if (!providerProfileId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Provider profile ID is missing for this action.' });
            return;
        }

        const startPriceNum = parseFloat(startPrice);
        if (isNaN(startPriceNum) || startPriceNum <= 0) { 
            toast({ variant: 'destructive', title: 'Invalid start price' }); 
            return; 
        }

        const tx = new Transaction();

        // Ahora TypeScript sabe que providerProfileId es un string
        tx.moveCall({
            target: `${suiConfig.auctionsPackageId}::auctions::create_auction`,
            arguments: [
                tx.object(nft.objectId),
                tx.pure.u64(BigInt(startPriceNum * 1_000_000_000).toString()),
                tx.pure.u64(0), // Reserve price (0 for now)
                tx.pure.u64(BigInt(duration).toString()),
                tx.object(SUI_SYSTEM_CLOCK_OBJECT_ID)
            ]
        });

        try {
            await execute({ transaction: tx });
            toast({ title: '✅ Auction Created!', description: 'Your experience is now up for auction.'});
            setIsAuctionOpen(false);
            onActionSuccess();
        } catch (err: any) {
            toast({ variant: 'destructive', title: '❌ Failed to Create Auction', description: err.message });
        }
    }
    
     const name = nft.display?.data?.name ?? 'Untitled Experience';
    const imageUrl = nft.display?.data?.image_url ?? 'https://placehold.co/400x400?text=No+Image';


    return (
        <Card className="glass-card card-hover flex flex-col group">
            <CardHeader className="p-0">
                <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img src={image_url} alt={name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <CardTitle className="line-clamp-2 text-foreground h-[56px] leading-tight">{name}</CardTitle>
            </CardContent>
            
            <CardFooter className="p-2 border-t">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="w-full btn-sui" disabled={isPending}>
                            {isPending ? <Loader className="w-4 h-4 animate-spin"/> : null}
                            <span className="mx-2">Actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 glass-effect">
                        <Dialog open={isListOpen} onOpenChange={setIsListOpen}>
                           <DialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()}><ListPlus className="mr-2 h-4 w-4" />List for Sale</DropdownMenuItem></DialogTrigger>
                           <DialogContent>
                               <DialogHeader><DialogTitle>List Experience for Sale</DialogTitle></DialogHeader>
                               <div className="py-4 space-y-4">
                                   <RadioGroup defaultValue="SUI" onValueChange={(value: 'SUI' | 'TKT') => setCurrency(value)}>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="SUI" id="r-sui"/><Label htmlFor="r-sui">List in SUI</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="TKT" id="r-tkt"/><Label htmlFor="r-tkt">List in TKT</Label></div>
                                   </RadioGroup>
                                   <div><Label htmlFor="price">Price ({currency})</Label><Input id="price" type="number" placeholder="e.g., 50" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
                               </div>
                               <DialogFooter><Button onClick={handleListForSale} disabled={isPending} className="w-full btn-sui">Confirm Listing</Button></DialogFooter>
                           </DialogContent>
                        </Dialog>
                        <Dialog open={isAuctionOpen} onOpenChange={setIsAuctionOpen}>
                            <DialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()}><Gavel className="mr-2 h-4 w-4" />Start Auction</DropdownMenuItem></DialogTrigger>
                             <DialogContent>
                                <DialogHeader><DialogTitle>Create Auction</DialogTitle><DialogDescription>Set the initial conditions for your auction.</DialogDescription></DialogHeader>
                                <div className="grid gap-6 py-4">
                                    <div className="space-y-2"><Label htmlFor="start-price">Starting Price (SUI)</Label><Input id="start-price" type="number" value={startPrice} onChange={(e) => setStartPrice(e.target.value)} placeholder="e.g., 50" /></div>
                                    <div className="space-y-2"><Label htmlFor="duration">Duration</Label>
                                        <Select onValueChange={setDuration} defaultValue={duration}>
                                            <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                                            <SelectContent><SelectItem value="3600000">1 Hour</SelectItem><SelectItem value="86400000">1 Day</SelectItem><SelectItem value="259200000">3 Days</SelectItem><SelectItem value="604800000">7 Days</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter><Button onClick={handleCreateAuction} disabled={isPending} className="w-full btn-sui">Start Auction</Button></DialogFooter>
                            </DialogContent>
                        </Dialog>
                        {/* --- AÑADIDO: Diálogo para Alquiler --- */}
                        <Dialog open={isRentOpen} onOpenChange={setIsRentOpen}>
                            <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Key className="mr-2 h-4 w-4" /> List for Rent
                                </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>List Asset for Rent</DialogTitle>
                                    <DialogDescription>Set the price and duration for the rental period.</DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <RadioGroup defaultValue="SUI" value={rentCurrency} onValueChange={(value: 'SUI' | 'TKT') => setRentCurrency(value)}>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="SUI" id="r-sui-rent"/><Label htmlFor="r-sui-rent">Rent in SUI</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="TKT" id="r-tkt-rent"/><Label htmlFor="r-tkt-rent">Rent in TKT</Label></div>
                                    </RadioGroup>
                                    <div>
                                        <Label htmlFor="rent-price">Price ({rentCurrency})</Label>
                                        <Input id="rent-price" type="number" placeholder="e.g., 10" value={rentPrice} onChange={(e) => setRentPrice(e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Rental Start Date</Label>
                                            <DatePicker date={rentStartDate} setDate={setRentStartDate} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Rental End Date</Label>
                                            <DatePicker date={rentEndDate} setDate={setRentEndDate} />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleListForRent} disabled={isPending} className="w-full btn-sui">
                                        Confirm Rental Listing
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                            <DialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()}><Edit className="mr-2 h-4 w-4" />Edit Details</DropdownMenuItem></DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Edit Description</DialogTitle></DialogHeader>
                                <div className="py-4"><Label htmlFor="desc">New Description</Label><Textarea id="desc" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={5} /></div>
                                <DialogFooter><Button onClick={handleUpdateDescription} disabled={isPending} className="w-full btn-sui">Update Description</Button></DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    )
}
