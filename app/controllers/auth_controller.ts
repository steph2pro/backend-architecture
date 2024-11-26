
import prisma from '#services/prisma';
import { LoginValidator } from '#validators/login_validator';
import { RegisterValidator } from '#validators/register';
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import jwt from 'jsonwebtoken'
// import Env from '@ioc:Adonis/Core/Env'
import Env from '#start/env'
import { Prisma } from '@prisma/client';
import { log } from 'console';

export default class AuthController {

  public async register({ request, response }: HttpContext) {
      const {local}=request.headers()
    try {
      // Valider les données entrantes
      const { name, email, password } = await RegisterValidator.validate(request.all());
      console.log(email)
      // Vérifiez si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({ where: { email:email } });
      console.log(existingUser)
      if (existingUser) {

        return response.status(201).json({

          message: local=='fr' ? 'l\'utilisateur existe deja': 'user already exist'
        });
      }

      // Hacher le mot de passe
      const hashedPassword = await hash.make(password);

      // Créer un nouvel utilisateur avec Prisma
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      // Retourner une réponse réussie
      return response.status(201).json({
        message:  local=='fr' ? 'votre compte as ete creer avec succes': 'account registered successfully',
        data:user,
      });

    } catch (error) {
      // Gestion des erreurs Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        log(error)
        return response.status(400).json({
          message:  local=='fr' ? 'erreur lors de la connexion a la base de donnee': 'A database error occurred',
          error: error.message,
        });
      }



      // Gestion des autres erreurs
      return response.status(500).json({
        message:  local=='fr' ? 'le serveur est temporairement indisponible': 'An unexpected error occurred',
        error: error.message,
      });
    }
  }

// Retourner la réponse avec un statut 201
    // return response.status(201).json({ message: 'Register successful!', user });
    public async login({ request, response }: HttpContext) {
      const {local}=request.headers()
      try {
        // Validation des données d'entrée
        const { email, password } = await LoginValidator.validate(request.only(['email', 'password']));

        // Récupérer l'utilisateur par email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {

          return response.status(201).json({

            message: local=='fr' ? 'Email incorrect': 'Invalid email'
          });
        }

        // Vérification du mot de passe
        const isPasswordValid = await hash.verify(user.password, password);
        if (!isPasswordValid) {

          return response.status(201).json({

            message: local=='fr' ? 'Mot de pass incorrect': 'Invalid password'
          });
        }

        const accesToken = jwt.sign(user, Env.get('ACCESS_TOKEN_SECRET'), {
          expiresIn: '15min',
        })
        // Génération du refresh token
        const refreshToken = jwt.sign(
          { id: user.id },
          Env.get('APP_KEY'), // Une clé différente pour plus de sécurité
          { expiresIn: '24h' } // Durée de validité plus longue pour le refresh token
        );
        // const data=refreshToken
        // Mise à jour du refresh token dans la base de données
        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: refreshToken }, // Utilisation correcte du champ `refreshToken`
        });
       const data={
          'name':user.name,
          'email':user.email,
          'password':user.password,
          'accesToken':accesToken
        }
        return response.status(201).json({
          message:  local=='fr' ? 'connexion reussi': ' login successfully',
          data:data
        });
      } catch (error) {
        return response.internalServerError({
          message:  local=='fr' ? 'erreur de connection avec le serveur': 'An error occurred while logging in',
          error: error.message
        });
      }
    }

    /**
   * Route protégée
   */
  public async profile({ auth, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Non autorisé' })
    }
    return response.json({ user })
  }


// // Rafraîchir le JWT avec le refresh token
// public async refreshToken({ request, auth, response }: HttpContext) {
//   const { refreshToken } = request.only(['refreshToken'])

//   try {
//     // Vérifier et générer un nouveau JWT avec le refresh token
//     const user = await auth.use('api').authenticate() // Vérifie le refresh token
//     const newToken = await auth.use('api').generate(user)

//     return response.ok({
//       message: 'Token refreshed successfully',
//       newToken,
//     })
//   } catch (error) {
//     return response.unauthorized({ message: 'Invalid or expired refresh token' })
//   }
// }

// // Obtenir les informations de l'utilisateur connecté
// public async getUser({ auth, response }: HttpContext) {
//   try {
//     // Récupérer l'utilisateur connecté
//     const user = await auth.use('api').authenticate()
//     return response.ok({
//       user,
//     })
//   } catch (error) {
//     return response.unauthorized({ message: 'You must be logged in' })
//   }
// }

}
