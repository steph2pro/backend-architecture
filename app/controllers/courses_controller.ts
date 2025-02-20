import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '@prisma/client'
import { messages } from '@vinejs/vine/defaults';

const prisma = new PrismaClient()

export default class CourseController {
  // Créer un nouveau cours
public async store({ request, response }: HttpContext) {
  const { title, description, contenu, duration, interestIds } = request.only(['title', 'userId', 'description', 'thumbnail','contenu', 'duration', 'interestIds'])

  try {
      const course = await prisma.course.create({
          data: {
              title,
              description,
              contenu,
              userId,
              duration,
              courseInterests: {
                  create: interestIds?.map((interestId: number) => ({
                      interest: {
                          connect: { id: interestId }
                      }
                  })) || []
              }
          },
          include: {
              courseInterests: {
                  include: {
                      interest: true
                  }
              }
          }
      })
      return response.status(201).json({ course })
  } catch (error) {
      return response.status(500).json({ message: 'Erreur lors de la création du cours', error: error.message })
  }
}

  // Récupérer tous les cours
  public async index({ response }: HttpContext) {
    try {
      const courses = await prisma.course.findMany({
        include: {
          user: true,
        },
      })
    return response.status(200).json({courses})
    } catch (error) {
      return response.status(500).json({ message: 'Erreur lors de la récupération des cours', error: error.message })
    }
  }

  // Récupérer un cours spécifique par son ID
  public async show({ params, response }: HttpContext) {
    try {
      const course = await prisma.course.findUnique({
        where: { id: parseInt(params.id) }
      })
      if (!course) {
        return response.status(404).json({ message: 'Cours introuvable' })
      }
      return response.status(200).json(course)
    } catch (error) {
      return response.status(500).json({ message: 'Erreur lors de la récupération du cours', error: error.message })
    }
  }

  // Mettre à jour un cours
  public async update({ params, request, response }: HttpContext) {
    const { title, description, contenu, duration, interestIds } = request.only(['title', 'description', 'contenu', 'duration', 'interestIds'])

    try {
        const existingCourse = await prisma.course.findUnique({
            where: { id: parseInt(params.id) },
            include: { courseInterests: true }
        })

        if (!existingCourse) {
            return response.status(404).json({ message: 'Cours introuvable pour la mise à jour' })
        }

        // Mise à jour des informations du cours
        const course = await prisma.course.update({
            where: { id: parseInt(params.id) },
            data: {
                title,
                description,
                contenu,
                duration,
                courseInterests: {
                    deleteMany: {}, // Supprime toutes les relations existantes
                    create: interestIds?.map((interestId: number) => ({
                        interest: {
                            connect: { id: interestId }
                        }
                    })) || []
                }
            },
            include: {
                courseInterests: {
                    include: {
                        interest: true
                    }
                }
            }
        })

        return response.status(200).json(course)
    } catch (error) {
        return response.status(500).json({ message: 'Erreur lors de la mise à jour du cours', error: error.message })
    }
}

  // Supprimer un cours
  public async destroy({ params, response }: HttpContext) {
    try {
      const course = await prisma.course.delete({
        where: { id: parseInt(params.id) }
      })
      return response.status(200).json({ message: 'Cours supprimé avec succès' })
    } catch (error) {
      return response.status(404).json({ message: 'Cours introuvable pour la suppression',error:error.messages })
    }
  }

  // Méthode pour obtenir les cours liées aux centres d'intérêt d'un utilisateur
  public async getCoursesByUserInterests({ params, response }: HttpContext) {
    const userId = parseInt(params.userId)

    try {
      // Vérifier si l'utilisateur existe et récupérer ses centres d'intérêt
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { userInterests: true },
      })

      if (!user) {
        return response.status(404).json({ message: 'Utilisateur non trouvé' })
      }

      // Récupérer les IDs des centres d’intérêt de l'utilisateur
      const interestIds = user.userInterests.map((interest) => interest.interestId)

      let courses

      if (interestIds.length === 0) {
        // Si l'utilisateur n'a aucun centre d'intérêt, retourner tous les cours
        courses = await prisma.course.findMany({
          include: {
            courseInterests: {
              include: {
                interest: true,
              },
            },
            user: true
          },
        })
      } else {
        // Sinon, récupérer les cours liés aux centres d'intérêt de l'utilisateur
        courses = await prisma.course.findMany({
          where: {
            courseInterests: {
              some: {
                interestId: { in: interestIds },
              },
            },
          },
          include: {
            courseInterests: {
              include: {
                interest: true,
              },
            },
            user: true
          },
        })
      }

      return response.status(200).json({ courses })
    } catch (error) {
      return response.status(500).json({ message: 'Erreur lors de la récupération des cours', error: error.message })
    }
  }

}
