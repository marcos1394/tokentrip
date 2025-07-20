// src/components/dashboard/RentedReceiptCard.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

// La data que recibe este componente viene de un objeto RentalReceipt
export function RentedReceiptCard({ receipt }: { receipt: any }) {
    const fields = receipt.content.fields;
    const startDate = new Date(Number(fields.start_timestamp_ms)).toLocaleDateString();
    const endDate = new Date(Number(fields.end_timestamp_ms)).toLocaleDateString();

    return (
        <Card className="glass-card">
            <CardHeader className="p-0">
                <img src={fields.parent_nft_image_url.fields.url} alt={fields.parent_nft_name} className="w-full h-40 object-cover rounded-t-lg" />
            </CardHeader>
            <CardContent className="p-4">
                <CardTitle className="truncate text-md">{fields.parent_nft_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2 text-xs">
                    <Calendar className="w-4 h-4" /> Valid: {startDate} - {endDate}
                </CardDescription>
            </CardContent>
        </Card>
    );
}
