'use client';

import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { suiConfig } from '@/config/sui';
import { Skeleton } from '@/components/ui/skeleton';
import { FractionCard } from '@/components/FractionCard'; // Asumiendo que el componente se llama así y está en esta ruta

// --- Interface para los datos que esperamos del contrato ---
interface FractionFields {
  parent_id: string;      // El ID del NFT original del que proviene la fracción
  parent_name: string;    // Nombre del NFT original
  parent_image_url: string; // URL de la imagen del NFT original
  share: string;          // Porcentaje de propiedad como string (u64)
}

// --- Componente para el estado de carga ---
function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex flex-col space-y-3">
                    <Skeleton className="h-[180px] w-full rounded-xl" />
                    <div className="space-y-2 p-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-8 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function MyFractions() {
    const currentAccount = useCurrentAccount();

    // Query para buscar todos los objetos de tipo 'Fraction' que posee el usuario actual
    const { data, isLoading } = useSuiClientQuery(
        'getOwnedObjects',
        {
            owner: currentAccount?.address!,
            filter: { StructType: `${suiConfig.packageId}::experience_nft::Fraction` },
            options: { showContent: true }
        },
        { 
            // La consulta solo se ejecuta si hay una cuenta conectada
            enabled: !!currentAccount 
        }
    );

    // Muestra un esqueleto de carga mientras se obtienen los datos
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    // Si no hay datos o el array está vacío, no renderiza nada.
    // Esto cumple con el comentario en MyFractionsSection.
    if (!data || data.data.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.data.map((fraction) => {
                if (!fraction.data || fraction.data.content?.dataType !== 'moveObject') {
                    return null;
                }

                // Hacemos una aserción de tipo segura
                const fields = fraction.data.content.fields as unknown as FractionFields;

                return (
                    <FractionCard
                        key={fraction.data.objectId}
                        parentId={fields.parent_id}
                        share={Number(fields.share)} // Convertimos el string a número
                        parentName={fields.parent_name}
                        parentImageUrl={fields.parent_image_url}
                    />
                );
            })}
        </div>
    );
}