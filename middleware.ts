import { NextRequest, NextResponse } from "next/server";

const USERNAME = process.env.IDEA_BANK_USER;
const PASSWORD = process.env.IDEA_BANK_PASSWORD;

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const basicAuth = authHeader.split(" ")[1];
    const [user, password] = atob(basicAuth).split(":");

    if (user === USERNAME && password === PASSWORD) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Idea Bank"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};