/*
  Warnings:

  - Added the required column `year` to the `LeaveBalance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LeaveBalance" ADD COLUMN     "year" INTEGER NOT NULL;
