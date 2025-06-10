import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  role: string;
  exp: number;
  sub: string;
}

export function middleware(request: NextRequest) {
  // Достаём токен из cookies (!!!)
  const token = request.cookies.get('token')?.value;
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  if (!token) {
    // Если нет токена, пропускаем дальше (или можно редирект на /login)
    return NextResponse.next();
  }

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const now = Math.floor(Date.now() / 1000);

    if (decoded.exp && decoded.exp < now) {
      // Токен протух — чистим и редиректим на /login
      const res = NextResponse.redirect(new URL('/login', request.url));
      res.cookies.set('token', '', {
        path: '/',
        maxAge: 0,
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      });
      return res;
    }

    const role = decoded.role?.toLowerCase();

    if (pathname.startsWith('/admin') && role !== 'admin') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/superadmin') && role !== 'superuser') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/dashboard') && role === 'superuser') {
      url.pathname = '/superadmin';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (err) {
    // Ошибка декодирования токена — чистим куку и редиректим на /login
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.set('token', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
    return res;
  }
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/superadmin/:path*'],
};
