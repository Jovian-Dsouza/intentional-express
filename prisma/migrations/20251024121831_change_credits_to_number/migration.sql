/*
  Warnings:

  - Changed the type of `credits` on the `collaboration_posts` table. Converting boolean to integer.

*/
-- AlterTable: Convert boolean credits to integer (true = 1, false = 0)
ALTER TABLE "collaboration_posts" ALTER COLUMN "credits" TYPE INTEGER USING CASE WHEN "credits" = true THEN 1 ELSE 0 END;
