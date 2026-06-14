import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { createCredentialUser } from "@/lib/auth-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Nombre, correo y contraseña son obligatorios." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createCredentialUser({
      name,
      email,
      passwordHash,
    });

    return NextResponse.json(
      {
        message: "Usuario registrado correctamente.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "USER_EXISTS") {
      return NextResponse.json(
        { message: "Ya existe un usuario con ese correo." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "No se pudo registrar el usuario." },
      { status: 500 },
    );
  }
}
