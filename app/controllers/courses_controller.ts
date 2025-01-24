import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '@prisma/client'
import { messages } from '@vinejs/vine/defaults';

const prisma = new PrismaClient()

export default class CourseController {
  // Créer un nouveau cours
  public async store({ request, response }: HttpContext) {
    const { title, description, contenu, duration } = request.only(['title', 'description', 'contenu', 'duration'])

    try {
      const course = await prisma.course.create({
        data: {
          title,
          description,
          contenu,
          duration
        }
      })
      return response.status(201).json(course)
    } catch (error) {
      return response.status(500).json({ message: 'Erreur lors de la création du cours', error: error.message })
    }
  }

  // Récupérer tous les cours
  public async index({ response }: HttpContext) {
    try {
      const courses = await prisma.course.findMany()
      return response.status(200).json(courses)
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
    const { title, description, contenu, duration } = request.only(['title', 'description', 'contenu', 'duration'])

    try {
      const course = await prisma.course.update({
        where: { id: parseInt(params.id) },
        data: {
          title,
          description,
          contenu,
          duration
        }
      })
      return response.status(200).json(course)
    } catch (error) {
      return response.status(404).json({ message: 'Cours introuvable pour la mise à jour' })
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
}
