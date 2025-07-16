// src/app/api/zk-proof/route.ts
import { NextRequest, NextResponse } from 'next/server';

const ZKP_PROVER_URL = 'https://prover.mystenlabs.com/v1';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const proverResponse = await fetch(ZKP_PROVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const proof = await proverResponse.json();

    if (!proverResponse.ok) {
        return NextResponse.json({ error: 'Failed to generate ZK Proof', details: proof }, { status: proverResponse.status });
    }

    return NextResponse.json(proof, { status: 200 });

  } catch (error) {
    console.error('ZKP Proof generation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
