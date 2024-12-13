/*
  Warnings:

  - Added the required column `phone` to the `OtpToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OtpToken" ADD COLUMN     "phone" TEXT NOT NULL;
