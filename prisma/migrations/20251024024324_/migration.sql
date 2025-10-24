-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('indie', 'commercial');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('available', 'gigs', 'collabs', 'exploring');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "zoraWalletAddress" TEXT NOT NULL,
    "walletAddress" TEXT,
    "userType" "UserType" NOT NULL,
    "creativeDomains" JSONB NOT NULL,
    "status" "UserStatus" NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "orgName" TEXT,
    "orgType" TEXT,
    "skills" JSONB NOT NULL,
    "onboardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_zoraWalletAddress_key" ON "users"("zoraWalletAddress");

-- CreateIndex
CREATE INDEX "users_zoraWalletAddress_idx" ON "users"("zoraWalletAddress");
