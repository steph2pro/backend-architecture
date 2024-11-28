
import Env from '#start/env'
import prisma from '#services/prisma';
import type { HttpContext } from '@adonisjs/core/http'
import jwt, { JwtPayload } from 'jsonwebtoken'

export default class UsersController {
  public async getAllUsers({ request, response }: HttpContext) {
    const { local } = request.headers();

    console.log("je suis local")
    console.log(local)
    try {

      // Pagination : Récupération des paramètres de page et limite
      const page = Number(request.input('page', 1)); // Page par défaut : 1
      const limit = Number(request.input('limit', 10)); // Limite par défaut : 10
      const skip = (page - 1) * limit;

      // Récupération des utilisateurs avec pagination
      const users = await prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          phone: true,
          createdAt: true, // Inclure uniquement les champs nécessaires

        },
      });

      // Compte total des utilisateurs pour la pagination
      const totalUsers = await prisma.user.count();

      // Réponse paginée
      return response.status(200).json({
        message: local === 'fr' ? 'Utilisateurs récupérés' : 'Users fetched successfully',
        data: {
          users,
          pagination: {
            page,
            limit,
            total: totalUsers,
          },
        },
      });
    } catch (error) {
      return response.status(401).json({
        message: local === 'fr' ? 'Token invalide ou expiré' : 'Invalid or expired token',
        error: error.message,
      });
    }
  }
}
