import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;
  const role = request.cookies.get("auth_role")?.value;

  // 未登录 → /auth
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // 已登录但非管理员访问 /admin/* → 回首页并带 forbidden 标志
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "?forbidden=1";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
