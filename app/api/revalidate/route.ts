import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const secret = request.headers.get("x-webhook-secret");

  if (!secret || secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ revalidated: false }, { status: 401 });
  }

  revalidatePath("/en");
  revalidatePath("/ar");

  return NextResponse.json({ revalidated: true });
}
