import prisma from '#services/prisma'
import type { HttpContext } from '@adonisjs/core/http'
import { params } from 'firebase-functions'

export default class InterestsController {
   // Créer un centre d'intérêt
   async store({ request, response }: HttpContext) {
    const { title, description } = request.all()

    try {
      const interest = await prisma.interest.create({
        data: {
          title,
          description,
        },
      })
      return response.status(201).json(interest)
    } catch (error) {
      console.error(error)
      return response.status(500).json({ message: 'Erreur lors de la création du centre d\'intérêt' })
    }
  }

  // Récupérer tous les centres d'intérêt
  async index({ response }: HttpContext) {
    try {
      const interests = await prisma.interest.findMany({
        include:{
          professions:true,
          professionInterests:true
        }
      })
      return response.status(200).json({interests})
    } catch (error) {
      console.error(error)
      return response.status(500).json({ message: 'Erreur lors de la récupération des centres d\'intérêt' })
    }
  }

  // Récupérer un centre d'intérêt par son ID
  async show({ params, response }: HttpContext) {
    try {
      const interest = await prisma.interest.findUnique({
        where: { id: parseInt(params.id) },
      })
      if (!interest) {
        return response.status(404).json({ message: 'Centre d\'intérêt non trouvé' })
      }
      return response.status(200).json(interest)
    } catch (error) {
      console.error(error)
      return response.status(500).json({ message: 'Erreur lors de la récupération du centre d\'intérêt' })
    }
  }

  // Mettre à jour un centre d'intérêt
  async update({ params, request, response }: HttpContext) {
    const { title, description } = request.all()

    try {
      const interest = await prisma.interest.update({
        where: { id: parseInt(params.id) },
        data: {
          title,
          description,
        },
      })
      return response.status(200).json(interest)
    } catch (error) {
      console.error(error)
      return response.status(500).json({ message: 'Erreur lors de la mise à jour du centre d\'intérêt' })
    }
  }

  // Supprimer un centre d'intérêt
  async destroy({ params, response }: HttpContext) {
    try {
      await prisma.interest.delete({
        where: { id: parseInt(params.id) },
      })
      return response.status(200).json({ message: 'Centre d\'intérêt supprimé avec succès' })
    } catch (error) {
      console.error(error)
      return response.status(500).json({ message: 'Erreur lors de la suppression du centre d\'intérêt' })
    }
  }


    // Méthode pour ajouter des centres d'intérêt à un utilisateur
    public async addInterestsToUser({ params, request, response }: HttpContext) {
      const { interestIds } = request.only(['interestIds']);
      const userId = parseInt(params.userId);

      try {
        // Vérifie si l'utilisateur existe
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          return response.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Récupère les centres d'intérêt déjà associés à l'utilisateur
        const existingInterests = await prisma.userInterest.findMany({
          where: {
            userId: userId,
            interestId: { in: interestIds },
          },
          select: { interestId: true },
        });

        // Filtrer les ID déjà existants
        const existingInterestIds = existingInterests.map((i) => i.interestId);
        const newInterestIds = interestIds.filter((id: number) => !existingInterestIds.includes(id));

        if (newInterestIds.length === 0) {
          return response.status(200).json({ message: 'Tous les centres d’intérêt sont déjà associés' });
        }

        // Ajoute uniquement les nouveaux centres d'intérêt
        await prisma.userInterest.createMany({
          data: newInterestIds.map((interestId: number) => ({
            userId,
            interestId,
          })),
          skipDuplicates: true, // Évite les erreurs de contrainte unique
        });

        return response.status(200).json({ message: 'Centres d\'intérêt ajoutés avec succès' });

      } catch (error) {
        return response.status(500).json({ message: 'Erreur interne du serveur', error: error.message });
      }
    }







}
