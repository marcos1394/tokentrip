import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// NOTA: Para asegurar este endpoint en producción, se necesitaría un mecanismo
// para verificar que la petición viene del dueño de la sui_address (ej. firmando un mensaje).
// Por ahora, confiamos en que solo el frontend autenticado hará la llamada.

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

// Función para OBTENER los ajustes actuales de un usuario
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const suiAddress = searchParams.get('suiAddress');

    if (!suiAddress) {
        return NextResponse.json({ error: 'Sui address is required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('notification_settings')
            .select('*')
            .eq('sui_address', suiAddress)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

// Función para GUARDAR O ACTUALIZAR los ajustes de un usuario
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { sui_address, email, ...settings } = body;

        if (!sui_address) {
            return NextResponse.json({ error: 'Sui address is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('notification_settings')
            .upsert({
                sui_address,
                email,
                ...settings
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
