
// import OtpService from '#services/otpService';
// // Utiliser Prisma pour interagir avec la base de données
// import { HttpContext } from '@adonisjs/core/http';
// import prisma from '#services/prisma';

// export default class OtpController {
//   public async sendOtp({ request, response }: HttpContext) {
//     const { email } = request.only(['email']);

//     // Vérifier si l'email est valide
//     if (!email || !email.includes('@')) {
//       return response.badRequest({ message: 'Email invalide.' });
//     }

//     // Générer un OTP
//     const otp = OtpService.generateOtp();
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expire dans 10 minutes

//     // Enregistrer le OTP dans la base de données
//     await prisma.otpToken.create({
//       data: {
//         email,
//         otp,
//         expiresAt,
//       },
//     });

//     // Envoyer l'OTP à l'utilisateur
//     await this.sendOtpEmail(email, otp);

//     return response.ok({ message: 'OTP envoyé avec succès.' });
//   }

//   private async sendOtpEmail(email: string, otp: string) {
//     const mailer = await import('@ioc:Adonis/Addons/Mail'); // Configurez le service d'email
//     await mailer.default.send((message) => {
//       message
//         .to(email)
//         .from('no-reply@example.com') // Changez l'expéditeur
//         .subject('Votre code OTP')
//         .htmlView('emails/otp', { otp }); // Créez une vue dans `resources/views/emails/otp.edge`
//     });
//   }
// }
