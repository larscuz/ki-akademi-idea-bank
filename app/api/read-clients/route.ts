import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "data", "clients.json");
  const file = fs.readFileSync(filePath, "utf-8");
  const clients = JSON.parse(file);

  return NextResponse.json(clients);
}