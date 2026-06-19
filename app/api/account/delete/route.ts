import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "../../../../lib/supabase/admin";
import type { Database } from "../../../../lib/supabase/types";

function getPublicSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "Missing Supabase public environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return createClient<Database>(supabaseUrl, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization token." },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "").trim();

    const publicClient = getPublicSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await publicClient.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    const adminClient = createSupabaseAdminClient();
    const userId = user.id;

    // Explicitly delete app-owned data first.
    // Your SQL also uses ON DELETE CASCADE, but this keeps the behavior obvious.
    const deleteCards = await adminClient
      .from("cards")
      .delete()
      .eq("user_id", userId);

    if (deleteCards.error) {
      return NextResponse.json(
        { error: deleteCards.error.message },
        { status: 500 }
      );
    }

    const deleteDecks = await adminClient
      .from("decks")
      .delete()
      .eq("user_id", userId);

    if (deleteDecks.error) {
      return NextResponse.json(
        { error: deleteDecks.error.message },
        { status: 500 }
      );
    }

    const deleteLanguages = await adminClient
      .from("languages")
      .delete()
      .eq("user_id", userId);

    if (deleteLanguages.error) {
      return NextResponse.json(
        { error: deleteLanguages.error.message },
        { status: 500 }
      );
    }

    const { error: deleteUserError } =
      await adminClient.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      return NextResponse.json(
        { error: deleteUserError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not delete account.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}