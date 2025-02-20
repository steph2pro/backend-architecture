import type { HttpContext } from '@adonisjs/core/http'

import prisma from '#services/prisma'


export default class UserCoursesController {
  // 🟢 Inscription à un cours
  public async enroll({ request, response }: HttpContext) {
    const { userId, courseId } = request.only(['userId', 'courseId'])

    const existingEnrollment = await prisma.userCourse.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })

    if (existingEnrollment) {
      return response.status(201).json({
        message:'Déjà inscrit à ce cours',
        data: existingEnrollment,
      });
    }

    const enrollment = await prisma.userCourse.create({
      data: { userId, courseId },
    })

    return response.status(201).json({
        message:'vous etes a present inscrit a ce cours',
        data: enrollment,
      });
  }

  // 🟢 Récupérer les cours suivis par un utilisateur
  public async userCourses({ params, response }: HttpContext) {

   const userId = Number(params.userId)

  if (isNaN(userId)) {
    return response.status(400).json({ error: 'Invalid userId' })
  }

  try {
    const userCourses = await prisma.userCourse.findMany({
      where: { userId: userId },
      include: { course: true, user: true, },
    })

    return response.status(200).json({ userCourses })
  } catch (error) {
    return response.status(500).json({ error: 'Internal server error', details: error.message })
  }
  }

  // 🟢 Mettre à jour la progression
  public async updateProgress({ request, response }: HttpContext) {
    const { userId, courseId, progress, status } = request.only([
      'userId',
      'courseId',
      'progress',
      'status',
    ])

    const updatedProgress = await prisma.userCourse.update({
      where: { userId_courseId: { userId, courseId } },
      data: { progress, status },
    })

    return response.status(201).json({updatedProgress})
  }
}
