import { passwordEncrypt } from "@/shared/infrastructure/libs/password";
import { prisma } from "@/shared/infrastructure/libs/prisma";

export async function seedUsers() {
  // TODO: Add your seed data here
  console.log("Seeding data...");

  const password = "patrick123";
  const passwordEncrypted = await passwordEncrypt(password);

  const verificationEmailActive =
    process.env.VERIFICATION_EMAIL_ACTIVE === "true";

  await prisma.user.create({
    data: {
      name: "patrick",
      email: "patrick@gmail.com",
      password: passwordEncrypted,
      emailVerified: verificationEmailActive ? null : new Date(),
    },
  });
}
