/*
  Warnings:

  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `posts` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "IntentType" AS ENUM ('collaboration', 'hiring', 'networking', 'dating');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "IntentStatus" AS ENUM ('pending_payment', 'active', 'matched', 'expired', 'burned');

-- CreateEnum
CREATE TYPE "SwipeAction" AS ENUM ('right', 'left');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('pending', 'finalizing', 'finalized', 'expired');

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_authorId_fkey";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "createdAt",
DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "updatedAt",
ADD COLUMN     "creatorCoinAddress" TEXT,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "onboardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "profileCachedAt" TIMESTAMP(3),
ADD COLUMN     "reputationScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reputationTier" TEXT NOT NULL DEFAULT 'newcomer',
ADD COLUMN     "settings" JSONB NOT NULL DEFAULT '{"reputationModeDefault":false,"notificationsEnabled":true,"privacyLevel":"public"}',
ADD COLUMN     "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalIntentsCreated" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalMatches" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "zoraAvatar" TEXT,
ADD COLUMN     "zoraBio" TEXT,
ADD COLUMN     "zoraUsername" TEXT;

-- DropTable
DROP TABLE "posts";

-- CreateTable
CREATE TABLE "intents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "IntentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "reputationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "IntentStatus" NOT NULL DEFAULT 'pending_payment',
    "images" JSONB NOT NULL DEFAULT '[]',
    "video" JSONB,
    "tags" TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "activationFee" TEXT,
    "activationFeeUsd" TEXT,
    "paymentAddress" TEXT,
    "paymentExpiresAt" TIMESTAMP(3),
    "paymentTxHash" TEXT,
    "onChainTxHash" TEXT,
    "smartContractAddress" TEXT,
    "burnTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "matchedAt" TIMESTAMP(3),

    CONSTRAINT "intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swipes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "targetIntentId" TEXT NOT NULL,
    "action" "SwipeAction" NOT NULL,
    "viewDuration" INTEGER,
    "mediaViewed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "swipedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "swipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "intent1Id" TEXT NOT NULL,
    "intent2Id" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'pending',
    "finalizeTxHash" TEXT,
    "burnedAt" TIMESTAMP(3),
    "chatSessionId" TEXT,
    "chatExpiresAt" TIMESTAMP(3),
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "encryptionKey" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "messagesExchanged" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "terminatedAt" TIMESTAMP(3),

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intents_userId_status_idx" ON "intents"("userId", "status");

-- CreateIndex
CREATE INDEX "intents_status_expiresAt_idx" ON "intents"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "intents_type_publishedAt_idx" ON "intents"("type", "publishedAt");

-- CreateIndex
CREATE INDEX "intents_visibility_status_idx" ON "intents"("visibility", "status");

-- CreateIndex
CREATE INDEX "swipes_userId_intentId_idx" ON "swipes"("userId", "intentId");

-- CreateIndex
CREATE INDEX "swipes_targetIntentId_action_idx" ON "swipes"("targetIntentId", "action");

-- CreateIndex
CREATE UNIQUE INDEX "swipes_intentId_targetIntentId_key" ON "swipes"("intentId", "targetIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "matches_chatSessionId_key" ON "matches"("chatSessionId");

-- CreateIndex
CREATE INDEX "matches_user1Id_status_idx" ON "matches"("user1Id", "status");

-- CreateIndex
CREATE INDEX "matches_user2Id_status_idx" ON "matches"("user2Id", "status");

-- CreateIndex
CREATE INDEX "matches_status_matchedAt_idx" ON "matches"("status", "matchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "matches_intent1Id_intent2Id_key" ON "matches"("intent1Id", "intent2Id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_sessions_matchId_key" ON "chat_sessions"("matchId");

-- CreateIndex
CREATE INDEX "chat_sessions_active_expiresAt_idx" ON "chat_sessions"("active", "expiresAt");

-- AddForeignKey
ALTER TABLE "intents" ADD CONSTRAINT "intents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_targetIntentId_fkey" FOREIGN KEY ("targetIntentId") REFERENCES "intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_intent1Id_fkey" FOREIGN KEY ("intent1Id") REFERENCES "intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_intent2Id_fkey" FOREIGN KEY ("intent2Id") REFERENCES "intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
