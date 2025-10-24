/*
  Warnings:

  - Added the required column `coinName` to the `collaboration_posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coinSymbol` to the `collaboration_posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `collaboration_posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `media` to the `collaboration_posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `collaboration_posts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "collaboration_posts" ADD COLUMN     "coinName" TEXT NOT NULL,
ADD COLUMN     "coinSymbol" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "media" JSONB NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "title" TEXT NOT NULL;
