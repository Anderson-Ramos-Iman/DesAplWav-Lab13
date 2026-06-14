import { NextResponse } from "next/server";
import { getLoginAttemptStatus } from "@/lib/auth-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { message: "El correo es obligatorio." },
      { status: 400 },
    );
  }

  const status = await getLoginAttemptStatus(email);

  return NextResponse.json(status);
}
