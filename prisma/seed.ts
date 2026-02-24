import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed customer
  const customer = await prisma.customer.upsert({
    where: { id: "demo-customer" },
    update: {},
    create: {
      id: "demo-customer",
      companyName: "Tiergesundheit GmbH",
      description:
        "Spezialist für Tiergesundheit und Veterinärprodukte. Wir bieten hochwertige Produkte und Beratung für Haustierbesitzer und Tierärzte.",
      domain: "https://tiergesundheit-gmbh.de",
      guidelinesText:
        "Tone: Fachlich, aber verständlich. Zielgruppe: Tierbesitzer und Tierärzte. Sprache: Deutsch, klar und präzise. Keine medizinischen Diagnosen stellen.",
      exampleText:
        "Wenn Ihr Hund humpelt, kann das viele Ursachen haben. Von einer einfachen Pfotenverletzung bis hin zu ernsteren Erkrankungen wie Arthritis – es ist wichtig, die Ursache zu kennen. In diesem Ratgeber erklären wir Ihnen, wann ein Tierarztbesuch notwendig ist und was Sie selbst tun können.",
    },
  });

  // Seed topic cluster
  const cluster = await prisma.topicCluster.create({
    data: {
      customerId: customer.id,
      name: "Hundgesundheit",
      status: "in_progress",
    },
  });

  // Seed topics
  const topics = await Promise.all([
    prisma.topic.create({
      data: {
        topicClusterId: cluster.id,
        title: "Hund humpelt – Ursachen und Behandlung",
        category: "conversion",
        searchVolumeTotal: 8900,
        keywordCount: 12,
        avgCpc: 1.45,
      },
    }),
    prisma.topic.create({
      data: {
        topicClusterId: cluster.id,
        title: "Gelenkschutz für Hunde",
        category: "produktnah",
        searchVolumeTotal: 3200,
        keywordCount: 8,
        avgCpc: 2.10,
      },
    }),
  ]);

  // Seed keywords for first topic
  await prisma.keyword.createMany({
    data: [
      {
        topicId: topics[0].id,
        keyword: "hund humpelt",
        searchVolume: 5400,
        cpc: 1.20,
        relevant: true,
      },
      {
        topicId: topics[0].id,
        keyword: "hund humpelt hinten links",
        searchVolume: 1900,
        cpc: 1.10,
        relevant: true,
      },
      {
        topicId: topics[0].id,
        keyword: "hund lahmt was tun",
        searchVolume: 880,
        cpc: 1.85,
        relevant: true,
      },
    ],
  });

  console.log("✅ Seed completed successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
