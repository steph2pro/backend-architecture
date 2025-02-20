-- CreateTable
CREATE TABLE "ProfessionInterests" (
    "professionId" INTEGER NOT NULL,
    "interestId" INTEGER NOT NULL,

    CONSTRAINT "ProfessionInterests_pkey" PRIMARY KEY ("professionId","interestId")
);

-- AddForeignKey
ALTER TABLE "ProfessionInterests" ADD CONSTRAINT "ProfessionInterests_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionInterests" ADD CONSTRAINT "ProfessionInterests_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
