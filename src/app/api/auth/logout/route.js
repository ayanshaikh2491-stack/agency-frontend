import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, data: { message: 'Logged out successfully' } },
      { status: 200 }
    )

    // Clear both legacy session_token + new sb-access-token cookies
    response.cookies.set('session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    response.cookies.set('sb-access-token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
