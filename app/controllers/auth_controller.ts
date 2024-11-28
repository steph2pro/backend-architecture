
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
      // const aut = auth.user?.save;
      // console.log(aut)
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
        {id:user.id},
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
  //  */
  // public async profile({ auth, response }: HttpContext) {
  //   const user = auth.user
  //   if (!user) {
  //     return response.unauthorized({ message: 'Non autorisé' })
  //   }
  //   return response.json({ user })
  // }

// Méthode pour rafraîchir l'access token
public async refreshToken({ request, response }: HttpContext) {
  const { local } = request.headers();
  const { refresh_token } = request.only(['refresh_token']);

  try {
    // Décoder et vérifier le refresh token
    const payload = jwt.verify(
      refresh_token,
      Env.get('REFRESH_TOKEN_SECRET')
    );

    // Rechercher l'utilisateur correspondant

    if (typeof payload !== 'object' || !('id' in payload)) {
      throw new Error('Token payload invalide');
    }

    const user = await prisma.user.findUnique({
      where: { id: (payload as JwtPayload & { id: number }).id },
    });
    // console.log(user)

    if (!user || user.refreshToken.includes(refresh_token)) {
      return response.status(401).json({
        message: local === 'fr' ? 'Token invalide' : 'Invalid token',
      });
    }

    // Générer de nouveaux tokens
    const accessToken = jwt.sign(
      user,
      Env.get('ACCESS_TOKEN_SECRET'),
      { expiresIn: '15min' }
    );

    const newRefreshToken = jwt.sign(
      { id: user.id },
      Env.get('REFRESH_TOKEN_SECRET'),
      { expiresIn: '24h' }
    );

    // Mettre à jour le refresh token en base de données
    const updatedTokens = user.refreshToken.filter(
      (token) => token !== refresh_token
    );
    updatedTokens.push(newRefreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: updatedTokens },
    });

    return response.status(200).json({
      message: local === 'fr' ? 'Token renouvelé' : 'Token refreshed',
      access_token: accessToken,
      refresh_token: newRefreshToken,
    });
  } catch (error) {
    return response.status(401).json({
      message: local === 'fr' ? 'Token invalide ou expiré' : 'Invalid or expired token',
      error: error.message,
    });
  }
}


}
