// src/components/provider/EvolutionRuleBuilder.tsx
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, PlusCircle } from "lucide-react";
import { DatePicker } from "../ui/date-picker";

// La estructura de la regla en el frontend
export interface EvolutionRuleFE {
    trigger_type: '0' | '1';
    trigger_value: string;
    new_image_url: string; // Por ahora una URL, luego podemos integrar Walrus
    new_description: string;
}

interface EvolutionRuleBuilderProps {
    rules: EvolutionRuleFE[];
    setRules: React.Dispatch<React.SetStateAction<EvolutionRuleFE[]>>;
}

export function EvolutionRuleBuilder({ rules, setRules }: EvolutionRuleBuilderProps) {

    const addRule = () => {
        setRules([...rules, { trigger_type: '0', trigger_value: '', new_image_url: '', new_description: '' }]);
    };

    const removeRule = (index: number) => {
        setRules(rules.filter((_, i) => i !== index));
    };

    const updateRule = (index: number, field: keyof EvolutionRuleFE, value: any) => {
        const newRules = [...rules];
        if (field === 'trigger_type') {
            newRules[index][field] = value;
            newRules[index].trigger_value = ''; // Reset trigger value on type change
        } else {
            newRules[index][field] = value;
        }
        setRules(newRules);
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
                                <Select value={rule.trigger_type} onValueChange={(value: '0' | '1') => updateRule(index, 'trigger_type', value)}>
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
                                        setDate={(date) => updateRule(index, 'trigger_value', date?.getTime().toString() || '')}
                                    />
                                ) : (
                                    <Input 
                                        type="number"
                                        placeholder="e.g., 50 (reviews)"
                                        value={rule.trigger_value}
                                        onChange={(e) => updateRule(index, 'trigger_value', e.target.value)}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>New Image URL</Label>
                            <Input placeholder="https://... (new image for the NFT)" value={rule.new_image_url} onChange={(e) => updateRule(index, 'new_image_url', e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label>New Description</Label>
                            <Textarea placeholder="The NFT description will evolve to this..." value={rule.new_description} onChange={(e) => updateRule(index, 'new_description', e.target.value)} />
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
