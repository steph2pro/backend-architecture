import prisma from "#services/prisma"
import { HttpContext } from "@adonisjs/core/http"
import hash from '@adonisjs/core/services/hash'
import { messages } from '@vinejs/vine/defaults';

export default class UsersController {
  // CREATE: Ajouter un utilisateur
  public async store({ request, response }: HttpContext) {
    try {
      // Validation des données d'entrée
      const data = request.only(['name', 'email', 'phone', 'password', 'role', 'status'])

      // Vérification des champs requis
      if (!data.name || !data.email || !data.password) {
        return response.status(400).json({
          message: 'Name, email, and password are required.',
        })
      }

      // Vérification si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      })
      if (existingUser) {
        return response.status(400).json({
          message: 'Email is already in use.',
        })
      }

      // Hachage du mot de passe
      const hashedPassword = await hash.make(data.password)

      // Création de l'utilisateur
      const user = await prisma.user.create({
        data: {
          ...data,
          password: hashedPassword, // Remplacement du mot de passe par le mot de passe haché
        },
      })

      // Retourner la réponse
      return response.status(201).json({
        message: 'User created successfully.',
        user,
      })
    } catch (error) {
      console.error('Error creating user:', error)

      // Gestion des erreurs
      return response.status(500).json({
        message: 'An error occurred while creating the user.',
        error: error.message,
      })
    }
  }

  // READ: Récupérer tous les utilisateurs
  public async index({ response }: HttpContext) {
    const users = await prisma.user.findMany({
      include:{
        professions:true,
        comments:true
      }
    })
    return response.ok(users)
  }

  // READ: Récupérer un utilisateur par ID
  public async show({ params, response }: HttpContext) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(params.id) },
      include:{
        professions:true,
        comments:true
      }
    })
    if (!user) {
      return response.notFound({ message: 'User not found' })
    }
    return response.ok(user)
  }

  // UPDATE: Mettre à jour un utilisateur
  public async update({ params, request, response }: HttpContext) {
    const data = request.only(['name', 'email', 'phone', 'password', 'role', 'status'])

    try {
      const user = await prisma.user.update({
        where: { id: parseInt(params.id) },
        data,
      })
      return response.ok(user)
    } catch (error) {
      return response.status(500).json({
        message: 'User not found or update failed',
        error: error.message, // Vous pouvez renvoyer le message d'erreur détaillé
      })
    }
    // catch (error) {
    //   return response.notFound({ message: 'User not found or update failed', error:error.messages })
    // }
  }

  // DELETE: Supprimer un utilisateur
  public async destroy({ params, response }: HttpContext) {
    try {
      await prisma.user.delete({
        where: { id: parseInt(params.id) },
      })
      return response.ok({ message: 'User deleted successfully' })
    } catch (error) {
      return response.notFound({ message: 'User not found or delete failed', error })
    }
  }
}
