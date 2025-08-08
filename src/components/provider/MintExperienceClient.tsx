'use client';

import { useState } from "react";
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { suiConfig } from '@/config/sui';
import { useToast } from "@/hooks/use-toast";
import { WalrusClient, WalrusFile } from "@mysten/walrus";
import { EvolutionRuleBuilder, EvolutionRuleFE } from "@/components/provider/EvolutionRuleBuilder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { Attribute } from "@/lib/types";
import { useEffect } from "react";

// Definimos los tipos aquí para claridad
interface ProviderProfile {
    data: { objectId: string; }
}
type WalrusClientInstance = WalrusClient;

export default function MintExperienceClient() {
    const account = useCurrentAccount();
    const { toast } = useToast();
    const suiClient = useSuiClient();
    
    // --- LÓGICA DE INICIALIZACIÓN DEL CLIENTE WALRUS (SIN HOOK) ---
    const [walrusClient, setWalrusClient] = useState<WalrusClientInstance | null>(null);

    useEffect(() => {
        if (suiClient && account) {
            // Asumimos que si hay una cuenta, la red es correcta porque
            // la página del dashboard (un paso previo) ya lo habría validado.
            // Si quieres máxima seguridad, puedes añadir la comprobación de `activeChain` aquí también.
            const client = new WalrusClient({
                suiClient,
                network: account.chains[0].slice(4) as 'testnet' | 'mainnet',
            });
            setWalrusClient(client);
        } else {
            setWalrusClient(null);
        }
    }, [suiClient, account]);


    const { mutateAsync: signAndExecuteTx } = useSignAndExecuteTransaction();

    // --- ESTADOS PARA EL FORMULARIO ---
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [eventName, setEventName] = useState('');
    const [eventCity, setEventCity] = useState('');
    const [validityDetails, setValidityDetails] = useState('');
    const [experienceType, setExperienceType] = useState('');
    const [tier, setTier] = useState('Standard');
    const [serialNumber, setSerialNumber] = useState('1');
    const [collectionName, setCollectionName] = useState('');
    const [isRedeemable, setIsRedeemable] = useState(true);
    const [expiration, setExpiration] = useState<Date | undefined>();
    const [evolutionRules, setEvolutionRules] = useState<EvolutionRuleFE[]>([]);
    const [isMinting, setIsMinting] = useState(false); // Estado de carga para el botón

    // --- OBTENER EL PERFIL DEL PROVEEDOR ---
    const { data: providerData, isLoading: isLoadingProfile } = useSuiClientQuery(
        'getOwnedObjects', 
        { owner: account?.address!, filter: { StructType: `${suiConfig.packageId}::experience_nft::ProviderProfile` }, limit: 1, options: {showContent: true} },
        { enabled: !!account }
    );
    const providerProfile = providerData?.data?.[0] as ProviderProfile | undefined;
    
    const handleMint = async () => {
        if (!account || !providerProfile || !walrusClient) {
            toast({ variant: 'destructive', title: "Error", description: "La wallet no está conectada o el cliente no está listo." });
            return;
        }
        if (!name || !description || !imageFile) {
            toast({ variant: 'destructive', title: "Formulario Incompleto", description: "Por favor, completa nombre, descripción e imagen." });
            return;
        }

        setIsMinting(true);
        
        try {
            toast({ title: "1/4: Subiendo imagen..." });
            const imageArrayBuffer = await imageFile.arrayBuffer();
            const uint8Array = new Uint8Array(imageArrayBuffer);

            const flow = walrusClient.writeFilesFlow({
                files: [ WalrusFile.from({ contents: uint8Array, identifier: imageFile.name }) ],
            });
            
            await flow.encode();
            
            toast({ title: "2/4: Aprobando transacción de almacenamiento..." });
            const registerTx = flow.register({
                epochs: 5, // Puedes ajustar esto
                owner: account.address,
                deletable: false,
            });
            const registerResult = await signAndExecuteTx({ transaction: registerTx, account });
            
            toast({ title: "3/4: Transfiriendo datos..." });
            await flow.upload({ digest: registerResult.digest });
            
            toast({ title: "4/4: Aprobando transacción de certificación..." });
            const certifyTx = flow.certify();
            const certifyResult = await signAndExecuteTx({ transaction: certifyTx, account });
            console.log('Certificación completada, digest:', certifyResult.digest);

            const files = await flow.listFiles();
            const finalImageUrl = `https://gateway.walrus.space/blobs/${files[0].blobId}`;
            console.log('✅ [MINT] Imagen subida exitosamente. URL:', finalImageUrl);

            toast({ title: "Preparando transacción de minting..." });
            const tx = new Transaction();

            const evolutionRulesForContract = evolutionRules.map(rule => ({
                trigger_type: Number(rule.trigger_type),
                trigger_value: BigInt(rule.trigger_value),
                new_image_url: rule.new_image_url,
                new_description: rule.new_description,
                attributes_to_add: [],
                is_triggered: false,
            }));
            const attributesForContract: Attribute[] = [{ key: "Example", value: "Value" }];
            
            tx.moveCall({
                target: `${suiConfig.packageId}::experience_nft::provider_mint_experience`,
                arguments: [
                    tx.object(providerProfile.data.objectId),
                    tx.pure.string(name),
                    tx.pure.string(description),
                    tx.pure.string(finalImageUrl),
                    tx.pure.string(eventName),
                    tx.pure.string(eventCity),
                    tx.pure.string(validityDetails),
                    tx.pure.string(experienceType),
                    tx.pure.string(tier),
                    tx.pure.u64(serialNumber),
                    tx.pure.string(collectionName),
                    tx.pure(bcs.vector(bcs.struct("Attribute", { key: bcs.string(), value: bcs.string() })).serialize(attributesForContract)),
                    tx.pure.bool(isRedeemable),
                    tx.pure.u64((expiration?.getTime() || 0).toString()),
                    tx.pure(bcs.vector(bcs.struct("EvolutionRule", {
                        trigger_type: bcs.u8(),
                        trigger_value: bcs.u64(),
                        new_image_url: bcs.string(),
                        new_description: bcs.string(),
                        attributes_to_add: bcs.vector(bcs.struct("Attribute", { key: bcs.string(), value: bcs.string() })),
                        is_triggered: bcs.bool(),
                    })).serialize(evolutionRulesForContract)),
                ],
            });
            
            toast({ title: "Por favor, aprueba la transacción final en tu wallet." });
            const mintResult = await signAndExecuteTx({ transaction: tx, account });
            
            const txResult = await suiClient.waitForTransaction({
                digest: mintResult.digest,
                options: { showEffects: true }
            });

            if (txResult.effects?.status.status === 'success') {
                toast({ title: "✅ ¡Experiencia creada exitosamente!" });
            } else {
                throw new Error("La transacción de minting falló en la blockchain.");
            }

        } catch (error: any) {
            toast({ variant: "destructive", title: "❌ Fallo al crear la experiencia", description: error.message || "Ocurrió un error inesperado." });
            console.error("❌ [MINT] Fallo en el proceso:", error);
        } finally {
            setIsMinting(false);
        }
    };
    
    if (isLoadingProfile) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
    }

    if (!providerProfile) {
        return <div className="min-h-screen flex items-center justify-center text-center"><Card className='p-8 glass-card'><CardHeader><CardTitle className='text-destructive flex items-center gap-2'><AlertTriangle />Acceso Denegado</CardTitle><CardDescription className='mt-2'>Debes ser un proveedor registrado para acceder a esta página.</CardDescription></CardHeader></Card></div>
    }

    return (
        <div className="container mx-auto max-w-4xl py-24">
            <h1 className="text-4xl font-bold heading-gradient mb-2">Crear una Nueva Experiencia</h1>
            <p className="text-muted-foreground mb-8">Crea un nuevo NFT on-chain. Rellena los detalles y añade evoluciones para hacerlo dinámico.</p>
            
            <div className="space-y-8">
                <Card className="glass-card">
                    <CardHeader><CardTitle>Información Básica</CardTitle></CardHeader>
                    <CardContent className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2"><Label>Nombre</Label><Input placeholder="Ej: Ticket VIP Concierto Génesis" value={name} onChange={(e) => setName(e.target.value)} /></div>
                        <div className="space-y-2 md:col-span-2"><Label>Descripción</Label><Textarea placeholder="Una descripción detallada de la experiencia..." value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                        <div className="space-y-2 md:col-span-2"><Label>Imagen</Label><Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="pt-2" /></div>
                        <div className="space-y-2"><Label>Nombre del Evento</Label><Input placeholder="Gira Génesis 2025" value={eventName} onChange={(e) => setEventName(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Ciudad del Evento</Label><Input placeholder="Ciudad de México" value={eventCity} onChange={(e) => setEventCity(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Nombre de la Colección</Label><Input placeholder="Tickets Gira Génesis" value={collectionName} onChange={(e) => setCollectionName(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Nivel (Tier)</Label><Input placeholder="VIP" value={tier} onChange={(e) => setTier(e.target.value)} /></div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader><CardTitle>Comportamiento y Validez</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5"><Label>¿Es este NFT Canjeable?</Label><p className="text-sm text-muted-foreground">Actívalo si es un ticket/cupón que se consume al usarse.</p></div>
                            <Switch checked={isRedeemable} onCheckedChange={setIsRedeemable} />
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha de Expiración (Opcional)</Label>
                            <p className="text-sm text-muted-foreground">El NFT no se podrá canjear ni transferir después de esta fecha.</p>
                            <DatePicker date={expiration} setDate={setExpiration} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/>Evoluciones Dinámicas (Opcional)</CardTitle>
                        <CardDescription>Define reglas que cambiarán automáticamente la apariencia o propiedades de este NFT.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <EvolutionRuleBuilder rules={evolutionRules} setRules={setEvolutionRules} />
                    </CardContent>
                </Card>

                <Button size="lg" className="w-full text-lg py-6 btn-sui" onClick={handleMint} disabled={isMinting || !account || !walrusClient}>
                    {isMinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Crear Experiencia (NFT)
                </Button>
            </div>
        </div>
    );
}