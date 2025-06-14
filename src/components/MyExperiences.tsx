'use client';

import { useSuiClientQuery, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { ExperienceNftCard } from './ExperienceNftCard';
import { AlertCircle, Loader, Ticket, Sprout, Star, Repeat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { suiConfig } from '@/config/sui';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { SuiObjectResponse } from '@mysten/sui/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { Transaction } from '@mysten/sui/transactions';

// Interfaces
interface ExperienceNftFields {
  id: { id: string };
  name: string;
  image_url: { url: string };
  description: string;
}
interface PurchaseReceiptFields {
  id: { id: string };
  listing_id: string;
  provider_id: string;
  nft_name: string;
  nft_image_url: { url: string };
}

export function MyExperiences() {
  const currentAccount = useCurrentAccount();
  const { t } = useTranslation();
  const [cardsVisible, setCardsVisible] = useState(false);
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();
  const { mutate: executeResale, isPending: isResalePending } = useSignAndExecuteTransaction();

  const EXPERIENCE_NFT_TYPE = `${suiConfig.packageId}::experience_nft::ExperienceNFT`;
  const RECEIPT_TYPE = `${suiConfig.packageId}::experience_nft::PurchaseReceipt`;

  const { data, isLoading, isError, error, refetch } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: currentAccount?.address!,
      options: { showContent: true, showDisplay: true },
    },
    { enabled: !!currentAccount, queryKey: ['my-assets', currentAccount?.address] }
  );

  useEffect(() => {
    if (data) {
      setTimeout(() => setCardsVisible(true), 100);
    }
  }, [data]);

  const handleResale = (nftId: string, price: string) => {
    const priceAsNumber = parseFloat(price);
    if (isNaN(priceAsNumber) || priceAsNumber <= 0) {
        toast({ variant: 'destructive', title: 'Precio inválido' });
        return;
    }
    const priceInMist = BigInt(priceAsNumber * 1_000_000_000);
    const tx = new Transaction();
    tx.moveCall({
        target: `${suiConfig.packageId}::experience_nft::list_for_resale`,
        arguments: [ tx.object(nftId), tx.pure.u64(priceInMist) ]
    });
    executeResale({ transaction: tx }, {
        onSuccess: () => {
            toast({ title: '✅ ¡Éxito!', description: 'Tu experiencia ahora está en reventa.'});
            refetch();
        },
        onError: (err) => {
            toast({ variant: 'destructive', title: '❌ Error en la Reventa', description: err.message });
        }
    });
  }

  if (!currentAccount) return null;
  if (isLoading) return ( <div className="flex items-center justify-center py-16"><Loader className="animate-spin" /></div> );
  if (isError) return ( <div className="text-center py-10 text-destructive">{error?.message}</div> );

  // --- CORRECCIÓN: Se aplica el filtro de tipo seguro ---
  const allOwnedObjects = data?.data ?? [];

  const ownedNfts = allOwnedObjects.filter((obj: SuiObjectResponse) => {
    return obj.data?.content?.dataType === 'moveObject' && obj.data.content.type === EXPERIENCE_NFT_TYPE;
  });
  
  const reviewablePurchases = allOwnedObjects.filter((obj: SuiObjectResponse) => {
    return obj.data?.content?.dataType === 'moveObject' && obj.data.content.type === RECEIPT_TYPE;
  });

  if (ownedNfts.length === 0 && reviewablePurchases.length === 0) {
    return (
        <div className="text-center py-16">
            <div className="glass-card border-2 border-dashed border-primary/20 rounded-2xl p-12 max-w-lg mx-auto">
                <Ticket className="w-16 h-16 text-primary mx-auto mb-6" />
                <h3 className="text-xl font-bold text-foreground mb-3">{t("myExperiences.noneFoundTitle")}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("myExperiences.noneFoundDescription")}</p>
            </div>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Mapeo de Recibos de Compra para Calificar */}
      {reviewablePurchases.map((receipt, index) => {
        // La guarda de tipo ya se aplicó en el filtro, pero la repetimos para la seguridad de TypeScript
        if (receipt.data?.content?.dataType !== 'moveObject') return null;
        const fields = receipt.data.content.fields as unknown as PurchaseReceiptFields;
        const receiptId = receipt.data.objectId;
        return (
          <div key={receiptId} className={`flex flex-col gap-2 transform transition-all duration-700 ${cardsVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ transitionDelay: `${(ownedNfts.length + index) * 100}ms` }}>
            <Card className="glass-card h-full flex flex-col overflow-hidden">
              <CardHeader className="p-0"><img src={fields.nft_image_url.url} alt={fields.nft_name} className="w-full h-48 object-cover"/></CardHeader>
              <CardContent className="p-4 flex-grow">
                  <p className="text-sm text-muted-foreground">Compra completada</p>
                  <CardTitle className="text-foreground line-clamp-2">{fields.nft_name}</CardTitle>
              </CardContent>
            </Card>
            <Button asChild className="w-full btn-sui">
                <Link href={`/${locale}/review/${receiptId}`}><Star className="w-4 h-4 mr-2" /> Dejar Calificación</Link>
            </Button>
          </div>
        );
      })}
      
      {/* Mapeo de NFTs para Fraccionar Y REVENDER */}
      {ownedNfts.map((nft, index) => {
        // La guarda de tipo ya se aplicó en el filtro, pero la repetimos
        if (nft.data?.content?.dataType !== 'moveObject') return null;
        const fields = nft.data.content.fields as unknown as ExperienceNftFields;
        const objectId = nft.data.objectId;
        return (
          <div key={objectId} className={`flex flex-col gap-2 transform transition-all duration-700 ${cardsVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ transitionDelay: `${index * 100}ms` }}>
            <ExperienceNftCard nftId={objectId} name={fields.name} imageUrl={fields.image_url.url} />
            <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="w-full card-hover glass-card">
                  <Link href={`/${locale}/fractionalize/${objectId}`}><Sprout className="w-4 h-4 mr-2" /> Fraccionar</Link>
                </Button>
                <ResaleButton nftId={objectId} onResale={handleResale} isPending={isResalePending} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Componente interno para el modal de reventa (sin cambios)
function ResaleButton({ nftId, onResale, isPending }: { nftId: string, onResale: (id: string, price: string) => void, isPending: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [price, setPrice] = useState('');
    const handleConfirm = () => {
        onResale(nftId, price);
        setIsOpen(false);
    }
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full card-hover glass-card"><Repeat className="w-4 h-4 mr-2" /> Revender</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass-effect">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Poner en Reventa</DialogTitle>
                    <DialogDescription>Establece el precio en SUI para revender esta experiencia.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="price" className="text-muted-foreground">Precio de Reventa (SUI)</Label>
                    <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-2" placeholder="Ej: 150.0" />
                </div>
                <DialogFooter>
                    <Button onClick={handleConfirm} disabled={isPending} className="w-full btn-sui">
                        {isPending && <Loader className="w-4 h-4 mr-2 animate-spin"/>}
                        Confirmar y Listar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}