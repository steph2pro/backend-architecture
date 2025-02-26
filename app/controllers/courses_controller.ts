import ResourceService from '#services/ressource_service';
import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '@prisma/client'
import { messages } from '@vinejs/vine/defaults';

const prisma = new PrismaClient()

export default class CourseController {
  // Créer un nouveau cours
public async store({ request, response }: HttpContext) {
    try {
      // Extraction des données de la requête
      const { title, userId, description, contenu, duration, interestIds } = request.only([
        'title', 'userId', 'description', 'contenu', 'duration', 'interestIds'
      ]);

      // Gestion du fichier image (thumbnail)
      const file = request.file('thumbnail', {
        size: '5mb',
        extnames: ['jpg', 'png', 'jpeg', 'gif']
      });

      let thumbnailUrl: string | null = null;
      if (file) {
        // Récupérer le dernier ID pour nommer le fichier
        const lastCourse = await prisma.course.findFirst({
          orderBy: { id: 'desc' },
          select: { id: true },
        });

        const newCourseId = (lastCourse?.id ?? 0) + 1;
        const filePath = `course_thumbnails/${Date.now()}_course_${newCourseId}.${file.extname}`;
        thumbnailUrl = await ResourceService.uploadFile(file as any, filePath);
      }

      // Vérification et conversion des IDs des intérêts
      const validInterestIds = Array.isArray(interestIds)
        ? interestIds.map(id => Number(id)).filter(id => !isNaN(id))
        : [];

      // Création du cours avec les relations aux centres d'intérêt
      const course = await prisma.course.create({
        data: {
          title,
          description,
          contenu,
          userId: Number(userId),
          duration: Number(duration),
          thumbnail: thumbnailUrl,
          courseInterests: {
            create: validInterestIds.map(interestId => ({
              interest: { connect: { id: interestId } }
            }))
          }
        },
        include: {
          courseInterests: {
            include: { interest: true }
          }
        }
      });

      return response.status(201).json({ course });
    } catch (error) {
      return response.status(500).json({
        message: 'Erreur lors de la création du cours',
        error: error.message,
      });
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
    const id  = parseInt(params.id);
    try {
        const existingCourse = await prisma.course.findUnique({
            where: { id: parseInt(params.id) },
            include: { courseInterests: true }
        })

        if (!existingCourse) {
            return response.status(404).json({ message: 'Cours introuvable pour la mise à jour' })
        }

    // Gestion de l'image (optionnel)
    let thumbnailUrl  = existingCourse?.thumbnail; // ⚠️ Garder l'ancienne image

    const file = request.file('thumbnail', {
        size: '5mb',
        extnames: ['jpg', 'png', 'jpeg', 'gif'],
    });

    if (file) {
        const filePath = `course_thumbnails/${Date.now()}_course_${id}.${file.extname}`;
        thumbnailUrl = await ResourceService.uploadFile(file as any, filePath);
    }

      // Vérification et conversion des IDs des intérêts
      const validInterestIds = Array.isArray(interestIds)
        ? interestIds.map(id => Number(id)).filter(id => !isNaN(id))
        : [];


        // Mise à jour des informations du cours
        const course = await prisma.course.update({
            where: { id:Number(id) },
            data: {
                title,
                description,
                contenu,
                duration:Number(duration),
                thumbnail:thumbnailUrl,
                courseInterests: {
                    deleteMany: {}, // Supprime toutes les relations existantes
                    create: validInterestIds.map(interestId => ({
                      interest: { connect: { id: interestId } }
                    }))
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
