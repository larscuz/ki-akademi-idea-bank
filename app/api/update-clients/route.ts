import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  const updatedClients = await request.json();

  if (!Array.isArray(updatedClients)) {
    return NextResponse.json(
      { error: "Expected an array of clients." },
      { status: 400 }
    );
  }

  const filePath = path.join(process.cwd(), "data", "clients.json");

  fs.writeFileSync(filePath, JSON.stringify(updatedClients, null, 2));

  return NextResponse.json({ ok: true, clients: updatedClients });
}