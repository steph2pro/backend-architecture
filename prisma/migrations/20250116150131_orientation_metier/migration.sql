-- CreateTable
CREATE TABLE "Template_cv" (
    "id" SERIAL NOT NULL,
    "image_apercue" TEXT NOT NULL,
    "options" TEXT[],

    CONSTRAINT "Template_cv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profession" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "Profession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionCategory" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "ProfessionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionComment" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "professionVideoId" INTEGER NOT NULL,
    "professionId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "ProfessionComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionVideo" (
    "id" SERIAL NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "professionId" INTEGER NOT NULL,
    "youtubeId" TEXT NOT NULL,

    CONSTRAINT "ProfessionVideo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Profession" ADD CONSTRAINT "Profession_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProfessionCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profession" ADD CONSTRAINT "Profession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionComment" ADD CONSTRAINT "ProfessionComment_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionComment" ADD CONSTRAINT "ProfessionComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProfessionComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionComment" ADD CONSTRAINT "ProfessionComment_professionVideoId_fkey" FOREIGN KEY ("professionVideoId") REFERENCES "ProfessionVideo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionComment" ADD CONSTRAINT "ProfessionComment_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionVideo" ADD CONSTRAINT "ProfessionVideo_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
