'use client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Percent, Layers } from 'lucide-react';

interface FractionCardProps {
  parentId: string;
  share: number;
  parentName: string;
  parentImageUrl: string;
}

export function FractionCard({ parentId, share, parentName, parentImageUrl }: FractionCardProps) {
  const params = useParams();
  const locale = params.locale as string;
  return (
    <Link href={`/${locale}/experience/${parentId}`} className="group block h-full">
      <Card className="glass-card card-hover h-full flex flex-col overflow-hidden">
        <div className="aspect-video overflow-hidden">
          <img src={parentImageUrl} alt={parentName} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"/>
        </div>
        <CardContent className="p-4 flex-grow">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Layers className="w-4 h-4"/>Fracción de NFT
            </div>
            <h3 className="font-bold text-lg text-foreground line-clamp-2">{parentName}</h3>
        </CardContent>
        <CardFooter className="p-4 bg-slate-100/50 dark:bg-black/20 border-t">
            <div className="flex items-center text-primary font-bold text-xl">
                <Percent className="w-5 h-5 mr-2"/>
                <span>{share}% de Propiedad</span>
            </div>
        </CardFooter>
      </Card>
    </Link>
  );
}