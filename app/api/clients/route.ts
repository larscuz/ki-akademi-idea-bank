import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  const body = await request.json();

  const filePath = path.join(process.cwd(), "data", "clients.json");
  const file = fs.readFileSync(filePath, "utf-8");
  const clients = JSON.parse(file);

  const newClient = {
    id: body.name.toLowerCase().replaceAll(" ", "-"),
    name: body.name
  };

  clients.push(newClient);

  fs.writeFileSync(filePath, JSON.stringify(clients, null, 2));

  return NextResponse.json(newClient);
}