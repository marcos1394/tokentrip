import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();
    const amountInMist = (parseFloat(amount) * 1e9).toString();

    // Construye la ruta al script
    const scriptPath = path.join(process.cwd(), 'scripts', 'test-quote.ts');
    
    // Ejecuta el script usando tsx
    const command = `npx tsx ${scriptPath} ${amountInMist}`;

    return new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
            if (error || stderr) {
                console.error("Error executing script:", stderr || error);
                // Intenta parsear el error que imprimimos desde el script
                try {
                    const errorJson = JSON.parse(stderr || stdout);
                    resolve(NextResponse.json({ error: errorJson.error || "Script execution failed" }, { status: 500 }));
                } catch (e) {
                     resolve(NextResponse.json({ error: "Script execution failed with unparseable error", details: stderr || stdout }, { status: 500 }));
                }
                return;
            }
            // Si todo va bien, parsea el resultado JSON del script
            const swapResult = JSON.parse(stdout);
            resolve(NextResponse.json(swapResult));
        });
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}