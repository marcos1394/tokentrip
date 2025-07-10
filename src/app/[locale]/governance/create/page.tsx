// app/[locale]/governance/create/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiConfig } from '@/config/sui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Componentes
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lightbulb, Loader, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SUI_SYSTEM_CLOCK_OBJECT_ID = "0x6";
const isValidSuiAddress = (address: string) => /^0x[a-fA-F0-9]{64}$/.test(address);

export default function CreateProposalPage() {
    const router = useRouter();
    const { toast } = useToast();
    const currentAccount = useCurrentAccount();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');

    const { mutateAsync: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();

    // Validación en tiempo real del formulario
    const isFormInvalid = useMemo(() => {
        const isAmountValid = amount.trim() !== '' && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
        const isRecipientValid = recipient.trim() !== '' && isValidSuiAddress(recipient);
        return !title.trim() || !description.trim() || !isAmountValid || !isRecipientValid;
    }, [title, description, recipient, amount]);

    // Lógica de transacción corregida y mejorada
    const handleCreateProposal = async () => {
        if (!currentAccount) {
            toast({ variant: 'destructive', title: 'Wallet not connected' });
            return;
        }
        if (isFormInvalid) {
            toast({ variant: 'destructive', title: 'Incomplete or Invalid Form', description: 'Please fill out all fields correctly.' });
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

        try {
            await signAndExecuteTransaction({ transaction: tx });
            toast({ title: '✅ Proposal Created!', description: 'Your proposal has been published on-chain for voting.' });
            router.push(`/governance`); 
        } catch (error: any) {
            toast({ variant: "destructive", title: '❌ Failed to Create Proposal', description: error.message });
        }
    };
    
    return (
        <div className="min-h-screen pt-24 pb-12 bg-background">
            <AnimatedBackground />
            <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8">
                    <Button asChild variant="outline" className="glass-card">
                        <Link href="/governance">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Governance
                        </Link>
                    </Button>
                </div>
                
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold heading-gradient text-balance">Create New Proposal</h1>
                        <p className="text-muted-foreground mt-2">Start a new vote for the TokenTrip community.</p>
                    </div>

                    <Alert className="mb-6 glass-card">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Proposal Requirements</AlertTitle>
                        <AlertDescription>
                            A minimum of <strong>10,000 TKT</strong> is required in your wallet to submit a proposal. This is to prevent spam and is not consumed.
                        </AlertDescription>
                    </Alert>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-2xl text-foreground">Proposal Details</CardTitle>
                            <CardDescription>Describe your idea clearly. Once created, it cannot be modified.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-muted-foreground">Title</Label>
                                <Input id="title" placeholder="e.g., Fund marketing campaign in Asia" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isPending} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-muted-foreground">Description</Label>
                                <Textarea id="description" placeholder="Explain the objective, benefits, and costs of your proposal..." value={description} onChange={(e) => setDescription(e.target.value)} disabled={isPending} rows={6} />
                            </div>
                            
                            <div className="border-t pt-6 space-y-6">
                                <h3 className="text-lg font-semibold text-foreground">Proposed Action: Fund Transfer</h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="recipient" className="text-muted-foreground">Recipient Address</Label>
                                        <Input id="recipient" placeholder="0x..." value={recipient} onChange={(e) => setRecipient(e.target.value)} disabled={isPending} className={`${recipient && !isValidSuiAddress(recipient) ? 'border-destructive' : ''}`}/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount" className="text-muted-foreground">TKT Amount to Transfer</Label>
                                        <Input id="amount" type="number" placeholder="e.g., 50000" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isPending} />
                                    </div>
                                </div>
                            </div>

                            <Button size="lg" className="w-full text-lg py-6 btn-sui" onClick={handleCreateProposal} disabled={isPending || !currentAccount || isFormInvalid}>
                                {isPending ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Lightbulb className="w-5 h-5 mr-2" />}
                                {isPending ? "Submitting..." : "Submit Proposal for Voting"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Toaster />
        </div>
    );
}