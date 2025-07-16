// src/app/api/salt/route.ts
import { NextResponse } from 'next/server';
import { generateRandomness } from '@mysten/sui/zklogin';

export async function POST() {
  try {
    const salt = generateRandomness();
    // En una aplicación de producción, guardarías este salt en tu base de datos
    // asociado al 'subject' del usuario de Google/Twitch para recuperarlo en futuros logins.
    return NextResponse.json({ salt }, { status: 200 });
  } catch (error) {
    console.error('Salt generation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
