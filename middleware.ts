import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const role = session?.user?.role;

  const isAuthPage = nextUrl.pathname.startsWith("/login");
  const isAdminPage = nextUrl.pathname.startsWith("/admin");
  const isHrPage = nextUrl.pathname.startsWith("/hr");
  const isKaryawanPage = nextUrl.pathname.startsWith("/karyawan");
  const isDashboard = nextUrl.pathname === "/dashboard";

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isAuthPage) {
    if (role === "karyawan") {
      return NextResponse.redirect(new URL("/karyawan/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isAdminPage && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isHrPage && role !== "hr") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isKaryawanPage && role !== "karyawan") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isDashboard && role === "karyawan") {
    return NextResponse.redirect(new URL("/karyawan/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
