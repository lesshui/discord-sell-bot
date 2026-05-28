import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  { sku: "obsidian-flames-charizard-ex-223-raw-nm", name: "Charizard ex", setName: "Obsidian Flames", cardNumber: "223/197", grade: "Raw NM", baseOfferCents: 4500 },
  { sku: "151-pikachu-173-raw-nm", name: "Pikachu", setName: "151", cardNumber: "173/165", grade: "Raw NM", baseOfferCents: 1800 },
  { sku: "evolving-skies-umbreon-vmax-215-raw-nm", name: "Umbreon VMAX", setName: "Evolving Skies", cardNumber: "215/203", grade: "Raw NM", baseOfferCents: 85000 }
];

async function main() {
  await prisma.appConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" }
  });

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
