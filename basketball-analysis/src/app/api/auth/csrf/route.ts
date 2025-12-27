import { NextResponse } from 'next/server';

// Simple CSRF token endpoint for compatibility
export async function GET() {
  return NextResponse.json({
    csrfToken: 'mock-csrf-token-' + Date.now()
  });
}
