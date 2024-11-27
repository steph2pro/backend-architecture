
import prisma from '#services/prisma';
import { LoginValidator } from '#validators/login_validator';
import { RegisterValidator } from '#validators/register';
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import jwt, { JwtPayload } from 'jsonwebtoken'
// import Env from '@ioc:Adonis/Core/Env'
import Env from '#start/env'
import { Prisma, User } from '@prisma/client';
import { log } from 'console';
import { errors } from '@adonisjs/core/dumper';

export default class AuthController {

  public async register({ request, response }: HttpContext) {
      const {local}=request.headers()
    try {
      // Valider les données entrantes
      const { name,email, phone, password } = await RegisterValidator.validate(request.all());

      // Vérifiez si l'utilisateur existe déjà
      const existingUserEmail = await prisma.user.findUnique({ where: { email:email } });
      // console.log(existingUser)
      if (existingUserEmail) {

        return response.status(201).json({

          message: local=='fr' ? 'cet email existe deja': 'that mail already exist'
        });
      }
      // Vérifiez si le phone existe déjà
      const existingUser = await prisma.user.findUnique({ where: { phone:phone } });
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
          phone,
          password: hashedPassword,
          refreshToken:[]
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

  public async login({ request, response }: HttpContext) {
    const { local } = request.headers(); // Récupérer la langue pour les messages
    try {
      // Validation des données d'entrée
      const { identifier, password } = await LoginValidator.validate(
        request.only(['identifier','password'])
      );

      // Identifier peut être un email ou un numéro de téléphone
      const isEmail = identifier.includes('@'); // Vérification simple pour déterminer si c'est un email
      const user = await prisma.user.findUnique({
        where: isEmail
          ? { email: identifier } // Recherche par email
          : { phone: identifier }, // Recherche par numéro de téléphone
      });

      if (!user) {
        return response.status(401).json({
          message: local === 'fr' ? 'Utilisateur introuvable' : 'User not found',
        });
      }

      // Vérification du mot de passe
      const isPasswordValid = await hash.verify(user.password, password);
      if (!isPasswordValid) {
        return response.status(401).json({
          message:
            local === 'fr' ? 'Mot de passe incorrect' : 'Invalid password',
        });
      }

      // Génération des tokens
      const accessToken = jwt.sign(user, Env.get('ACCESS_TOKEN_SECRET'), {
        expiresIn: '15min',
      });

      const refreshToken = jwt.sign(
        user,
        Env.get('REFRESH_TOKEN_SECRET'),
        { expiresIn: '24h' }
      );

      // Mise à jour du refresh token dans la base de données
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: [refreshToken] },
      });

      // Réponse réussie
      return response.status(200).json({
        message: local === 'fr' ? 'Connexion réussie' : 'Login successful',
        data: user,
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } catch (error) {
      // Gestion des erreurs
      return response.internalServerError({
        message:
          local === 'fr'
            ? 'Erreur de connexion avec le serveur'
            : 'An error occurred while logging in',
        error: error.message,
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

// Méthode pour rafraîchir l'access token
async refreshToken({ request, params, response }: HttpContext) {
  try {
    const { id } = params // Récupérer l'identifiant depuis les paramètres
    const refreshToken = request.input('refresh_token') // Récupérer le token depuis le corps de la requête

    if (!refreshToken) {
      return response.status(401).send({ error: true, message: "Le token est requis" })
    }

    // Vérifier l'existence de l'utilisateur
    const userDB = await prisma.user.findFirst(id)
    if (!userDB) {
      return response.status(404).send({ error: true, message: "Utilisateur introuvable" })
    }

    // Vérifier si le token est valide
    if (userDB.refreshToken!.includes(refreshToken)) {
      return response.status(403).send({ error: true, message: "Token non valide" })
    }

    // Vérifier et générer un nouveau token si valide
    jwt.verify(refreshToken, Env.get('REFRESH_TOKEN_SECRET'), (err, user: JwtPayload) => {
      if (err) {
        return response.status(403).send({ error: true, message: 'Token expiré ou non valide' })
      }

      const accessToken = this.generateAccessToken(user) // Générer un nouveau token
      response.status(200).send({ acces_token: accessToken })
    })
  } catch (error) {
    console.error(error)
    return response.status(500).send({ error: true, message: error.message })
  }
}

 // Fonction utilitaire pour générer un access token
 generateAccessToken(user:JwtPayload): String {
  return jwt.sign(user,  Env.get('ACCESS_TOKEN_SECRET'), { expiresIn: '10m' })
}

// Obtenir les informations de l'utilisateur connecté
public async getUser({ auth, response }: HttpContext) {
  try {
    // Récupérer l'utilisateur connecté
    const user = await auth.use('api').authenticate()
    return response.ok({
      user,
    })
  } catch (error) {
    return response.unauthorized({ message: 'You must be logged in' })
  }
}

}
