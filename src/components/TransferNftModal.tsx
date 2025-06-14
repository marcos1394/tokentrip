 // src/components/TransferNftModal.tsx

'use client';

import { useState } from 'react';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast" // Asumiendo que usas shadcn/ui toast

interface TransferNftModalProps {
    objectId: string; // El ID del NFT a transferir
    onSuccess: () => void; // Función para llamar si la transferencia es exitosa (ej. para refrescar datos)
}

export function TransferNftModal({ objectId, onSuccess }: TransferNftModalProps) {
    const { t } = useTranslation();
    const { toast } = useToast(); // Hook para mostrar notificaciones
    const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
    const [recipientAddress, setRecipientAddress] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    
    const handleTransfer = () => {
        if (!recipientAddress || !objectId) {
        toast({
            variant: "destructive",
            title: "Error de Validación",
            description: "Por favor, ingresa una dirección de destinatario válida.",
        });
        return;
    }

    const tx = new Transaction();
    tx.transferObjects(
        [tx.object(objectId)],// El objeto a transferir (envuelto en tx.object)
        tx.pure.address(recipientAddress) // La dirección del destinatario
        );
        signAndExecuteTransaction(
            {
                transaction: tx,
            },
            {
                onSuccess: (result) => {
                    console.log('Transferencia exitosa! Digest:', result.digest);
                    toast({
                        title: "¡Transferencia Exitosa!",
                        description: `El NFT ha sido enviado a la nueva dirección. Digest: ${result.digest.slice(0, 10)}...`,
                    });
                    setIsOpen(false); // Cierra el modal
                    onSuccess(); // Llama a la función de éxito (ej. para refrescar)
                    },
                    onError: (error) => {
                        console.error('Error en la transferencia:', error);
                        toast({
                            variant: "destructive",
                            title: "Error en la Transferencia",
                            description: error.message || "No se pudo completar la transacción.",
                        });
                    },
                }
            );
        };

        return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="lg" variant="secondary" className="w-full">
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Transferir
                    </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900">
                        <DialogHeader>
                            <DialogTitle>Transferir ExperienceNFT</DialogTitle>
                            <DialogDescription>
                                Ingresa la dirección de la billetera Sui a la que deseas enviar este NFT. Esta acción es irreversible.
                                </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="recipient" className="text-right">
                                            Destinatario
                                            </Label>
                                            <Input id="recipient" placeholder="0x..." value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} className="col-span-3"/>
                                            </div>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button type="button" variant="secondary">
                                                        Cancelar
                                                        </Button>
                                                        </DialogClose>
                                                        <Button type="button" onClick={handleTransfer} disabled={isPending}>
                                                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            {isPending ? 'Transfiriendo...' : 'Confirmar Transferencia'}
                                                            </Button>
                                                            </DialogFooter>
                                                            </DialogContent>
                                                            </Dialog>
                                                            );
                                                        } 