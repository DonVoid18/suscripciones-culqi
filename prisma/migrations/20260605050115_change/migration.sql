/*
  Warnings:

  - The values [PAST_DUE] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `cancel_at_period_end` on the `user_subscriptions` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELED', 'EXPIRED');
ALTER TABLE "public"."user_subscriptions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "user_subscriptions" ALTER COLUMN "status" TYPE "SubscriptionStatus_new" USING ("status"::text::"SubscriptionStatus_new");
ALTER TYPE "SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "public"."SubscriptionStatus_old";
ALTER TABLE "user_subscriptions" ALTER COLUMN "status" SET DEFAULT 'INACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "user_subscriptions" DROP COLUMN "cancel_at_period_end",
ALTER COLUMN "status" SET DEFAULT 'INACTIVE',
ALTER COLUMN "current_period_start" DROP NOT NULL,
ALTER COLUMN "current_period_end" DROP NOT NULL;
