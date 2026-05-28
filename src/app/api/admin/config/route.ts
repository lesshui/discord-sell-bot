import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  manualAdminPricing: z.boolean(),
  ruleBasedPricing: z.boolean(),
  aiAssistedPricing: z.boolean(),
  externalApiPricing: z.boolean(),
  labelFeeCents: z.coerce.number().int().min(0),
  termsOfService: z.string().min(20),
  shippingInstructions: z.string().min(20)
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = schema.parse(await request.json());
  const config = await prisma.appConfig.upsert({
    where: { id: "singleton" },
    update: body,
    create: { id: "singleton", ...body }
  });

  return NextResponse.json({ config });
}
