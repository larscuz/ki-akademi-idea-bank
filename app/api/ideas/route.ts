import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  const newIdea = await request.json();

  if (!newIdea.id || !newIdea.client || !newIdea.title) {
    return NextResponse.json(
      { error: "Idea must include id, client, and title." },
      { status: 400 }
    );
  }

  const filePath = path.join(process.cwd(), "data", "ideas.json");
  const file = fs.readFileSync(filePath, "utf-8");
  const ideas = JSON.parse(file);

  ideas.push(newIdea);

  fs.writeFileSync(filePath, JSON.stringify(ideas, null, 2));

  return NextResponse.json(newIdea);
}