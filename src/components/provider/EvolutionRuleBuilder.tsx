'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, PlusCircle, UploadCloud, Loader2 } from "lucide-react";
import { DatePicker } from "../ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { WalrusClient, WalrusFile } from "@mysten/walrus";
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";

// Estructura de la regla en el frontend
export interface EvolutionRuleFE {
    trigger_type: '0' | '1'; // 0: Time, 1: Goal
    trigger_value: string;
    new_image_file: File | null; // Guardamos el archivo
    new_image_url: string; // URL después de subirlo
    new_image_blob_object_id: string; // ID del Blob
    new_description: string;
}

interface EvolutionRuleBuilderProps {
    rules: EvolutionRuleFE[];
    setRules: React.Dispatch<React.SetStateAction<EvolutionRuleFE[]>>;
    walrusClient: WalrusClient | null; // Necesitamos el cliente de Walrus
}

export function EvolutionRuleBuilder({ rules, setRules, walrusClient }: EvolutionRuleBuilderProps) {
    const { toast } = useToast();
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutateAsync: signAndExecuteTx } = useSignAndExecuteTransaction();
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

    const addRule = () => {
        setRules([...rules, {
            trigger_type: '0', 
            trigger_value: '', 
            new_image_file: null,
            new_image_url: '', 
            new_image_blob_object_id: '',
            new_description: '',
        }]);
    };

    const removeRule = (index: number) => {
        setRules(rules.filter((_, i) => i !== index));
    };

    const updateRuleField = (index: number, field: keyof EvolutionRuleFE, value: any) => {
        const newRules = [...rules];
        const ruleToUpdate = { ...newRules[index], [field]: value };

        if (field === 'trigger_type') {
            ruleToUpdate.trigger_value = ''; // Resetear valor al cambiar tipo
        }

        newRules[index] = ruleToUpdate;
        setRules(newRules);
    };
    
    // --- NUEVA LÓGICA PARA SUBIR LA IMAGEN DE LA EVOLUCIÓN ---
    const handleEvolutionImageUpload = async (index: number, file: File) => {
        if (!walrusClient || !account) {
            toast({ variant: "destructive", title: "Error", description: "Walrus client not ready or wallet not connected." });
            return;
        }
        setUploadingIndex(index);
        try {
            toast({ title: `Uploading evolution image #${index + 1}...`});
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const flow = walrusClient.writeFilesFlow({
                files: [WalrusFile.from({ contents: uint8Array, identifier: file.name })]
            });
            await flow.encode();
            
            const registerTx = flow.register({ epochs: 5, owner: account.address, deletable: false });
            const registerResult = await signAndExecuteTx({ transaction: registerTx, account });

            const txResultRegister = await suiClient.waitForTransaction({ digest: registerResult.digest, options: { showObjectChanges: true } });
            const createdBlobObject = txResultRegister.objectChanges?.find(
                (change) => change.type === 'created' && change.objectType.includes('::blob::Blob')
            );
            if (!createdBlobObject || !('objectId' in createdBlobObject)) {
                throw new Error("Could not find the Blob Object ID.");
            }
            const blobId = createdBlobObject.objectId;

            await flow.upload({ digest: registerResult.digest });
            const certifyTx = flow.certify();
            await signAndExecuteTx({ transaction: certifyTx, account });
            const files = await flow.listFiles();
            const imageUrl = `https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-object-id/${blobId}`;
            
            // Actualizamos la regla con los datos obtenidos
            const newRules = [...rules];
            newRules[index].new_image_url = imageUrl;
            newRules[index].new_image_blob_object_id = blobId;
            setRules(newRules);

            toast({ title: `✅ Image #${index + 1} Uploaded!`});

        } catch (error: any) {
            toast({ variant: "destructive", title: "Upload Failed", description: error.message });
        } finally {
            setUploadingIndex(null);
        }
    };

    return (
        <div className="space-y-4">
            {rules.map((rule, index) => (
                <Card key={index} className="bg-muted/30">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Evolution Rule #{index + 1}</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => removeRule(index)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Trigger Type</Label>
                                <Select value={rule.trigger_type} onValueChange={(value: '0' | '1') => updateRuleField(index, 'trigger_type', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select trigger..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Time-Based</SelectItem>
                                        <SelectItem value="1">Goal-Based (e.g., # of Reviews)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>{rule.trigger_type === '0' ? 'Trigger Date' : 'Trigger Value'}</Label>
                                {rule.trigger_type === '0' ? (
                                    <DatePicker 
                                        date={rule.trigger_value ? new Date(Number(rule.trigger_value)) : undefined}
                                        setDate={(date) => updateRuleField(index, 'trigger_value', date?.getTime().toString() || '')}
                                    />
                                ) : (
                                    <Input 
                                        type="number"
                                        placeholder="e.g., 50 (reviews)"
                                        value={rule.trigger_value}
                                        onChange={(e) => updateRuleField(index, 'trigger_value', e.target.value)}
                                    />
                                )}
                            </div>
                        </div>
                        
                        {/* --- CAMBIO PRINCIPAL: AHORA SE SUBE UN ARCHIVO --- */}
                        <div className="space-y-2">
                            <Label>New Image for Evolution</Label>
                            {rule.new_image_url ? (
                                <div className="flex items-center gap-2">
                                    <img src={rule.new_image_url} alt="Preview" className="w-16 h-16 rounded-md border"/>
                                    <p className="text-sm text-green-500">Image uploaded successfully.</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Input 
                                        type="file" 
                                        accept="image/*,video/*"
                                        className="pt-2 flex-grow"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                updateRuleField(index, 'new_image_file', file)
                                            }
                                        }}
                                    />
                                    <Button 
                                        onClick={() => rule.new_image_file && handleEvolutionImageUpload(index, rule.new_image_file)}
                                        disabled={!rule.new_image_file || uploadingIndex !== null}
                                    >
                                        {uploadingIndex === index ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4" />}
                                    </Button>
                                </div>
                            )}
                        </div>

                         <div className="space-y-2">
                            <Label>New Description</Label>
                            <Textarea placeholder="The NFT description will evolve to this..." value={rule.new_description} onChange={(e) => updateRuleField(index, 'new_description', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>
            ))}
            <Button variant="outline" className="w-full border-dashed" onClick={addRule}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Evolution Rule
            </Button>
        </div>
    );
}