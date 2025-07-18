'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

interface PurchaseReceipt {
    objectId: string;
    content: {
        fields: {
            nft_name: string;
            nft_image_url: { fields: { url: string } };
        }
    }
}

export function PurchaseReceiptCard({ receipt }: { receipt: PurchaseReceipt }) {
    const params = useParams();
    const locale = params.locale;
    const { nft_name, nft_image_url } = receipt.content.fields;

    return (
        <Card className="overflow-hidden glass-card flex flex-col">
            <CardContent className="p-0">
                <img src={nft_image_url.fields.url} alt={nft_name} className="w-full h-40 object-cover" />
            </CardContent>
            <CardFooter className="p-4 flex flex-col items-start flex-grow">
                <p className="font-semibold text-foreground flex-grow">{nft_name}</p>
                <Button asChild className="w-full mt-4 btn-sui-outline">
                    <Link href={`/${locale}/review/${receipt.objectId}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Leave a Review
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
