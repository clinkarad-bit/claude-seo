import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

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

  // === LINKBUILDING SEED DATA ===

  // Create admin user
  const adminPassword = await hash(
    process.env.ADMIN_INITIAL_PASSWORD || "admin1234567!",
    12
  );
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_INITIAL_EMAIL || "admin@leadsite.de" },
    update: {},
    create: {
      id: "admin-user",
      email: process.env.ADMIN_INITIAL_EMAIL || "admin@leadsite.de",
      passwordHash: adminPassword,
      name: "Admin",
      role: "admin",
    },
  });

  // Create demo employee
  const empPassword = await hash("mitarbeiter123!", 12);
  const employee = await prisma.user.upsert({
    where: { email: "mitarbeiter@leadsite.de" },
    update: {},
    create: {
      id: "demo-employee",
      email: "mitarbeiter@leadsite.de",
      passwordHash: empPassword,
      name: "Max Mustermann",
      role: "employee",
    },
  });

  // Create demo LB project
  const lbProject = await prisma.lBProject.upsert({
    where: { id: "demo-lb-project" },
    update: {},
    create: {
      id: "demo-lb-project",
      name: "Tiergesundheit GmbH - Linkbuilding Q1",
      domain: "tiergesundheit-gmbh.de",
      url: "https://tiergesundheit-gmbh.de",
      brandKeywords: JSON.stringify([
        "Tiergesundheit GmbH",
        "tiergesundheit-gmbh",
      ]),
      customerId: customer.id,
      status: "active",
    },
  });

  // Add both users as project members
  await prisma.lBProjectMember.upsert({
    where: {
      userId_projectId: {
        userId: admin.id,
        projectId: lbProject.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      projectId: lbProject.id,
      role: "owner",
    },
  });

  await prisma.lBProjectMember.upsert({
    where: {
      userId_projectId: {
        userId: employee.id,
        projectId: lbProject.id,
      },
    },
    update: {},
    create: {
      userId: employee.id,
      projectId: lbProject.id,
      role: "member",
    },
  });

  // Create demo backlinks
  const demoBacklinks = [
    {
      projectId: lbProject.id,
      sourceUrl: "https://www.tierarzt-magazin.de/ratgeber/gelenkgesundheit",
      sourceDomain: "tierarzt-magazin.de",
      targetUrl: "https://tiergesundheit-gmbh.de/produkte/gelenke",
      anchorText: "Gelenkpräparate für Hunde",
      linkType: "dofollow",
      category: "Gastbeitrag",
      domainRating: 52.0,
      isActive: true,
    },
    {
      projectId: lbProject.id,
      sourceUrl: "https://www.haustier-forum.de/threads/hundefutter-empfehlung",
      sourceDomain: "haustier-forum.de",
      targetUrl: "https://tiergesundheit-gmbh.de",
      anchorText: "Tiergesundheit GmbH",
      linkType: "nofollow",
      category: "Forum",
      domainRating: 35.0,
      isActive: true,
    },
    {
      projectId: lbProject.id,
      sourceUrl:
        "https://www.presseportal.de/pm/tiergesundheit-neue-produktlinie",
      sourceDomain: "presseportal.de",
      targetUrl: "https://tiergesundheit-gmbh.de/news/produktlinie-2026",
      anchorText: "zur Pressemitteilung",
      linkType: "dofollow",
      category: "PR",
      domainRating: 78.0,
      isActive: true,
    },
    {
      projectId: lbProject.id,
      sourceUrl:
        "https://www.branchenbuch-online.de/tiergesundheit-gmbh-berlin",
      sourceDomain: "branchenbuch-online.de",
      targetUrl: "https://tiergesundheit-gmbh.de",
      anchorText: "Tiergesundheit GmbH Berlin",
      linkType: "dofollow",
      category: "Verzeichnis",
      domainRating: 41.0,
      isActive: true,
    },
    {
      projectId: lbProject.id,
      sourceUrl: "https://blog.hundeliebe.com/beste-nahrungsergaenzung",
      sourceDomain: "hundeliebe.com",
      targetUrl: "https://tiergesundheit-gmbh.de/shop",
      anchorText: "hier bestellen",
      linkType: "dofollow",
      category: "Blog",
      domainRating: 28.0,
      isActive: true,
    },
  ];

  for (const bl of demoBacklinks) {
    await prisma.lBBacklink.create({ data: bl });
  }

  // Create a demo snapshot
  await prisma.lBBacklinkSnapshot.create({
    data: {
      projectId: lbProject.id,
      totalBacklinks: 5,
      dofollowCount: 4,
      nofollowCount: 1,
      avgDR: 46.8,
      referringDomains: 5,
      newBacklinks: 5,
      lostBacklinks: 0,
    },
  });

  // Create demo mentions
  await prisma.lBBrandMention.createMany({
    data: [
      {
        projectId: lbProject.id,
        sourceUrl:
          "https://www.petmagazin.de/artikel/top-anbieter-tiergesundheit",
        sourceDomain: "petmagazin.de",
        title: "Top 10 Anbieter für Tiergesundheit 2026",
        snippet:
          "...die Tiergesundheit GmbH zählt zu den führenden Anbietern im Bereich der Nahrungsergänzung...",
        hasLink: false,
        source: "dataforseo",
        status: "new",
      },
      {
        projectId: lbProject.id,
        sourceUrl: "https://www.vet-news.de/news/berliner-startup-expandiert",
        sourceDomain: "vet-news.de",
        title: "Berliner Startup expandiert nach Süddeutschland",
        snippet:
          "...Tiergesundheit GmbH eröffnet neuen Standort in München...",
        hasLink: true,
        source: "firehose",
        status: "new",
      },
    ],
  });

  // Create demo broken links
  await prisma.lBBrokenLink.create({
    data: {
      projectId: lbProject.id,
      sourceUrl:
        "https://www.tierarzt-verzeichnis.de/empfehlungen/nahrungsergaenzung",
      sourceDomain: "tierarzt-verzeichnis.de",
      brokenUrl: "https://altes-tierfutter.de/gelenke-hunde",
      anchorText: "Gelenkpräparate für Hunde",
      topicRelevance: 0.92,
      suggestedUrl: "https://tiergesundheit-gmbh.de/produkte/gelenke",
      httpStatus: 404,
      domainRating: 55.0,
      status: "found",
    },
  });

  // Create demo contacts
  await prisma.lBContact.create({
    data: {
      projectId: lbProject.id,
      domain: "tierarzt-magazin.de",
      pageUrl: "https://www.tierarzt-magazin.de/kontakt",
      name: "Dr. Lisa Schmidt",
      email: "redaktion@tierarzt-magazin.de",
      position: "Chefredakteurin",
      source: "hunter.io",
      outreachStatus: "contacted",
      notes: "Erster Kontakt per E-Mail am 10.03.2026",
    },
  });

  console.log("✅ Seed completed successfully");
  console.log("   Admin: admin@leadsite.de / admin1234567!");
  console.log("   Employee: mitarbeiter@leadsite.de / mitarbeiter123!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
