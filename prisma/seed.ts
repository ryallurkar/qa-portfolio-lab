import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const plainPassword = "!password123";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Upsert all five seed users — safe to re-run before each test suite
  const alice = await prisma.user.upsert({
    where: { username: "alice" },
    update: {},
    create: { username: "alice", password: hashedPassword },
  });

  const bob = await prisma.user.upsert({
    where: { username: "bob" },
    update: {},
    create: { username: "bob", password: hashedPassword },
  });

  const carol = await prisma.user.upsert({
    where: { username: "carol" },
    update: {},
    create: { username: "carol", password: hashedPassword },
  });

  const dave = await prisma.user.upsert({
    where: { username: "dave" },
    update: {},
    create: { username: "dave", password: hashedPassword },
  });

  const eve = await prisma.user.upsert({
    where: { username: "eve" },
    update: {},
    create: { username: "eve", password: hashedPassword },
  });

  // Seed a handful of kudos so the wall is never empty on first load.
  // We use createMany with skipDuplicates — but since there's no unique
  // constraint on kudos, we clear existing ones and re-insert instead so
  // the seed stays idempotent without leaving duplicates accumulating.
  await prisma.kudos.deleteMany({});

  await prisma.kudos.createMany({
    data: [
      {
        message: "Alice, your code review feedback is always thorough and kind. Thank you!",
        authorId: bob.id,
        receiverId: alice.id,
      },
      {
        message: "Bob shipped the new auth flow with zero bugs. Absolute legend.",
        authorId: alice.id,
        receiverId: bob.id,
      },
      {
        message: "Carol jumped in to help with the on-call incident at midnight. Heroic effort.",
        authorId: dave.id,
        receiverId: carol.id,
      },
      {
        message: "Dave's documentation PR made onboarding so much smoother for everyone.",
        authorId: eve.id,
        receiverId: dave.id,
      },
      {
        message: "Eve spotted the race condition in the queue consumer before it hit production.",
        authorId: carol.id,
        receiverId: eve.id,
      },
      {
        message: "Alice mentored me through the Prisma migration — couldn't have done it without you.",
        authorId: carol.id,
        receiverId: alice.id,
      },
      {
        message: "Bob's demo at the all-hands was polished and energising. Well done!",
        authorId: eve.id,
        receiverId: bob.id,
      },
    ],
  });

  console.log("Seed complete: 5 users, 7 kudos inserted.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
