import { NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { dispatchDueReminders } from "@/app/lib/reminders/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  const alt = request.headers.get("x-cron-secret");
  return alt === secret;
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}

async function run(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const counts = await dispatchDueReminders(admin);
    return NextResponse.json(counts);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to dispatch reminders.",
      },
      { status: 500 },
    );
  }
}
