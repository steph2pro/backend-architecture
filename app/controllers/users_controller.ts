  import prisma from "#services/prisma"
  import { LoginValidator } from "#validators/login_validator";
  import env from '#start/env'
  import { HttpContext} from "@adonisjs/core/http"
  import hash from '@adonisjs/core/services/hash'

  import jwt from 'jsonwebtoken'
import { MultipartFile } from "@adonisjs/core/bodyparser";
import ResourceService, { ExtendedFile } from "#services/ressource_service";
  // import supabase from '@ioc:Adonis/Addons/Supabase' // Assurez-vous que Supabase est bien configuré

  export default class UsersController {
    public async login({ request, response }: HttpContext) {
      const { local } = request.headers(); // Récupérer la langue pour les messages
      try {
        // Validation des données d'entrée
        const { identifier, password } = await LoginValidator.validate(
          request.only(['identifier', 'password'])
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

        // Vérification si l'utilisateur a le rôle 'admin'
        if (user.role !== 'admin') {
          return response.status(403).json({
            message: local === 'fr' ? 'Accès interdit : rôle non autorisé' : 'Forbidden: role not allowed',
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
        const accessToken = jwt.sign(user, env.get('ACCESS_TOKEN_SECRET'), {
          expiresIn: '15min',
        });

        const refreshToken = jwt.sign(
          { id: user.id },
          env.get('REFRESH_TOKEN_SECRET'),
          { expiresIn: '24h' }
        );

        // Mise à jour du refresh token dans la base de données
        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: [refreshToken] },
        });

        // Réponse réussie
        return response.status(200).json(
           user
        );
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


    // public async store({ request, response }: HttpContext) {
    //   try {
    //     // Validation des données d'entrée
    //     const data = request.only(['name', 'email', 'phone', 'password', 'role', 'status'])

    //     // Vérification des champs requis
    //     if (!data.name || !data.email || !data.password) {
    //       return response.status(400).json({
    //         message: 'Name, email, and password are required.',
    //       })
    //     }

    //     // Vérification si l'email existe déjà
    //     const existingUser = await prisma.user.findUnique({
    //       where: { email: data.email },
    //     })
    //     if (existingUser) {
    //       return response.status(400).json({
    //         message: 'Email is already in use.',
    //       })
    //     }

    //     // Hachage du mot de passe
    //     const hashedPassword = await hash.make(data.password)

    //     // Création de l'utilisateur
    //     const user = await prisma.user.create({
    //       data: {
    //         ...data,
    //         password: hashedPassword, // Remplacement du mot de passe par le mot de passe haché
    //       },
    //     })

    //     // Retourner la réponse
    //     return response.status(201).json({
    //       message: 'User created successfully.',
    //       user,
    //     })
    //   } catch (error) {
    //     console.error('Error creating user:', error)

    //     // Gestion des erreurs
    //     return response.status(500).json({
    //       message: 'An error occurred while creating the user.',
    //       error: error.message,
    //     })
    //   }
    // }





    public async store({ request, response }: HttpContext) {
      try {
        // Validation des données d'entrée
        const data = request.only(['name', 'email', 'phone', 'password', 'role', 'status'])

        const file = request.file('profil',{
          size: '5mb',
          extnames: ['jpg', 'png', 'jpeg', 'gif']
        }) ;

        console.log("File received:",file);

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

        // Upload de l'image si elle est présente
        let profileUrl: string | null = null
        if (file) {

          const filePath = "profiles/${Date.now()}_${file.clientName}"
          profileUrl = await ResourceService.uploadFile(file as any, filePath)
        }

        // Création de l'utilisateur
        const user = await prisma.user.create({
          data: {
            ...data,
            password: hashedPassword,
            profil: profileUrl, // Stocke l'URL de l'image si elle existe
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














    public async index({ request, response }: HttpContext) {
      // Récupérer les paramètres de la requête (page et perPage)
      const page = request.input('page', 1) // Par défaut, page 1
      const perPage = request.input('perPage', 10) // Par défaut, 10 utilisateurs par page
      // Number(perPage);
      // Calculer le skip (décalage) pour la pagination
      const skip = (page - 1) * perPage

      // Utiliser Prisma pour récupérer les utilisateurs avec la pagination
      const users = await prisma.user.findMany({
        skip, // Décalage pour la pagination
        take: Number(perPage), // Limiter le nombre d'éléments par page
        include: {
          professions: true,
          comments: true
        }
      })

      // Récupérer le total des utilisateurs pour la pagination
      const totalUsers = await prisma.user.count()

      // Calculer le nombre total de pages
      const totalPages = Math.ceil(totalUsers / perPage)

      // Retourner les utilisateurs paginés avec les informations de pagination
      return response.ok({
        users:users,
        meta: {
          current_page: page,
          total_pages: totalPages,
          per_page: perPage,
          total: totalUsers
        },
        links: {
          first: `/users?page=1&perPage=${perPage}`,
          last: `/users?page=${totalPages}&perPage=${perPage}`,
          prev: page > 1 ? `/users?page=${page - 1}&perPage=${perPage}` : null,
          next: page < totalPages ? `/users?page=${page + 1}&perPage=${perPage}` : null
        }
      })
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
    public async getMentors({ response }: HttpContext) {
      try {
        // Requête pour récupérer tous les mentors
        const mentors = await prisma.user.findMany({
          where: { role: 'mentor' },
          include: {
            professions: true,
            comments: true,
          },
        });

        // Vérification si aucun mentor n'est trouvé
        if (!mentors || mentors.length === 0) {
          return response.status(404).json({
            success: false,
            message: 'No mentors found',
          });
        }

        // Retourner les mentors trouvés
        return response.status(200).json( {mentors});
      } catch (error) {
        // Gestion des erreurs en cas d'échec de la requête ou autre problème
        return response.status(500).json({
          success: false,
          message: 'An error occurred while fetching mentors',
          error: error.message,
        });
      }
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

     // MÉTHODE POUR METTRE À JOUR LES CENTRES D'INTÉRÊT D'UN UTILISATEUR
  // public async updateInterests({ params, request, response }: HttpContext) {
  //   try {
  //     const { interests } = request.only(['interests']);

  //     if (!Array.isArray(interests) || interests.length === 0) {
  //       return response.status(400).json({
  //         message: 'Interests must be a non-empty array.'
  //       });
  //     }

  //     const user = await prisma.user.update({
  //       where: { id: parseInt(params.id) },
  //       data: {
  //         interests: { set: interests } // Mettre à jour avec une nouvelle liste
  //       },
  //     });

  //     return response.status(201).json({
  //       message: 'User interests updated successfully.',
  //       user
  //     });
  //   } catch (error) {
  //     return response.status(500).json({
  //       message: 'Failed to update user interests.',
  //       error: error.message
  //     });
  //   }
  // }

  public async getUserInterests({ params, response }: HttpContext) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: Number(params.id) },
        select: { id: true, interests: true }, // On récupère seulement l'ID et les intérêts
      })

      if (!user) {
        return response.status(404).json({
          message: 'Utilisateur non trouvé',
        })
      }

      return response.status(200).json({
        interests: user.interests,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Erreur serveur',
        error: error.message,
      })
    }
  }



  }
