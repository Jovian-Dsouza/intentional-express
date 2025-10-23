-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('paid', 'barter', 'both');

-- CreateEnum
CREATE TYPE "WorkStyle" AS ENUM ('contract', 'freestyle');

-- CreateEnum
CREATE TYPE "CreatorType" AS ENUM ('indie', 'org', 'brand');

-- CreateEnum
CREATE TYPE "CompensationType" AS ENUM ('paid', 'barter', 'both');

-- CreateEnum
CREATE TYPE "TimeCommitment" AS ENUM ('ongoing', 'one_time');

-- CreateEnum
CREATE TYPE "CollabStatus" AS ENUM ('open', 'shortlisted', 'signed', 'closed');

-- CreateEnum
CREATE TYPE "PingStatus" AS ENUM ('pending', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'file', 'milestone');

-- CreateTable
CREATE TABLE "collaboration_posts" (
    "id" TEXT NOT NULL,
    "coinAddress" TEXT NOT NULL,
    "creatorWallet" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "credits" BOOLEAN NOT NULL,
    "workStyle" "WorkStyle" NOT NULL,
    "location" TEXT NOT NULL,
    "status" "CollabStatus" NOT NULL DEFAULT 'open',
    "collaborators" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "collaboration_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pings" (
    "id" TEXT NOT NULL,
    "collabPostId" TEXT NOT NULL,
    "pingedWallet" TEXT NOT NULL,
    "interestedRole" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "status" "PingStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "pings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "collabPostId" TEXT NOT NULL,
    "creatorWallet" TEXT NOT NULL,
    "collaboratorWallet" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "senderWallet" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'text',
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collaboration_posts_coinAddress_key" ON "collaboration_posts"("coinAddress");

-- CreateIndex
CREATE INDEX "collaboration_posts_creatorWallet_idx" ON "collaboration_posts"("creatorWallet");

-- CreateIndex
CREATE INDEX "collaboration_posts_coinAddress_idx" ON "collaboration_posts"("coinAddress");

-- CreateIndex
CREATE INDEX "collaboration_posts_status_idx" ON "collaboration_posts"("status");

-- CreateIndex
CREATE INDEX "collaboration_posts_createdAt_idx" ON "collaboration_posts"("createdAt");

-- CreateIndex
CREATE INDEX "collaboration_posts_location_idx" ON "collaboration_posts"("location");

-- CreateIndex
CREATE INDEX "collaboration_posts_paymentType_idx" ON "collaboration_posts"("paymentType");

-- CreateIndex
CREATE INDEX "pings_pingedWallet_idx" ON "pings"("pingedWallet");

-- CreateIndex
CREATE INDEX "pings_status_idx" ON "pings"("status");

-- CreateIndex
CREATE INDEX "pings_createdAt_idx" ON "pings"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "pings_collabPostId_pingedWallet_key" ON "pings"("collabPostId", "pingedWallet");

-- CreateIndex
CREATE INDEX "matches_creatorWallet_idx" ON "matches"("creatorWallet");

-- CreateIndex
CREATE INDEX "matches_collaboratorWallet_idx" ON "matches"("collaboratorWallet");

-- CreateIndex
CREATE INDEX "matches_status_idx" ON "matches"("status");

-- CreateIndex
CREATE INDEX "matches_lastMessageAt_idx" ON "matches"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "matches_collabPostId_collaboratorWallet_key" ON "matches"("collabPostId", "collaboratorWallet");

-- CreateIndex
CREATE INDEX "messages_matchId_idx" ON "messages"("matchId");

-- CreateIndex
CREATE INDEX "messages_senderWallet_idx" ON "messages"("senderWallet");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- AddForeignKey
ALTER TABLE "pings" ADD CONSTRAINT "pings_collabPostId_fkey" FOREIGN KEY ("collabPostId") REFERENCES "collaboration_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_collabPostId_fkey" FOREIGN KEY ("collabPostId") REFERENCES "collaboration_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_id_fkey" FOREIGN KEY ("id") REFERENCES "pings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
