import { NextResponse } from 'next/server';

// Simple providers endpoint for compatibility
export async function GET() {
  return NextResponse.json({
    credentials: {
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials'
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
