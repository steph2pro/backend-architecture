-- AlterTable
ALTER TABLE "Profession" ADD COLUMN     "tabs" TEXT[];

-- AddForeignKey
ALTER TABLE "ProfessionComment" ADD CONSTRAINT "ProfessionComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProfessionComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
