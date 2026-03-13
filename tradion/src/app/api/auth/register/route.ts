// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/services/user.service";

export async function POST(req: NextRequest) {
  try {
    const { email, password, referralCode } = await req.json() as {
      email: string;
      password: string;
      referralCode?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
    }

    const result = await registerUser(email, password, referralCode);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
