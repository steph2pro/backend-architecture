/*
  Warnings:

  - Added the required column `refreshToken` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "refreshToken",
ADD COLUMN     "refreshToken" JSONB NOT NULL;
