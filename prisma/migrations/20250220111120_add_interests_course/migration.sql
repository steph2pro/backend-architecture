-- CreateTable
CREATE TABLE "CourseInterests" (
    "courseId" INTEGER NOT NULL,
    "interestId" INTEGER NOT NULL,

    CONSTRAINT "CourseInterests_pkey" PRIMARY KEY ("courseId","interestId")
);

-- AddForeignKey
ALTER TABLE "CourseInterests" ADD CONSTRAINT "CourseInterests_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseInterests" ADD CONSTRAINT "CourseInterests_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
