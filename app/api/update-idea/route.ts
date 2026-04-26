import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  const updatedIdea = await request.json();

  if (!updatedIdea.id) {
    return NextResponse.json(
      { error: "Idea must include id." },
      { status: 400 }
    );
  }

  const filePath = path.join(process.cwd(), "data", "ideas.json");
  const file = fs.readFileSync(filePath, "utf-8");
  const ideas = JSON.parse(file);

  const index = ideas.findIndex((idea: any) => idea.id === updatedIdea.id);

  if (index === -1) {
    return NextResponse.json(
      { error: "Idea not found." },
      { status: 404 }
    );
  }

  ideas[index] = updatedIdea;

  fs.writeFileSync(filePath, JSON.stringify(ideas, null, 2));

  return NextResponse.json(updatedIdea);
}