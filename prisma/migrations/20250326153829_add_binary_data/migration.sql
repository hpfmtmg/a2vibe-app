/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `uploadDate` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `SharedContent` table. All the data in the column will be lost.
  - You are about to drop the column `uploadDate` on the `SharedContent` table. All the data in the column will be lost.
  - Added the required column `fileData` to the `Recipe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileData` to the `SharedContent` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `SharedContent` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Recipe_uploadDate_idx";

-- DropIndex
DROP INDEX "SharedContent_uploadDate_idx";

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "fileUrl",
DROP COLUMN "uploadDate",
ADD COLUMN     "fileData" BYTEA NOT NULL;

-- AlterTable
ALTER TABLE "SharedContent" DROP COLUMN "fileUrl",
DROP COLUMN "uploadDate",
ADD COLUMN     "fileData" BYTEA NOT NULL,
ALTER COLUMN "description" SET NOT NULL;
