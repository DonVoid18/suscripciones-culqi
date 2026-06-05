import { prisma } from "@/shared/infrastructure/libs/prisma";
import { seedPlans } from "./seeds/plans.seed";
import { seedUsers } from "./seeds/users.seed";

async function main() {
  await seedUsers();
  await seedPlans();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
