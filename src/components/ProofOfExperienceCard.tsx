// src/components/ProofOfExperienceCard.tsx
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface ProofOfExperience {
    objectId: string;
    content: {
        fields: {
            original_nft_name: string;
            image_url: { fields: { url: string } };
            provider_name: string;
            attended_on_date: string;
        }
    }
}

export function ProofOfExperienceCard({ poe }: { poe: ProofOfExperience }) {
    const { original_nft_name, image_url, provider_name, attended_on_date } = poe.content.fields;
    const attendedDate = new Date(Number(attended_on_date)).toLocaleDateString();

    return (
        <Card className="overflow-hidden glass-card">
            <CardContent className="p-0">
                <img src={image_url.fields.url} alt={original_nft_name} className="w-full h-40 object-cover" />
            </CardContent>
            <CardFooter className="p-4 flex flex-col items-start">
                <p className="font-semibold text-foreground">{original_nft_name}</p>
                <p className="text-sm text-muted-foreground">by {provider_name}</p>
                <p className="text-xs text-muted-foreground mt-2">Attended: {attendedDate}</p>
            </CardFooter>
        </Card>
    );
}
