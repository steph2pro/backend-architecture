import prisma from '#services/prisma';
import type { HttpContext } from '@adonisjs/core/http';
import FirebaseService from '#services/FirebaseService';
import mail from '@adonisjs/mail/services/main';
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon';
import jwt, { JwtPayload } from 'jsonwebtoken'
// import Env from '@ioc:Adonis/Core/Env'
import Env from '#start/env'
// import serviceAccountKey from '../../firebase-service-account.json' assert { type: 'json' };


export default class ForetPasswordsController {
  public async verifyIdentifier({ request, response }: HttpContext) {
    const { identifier } = request.only(['identifier']);

    // Vérifier si l'identifiant est un email
    const isEmail = identifier.includes('@');

    if (!isEmail) {
      // Vérifier si le numéro de téléphone est valide (format E.164)
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(identifier)) {
        return response.status(400).json({ message: 'Numéro de téléphone invalide.' });
      }

      // Rechercher l'utilisateur par numéro de téléphone
      const user = await prisma.user.findUnique({
        where: { phone: identifier },
      });

      if (!user) {
        return response.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      return response.status(200).json({
        message: 'numero trouve ',
        phone: identifier,
      });

  }
    // Si c'est un email, suivre la logique existante
    const user = await prisma.user.findUnique({
      where: { email: identifier },
    });

    if (!user) {
      return response.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Générer un OTP de 4 chiffres
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Enregistrer l'OTP dans la table OtpToken
    const expiresAt = DateTime.now().plus({ hour: 1 }).toJSDate();

    await prisma.otpToken.create({
      data: {
        email: identifier,
        phone:user.phone,
        otp,
        expiresAt,
      },
    });

    // Envoyer l'OTP par email
    await mail.send((message) => {
      message
        .to(identifier)
        .from('Millearnia')
        .subject('Votre OTP')
        .html(
          `<p>Voici votre code de vérification :</p>
           <h1>${otp}</h1>
           <p>Ce code expire dans 1 heure.</p>`
        );
    });

    return response.status(200).json({
      message: 'OTP envoyé par email',
      email: identifier,
    });
  }

//verification de l'utilisateur sur firebase
  public async verifyUser({ request, response }: HttpContext) {
    const { uid } = request.only(['uid']);  // Récupère l'uid depuis les paramètres de la requête

    try {
      // Vérifier si l'utilisateur existe
      const userRecord = await FirebaseService.checkIfUidExists(uid);

      if (userRecord) {
        const phone=userRecord.phoneNumber
        // Si l'utilisateur existe, retourner un message de succès avec son numéro de téléphone
        const accessToken = jwt.sign(
          { phone:phone },
          Env.get('ACCESS_TOKEN_SECRET'),
          { expiresIn: '24h' }
        );
        return response.json({
          success: true,
          message: 'Utilisateur trouvé.',
          phoneNumber: phone,
          accessToken:accessToken,
        });
      } else {
        // Si l'utilisateur n'existe pas
        return response.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé.',
        });
      }
    } catch (error) {
      // Gérer les erreurs liées à la récupération de l'utilisateur
      return response.status(500).json({
        success: false,
        message: `Erreur : ${error.message}`,
      });
    }
  }


  public async verifyOtp({ request, response }: HttpContext) {
    const { otpCode } = request.only(['otpCode']); // Récupère l'OTP

    try {
      // Vérifie si l'OTP existe et s'il n'est pas expiré
      const otpRecord = await prisma.otpToken.findFirst({
        where: {
          otp: otpCode,
          expiresAt: {
            gt: DateTime.local().toJSDate(), // Vérifie si le code n'est pas expiré
          },
        },
      });

      if (!otpRecord) {
        return response.status(400).json({
          success: false,
          message: 'Code OTP invalide ou expiré.',
        });
      }

      // Récupère les informations associées à cet OTP
      const { email, phone } = otpRecord;

      // Génère la clé (accessToken) pour l'utilisateur
       const accessToken = jwt.sign(
        { phone:phone },
        Env.get('ACCESS_TOKEN_SECRET'),
        { expiresIn: '24h' }
      );
      // Retourne les informations avec le token généré
      return response.json({
        success: true,
        message: 'Code OTP validé avec succès.',
        email:email,
        phone:phone,
        accessToken:accessToken
      });
    } catch (error) {
      // Gérer les erreurs liées à la vérification ou génération du token
      return response.status(500).json({
        success: false,
        message: `Erreur : ${error.message}`,
      });
    }
  }

  public async updatePassword({ request, response }: HttpContext) {
    const { phone, newPassword, accessToken } = request.only(['phone', 'newPassword', 'accessToken']);

    try {
      // Clé secrète pour vérifier le token (assurez-vous qu'elle correspond à celle utilisée pour signer les tokens)


      // Vérification du token
      let payload;
      try {
        payload = jwt.verify(accessToken, Env.get('ACCESS_TOKEN_SECRET'),) as { phone: string };
      } catch (error) {
        return response.status(401).json({
          success: false,
          message: 'Token invalide ou expiré.',
        });
      }

      // Vérifie si le token correspond à l'identifiant fourni
      if (payload.phone !== phone) {
        return response.status(403).json({
          success: false,
          message: 'Le token ne correspond pas à l’utilisateur fourni.',
        });
      }

      // Recherche de l'utilisateur (par email ou téléphone)
      const user = await prisma.user.findFirst({
        where: {
          phone: phone
        },
      });

      if (!user) {
        return response.status(404).json({
          success: false,
          message: 'Utilisateur introuvable.',
        });
      }

      // Mise à jour du mot de passe
      const hashedPassword = await hash.make(newPassword); // Assurez-vous d'avoir une méthode pour hacher le mot de passe
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Retourne une réponse de succès
      return response.json({
        success: true,
        message: 'Mot de passe mis à jour avec succès.',
      });
    } catch (error) {
      // Gérer les erreurs
      return response.status(500).json({
        success: false,
        message: `Erreur lors de la mise à jour du mot de passe : ${error.message}`,
      });
    }
  }







}
