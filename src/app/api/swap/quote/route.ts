import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();
    const amountInMist = (parseFloat(amount) * 1e9).toString();

    const scriptPath = path.join(process.cwd(), 'scripts', 'test-quote.ts');
    
    // Construye la ruta completa al ejecutable de tsx dentro de node_modules
const tsxPath = path.join(process.cwd(), 'node_modules', '.bin', 'tsx');
const command = `${tsxPath} ${scriptPath} ${amountInMist}`;

    // --- INICIA CORRECCIÓN ---
    // Se envuelve `exec` en una Promise para poder usar `await`
    const scriptOutput = await new Promise<string>((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error || stderr) {
                // Si hay un error, se rechaza la promesa con el stderr o el error
                reject(new Error(stderr || error?.message));
                return;
            }
            // Si todo va bien, se resuelve con la salida estándar
            resolve(stdout);
        });
    });
    
    // Ahora que tenemos la salida, la parseamos y la retornamos
    const swapResult = JSON.parse(scriptOutput);
    return NextResponse.json(swapResult);
    // --- FIN CORRECCIÓN ---

  } catch (error: any) {
    console.error("API Error executing script:", error);
    return NextResponse.json({ error: error.message || "Failed to execute script" }, { status: 500 });
  }
}