
import prisma from '#services/prisma';
import { LoginValidator } from '#validators/login_validator';
import { RegisterValidator } from '#validators/register';
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import jwt from 'jsonwebtoken'
// import Env from '@ioc:Adonis/Core/Env'
import Env from '#start/env'

export default class AuthController {

public async register({ request, response }: HttpContext) {
  // Valider les données entrantes en utilisant un validateur AdonisJS
  const { name, email, password } = await RegisterValidator.validate(request.all())

  // Hachez le mot de passe
  const hashedPassword = await hash.make(password)

  // Créer un nouvel utilisateur avec Prisma
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  })


  // Retourner une réponse
  return response.created({
    message: 'User registered successfully',
    user,
  })
}

// Retourner la réponse avec un statut 201
    // return response.status(201).json({ message: 'Register successful!', user });
    public async login({ request, auth, response }: HttpContext) {
      try {
        // Validation des données d'entrée
        const { email, password } = await LoginValidator.validate(request.only(['email', 'password']));

        // Récupérer l'utilisateur par email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          return response.unauthorized({ message: 'Invalid email' });
        }

        // Vérification du mot de passe
        const isPasswordValid = await hash.verify(user.password, password);
        if (!isPasswordValid) {
          return response.unauthorized({ message: 'Invalid password' });
        }



        // Génération d'un jeton JWT si nécessaire
        // const token = await auth.use('api').generate(user);
        // const token = await auth.use('api').generate(user)
        // const refreshToken = await auth.use('api').generate(user, { expiresIn: '24h' })
        // Générer un token JWT
    const token = jwt.sign({ id: user.id, email: user.email }, Env.get('APP_KEY'), {
      expiresIn: '1h',
    })
        return response.ok({
          message: ' login successfully',
          user,
          token
        });
      } catch (error) {
        return response.internalServerError({ message: 'An error occurred while logging in', error: error.message });
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
