import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "data", "ideas.json");
  const file = fs.readFileSync(filePath, "utf-8");
  const ideas = JSON.parse(file);

  return NextResponse.json(ideas);
}