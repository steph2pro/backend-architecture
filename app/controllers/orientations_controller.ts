import prisma from '#services/prisma'
import ResourceService from '#services/ressource_service';
import type { HttpContext } from '@adonisjs/core/http'
import { messages } from '@vinejs/vine/defaults'

export default class OrientationsController {
  // Create a Profession
  public async createProfession({ request, response }: HttpContext) {
    try {
      // Extraction des données de la requête
      const data = request.only(['name', 'userId', 'categoryId', 'interests', 'thumbnail']);

      const file = request.file('thumbnail', {
          size: '5mb',
          extnames: ['jpg', 'png', 'jpeg', 'gif']
      });

      // Upload de l'image si elle est présente
      let thumbnailUrl: string | null = null;
      if (file) {
          const lastProf = await prisma.profession.findFirst({
              orderBy: { id: 'desc' },
              select: { id: true },
          });

          const newProfId = (lastProf?.id ?? 0) + 1;
          const filePath = `profession_thumbnails/${Date.now()}_profession_${newProfId}.${file.extname}`;
          thumbnailUrl = await ResourceService.uploadFile(file as any, filePath);
      }

     // 🔹 Vérification et transformation des intérêts
     let interestIds: number[] = [];
     try {
        if (typeof data.interests === 'string') {
            interestIds = data.interests.split(',').map(id => Number(id.trim())); // Séparation et conversion en entiers
        } else if (Array.isArray(data.interests)) {
            interestIds = data.interests.map(id => Number(id)); // Transformation en entiers
        }

         // Vérifie que interestIds est bien un tableau valide
         if (!Array.isArray(interestIds) || interestIds.length === 0 || interestIds.some(isNaN)) {
             return response.status(400).json({
                 message: "Invalid data: 'interests' must be a non-empty array of valid IDs *************",
                data: interestIds,
                oderData:data.interests
             });
         }
     } catch (error) {
         return response.status(400).json({
             message: "Invalid data format for 'interests'. Expected an array or JSON string.",
             error: error.message,
         });
     }
      // Création de la profession avec les relations aux centres d'intérêt
      const profession = await prisma.profession.create({
          data: {
              name: data.name,
              userId: Number(data.userId),
              categoryId: Number(data.categoryId),
              thumbnail: thumbnailUrl,
              professionInterests: {
                  create: interestIds.map(interestId => ({
                      interest: { connect: { id: interestId } }
                  }))
              }
          },
          include: {
              professionInterests: {
                  include: { interest: true }
              }
          }
      });

      return response.status(201).json(profession);
  } catch (error) {
      return response.status(500).json({
          message: 'Error creating Profession',
          error: error.message,
      });
  }

}


  public async getAllProfessions({ response }: HttpContext) {
    try {
      const AllProfessions = await prisma.profession.findMany({
        include: {
          category: true,
          user: true,
          videos: true,
          comments: true,
          professionInterests: {
            include: {
              interest: true, // Récupère les détails des intérêts liés via ProfessionInterests
            },
          },
        },
      });

      // Transformer la structure des professions pour inclure directement les intérêts
      const professions = AllProfessions.map((profession) => ({
        ...profession,
        interests: profession.professionInterests.map((pi) => pi.interest), // Extraire seulement les intérêts
      }));

      return response.status(200).json({ professions});
    } catch (error) {
      console.error('Error fetching professions:', error);
      return response.status(500).json({
        message: 'Failed to fetch professions',
        error: error.message,
      });
    }
  }


  public async getProfessionByCategory({ params, response }: HttpContext) {
    try {
      const { categoryId } = params

      // Récupérer toutes les professions ayant le categoryId spécifié
      const professions = await prisma.profession.findMany({
        where: { categoryId: parseInt(categoryId) },
        include: {
          category: true,
          user: true,
          videos: true,
          comments: true,
        },
      })

      return response.status(200).json({
         professions,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Une erreur est survenue',
        error: error,
      })
    }
  }

  // Get a single Profession
  public async getProfessionById({ params, response }: HttpContext) {
    try {
      const { id } = params
      const profession = await prisma.profession.findUnique({
        where: { id: parseInt(id) },
        include: {
          category: true,
          user: true,
          videos: true,
          comments: {
            include: {
              sender: true,
            },
          },
        },
      })
      if (!profession) {
        return response.status(404).json({ error: 'Profession not found' })
      }
      return response.status(200).json(profession)
    } catch (error) {
      return response.status(500).json({ error: 'Failed to fetch profession' })
    }
  }

  // Update a Profession
 // Mise à jour de la profession
public async updateProfession({ params, request, response }: HttpContext) {
  try {
      const { id } = params;
      const data = request.only(['name', 'userId', 'categoryId', 'interests',]);

      // Vérifier si la catégorie existe
      const categoryExists = await prisma.professionCategory.findUnique({
          where: { id: Number(data.categoryId) },
      });

      if (!categoryExists) {
          return response.status(400).json({
              message: "Invalid categoryId: Category does not exist",
          });
      }

     let interestIds: number[] = [];
    try {
        if (typeof data.interests === 'string') {
            interestIds = data.interests.split(',').map(id => Number(id.trim())); // Séparation et conversion en entiers
        } else if (Array.isArray(data.interests)) {
            interestIds = data.interests.map(id => Number(id)); // Transformation en entiers
        }


         // Vérifie que interestIds est bien un tableau valide
         if (!Array.isArray(interestIds) || interestIds.length === 0 || interestIds.some(isNaN)) {
          return response.status(400).json({
              message: "Invalid data: 'interests' must be a non-empty array of valid IDs *************",
             data: interestIds,
             oderData:data.interests
          });
      }

    } catch (error) {
         return response.status(400).json({
             message: "Invalid data format for 'interests'. Expected an array or JSON string.",
             error: error.message,
         });
     }


      // **Récupérer la profession existante**
      const existingProfession = await prisma.profession.findUnique({
          where: { id: Number(id) },
          select: { thumbnail: true },
      });

      // Gestion de l'image (optionnel)
      let thumbnailUrl  = existingProfession?.thumbnail; // ⚠️ Garder l'ancienne image

      const file = request.file('thumbnail', {
          size: '5mb',
          extnames: ['jpg', 'png', 'jpeg', 'gif'],
      });

      if (file) {
          const filePath = `profession_thumbnails/${Date.now()}_profession_${id}.${file.extname}`;
          thumbnailUrl = await ResourceService.uploadFile(file as any, filePath);
      }

      // Mise à jour de la profession
      const profession = await prisma.profession.update({
          where: { id: Number(id) },
          data: {
              name: data.name,
              userId: Number(data.userId),
              categoryId: Number(data.categoryId),
              thumbnail: thumbnailUrl, // ✅ Garde l'ancienne image si pas de nouvelle
              professionInterests: {
                  deleteMany: {}, // Supprime les anciennes relations
                  create: interestIds.map((interestId: number) => ({
                      interest: { connect: { id: interestId } },
                  })),
              },
          },
          include: {
              professionInterests: {
                  include: { interest: true },
              },
          },
      });

      return response.status(200).json(profession);
  } catch (error) {
      return response.status(500).json({
          message: "Error updating profession",
          error: error.message,
      });
  }
}


     // Méthode pour obtenir les professions liées aux centres d'intérêt d'un utilisateur
     public async getProfessionsByUserInterests({ params, response }: HttpContext) {
      const { userId } = params; // Récupération du userId depuis l'URL

      try {
          // Vérifier si l'utilisateur existe
          const userExists = await prisma.user.findUnique({
              where: { id: parseInt(userId) },
              include: {
                  userInterests: true, // Récupérer uniquement les IDs des centres d'intérêt
              },
          });

          if (!userExists) {
              return response.status(404).json({ message: "Utilisateur non trouvé" });
          }

          // Récupérer les IDs des intérêts de l'utilisateur
          const interestIds = userExists.userInterests.map(ui => ui.interestId);

          let professions;
          let message = "Professions basées sur les centres d'intérêt de l'utilisateur.";

          if (interestIds.length === 0) {
              // Aucun centre d'intérêt -> Retourner toutes les professions
              professions = await prisma.profession.findMany({
                  include: {
                    category: true,
                    user: true,
                    videos: true,
                    comments: true,
                      // user: { select: { id: true, name: true } },
                      // professionInterests: { include: { interest: true } },
                  },
              });
              message = "Aucun centre d'intérêt trouvé pour cet utilisateur. Toutes les professions sont retournées.";
          } else {
              // Récupérer les professions associées aux intérêts
              professions = await prisma.profession.findMany({
                  where: {
                      professionInterests: {
                          some: {
                              interestId: { in: interestIds },
                          },
                      },
                  },
                  include: {
                    category: true,
                    user: true,
                    videos: true,
                    comments: true,
                      // category: true,
                      // user: { select: { id: true, name: true } },
                      // professionInterests: { include: { interest: true } },
                  },
              });
          }

          return response.status(200).json({ professions });

      } catch (error) {
          return response.status(500).json({
              message: "Erreur interne du serveur",
              error: error.message,
          });
      }
  }
  public async deleteProfession({ params, response }: HttpContext) {
    try {
      const id = parseInt(params.id, 10);
      if (isNaN(id)) {
        return response.status(400).json({ message: 'Invalid profession ID' });
      }

      // Vérifier si la profession existe
      const profession = await prisma.profession.findUnique({ where: { id } });
      if (!profession) {
        return response.status(404).json({ message: 'Profession not found' });
      }

      // Supprimer toutes les dépendances liées à la profession
      await prisma.professionInterests.deleteMany({ where: { professionId: id } });
      await prisma.professionComment.deleteMany({ where: { professionId: id } });
      await prisma.professionVideo.deleteMany({ where: { professionId: id } });

      // Supprimer la profession
      await prisma.profession.delete({ where: { id } });

      return response.status(200).json({ message: 'Profession deleted successfully' });
    } catch (error) {
      return response.status(500).json({
        message: 'Failed to delete profession',
        error: error.message, // Retourne un message d'erreur détaillé
      });
    }
  }


   // CREATE a new ProfessionCategory
   public async createCategory({ request, response }: HttpContext) {
    try {
      const data = request.only(['title'])
      const file = request.file('icon', {
        size: '5mb',
        extnames: ['jpg', 'png', 'jpeg', 'gif']
    });

    let iconlUrl: string ='';
    // Upload de l'image si elle est présente
    if (file) {
        const lastCat = await prisma.professionCategory.findFirst({
            orderBy: { id: 'desc' },
            select: { id: true },
        });

        const newCatId = (lastCat?.id ?? 0) + 1;
        const filePath = `categories_icons/${Date.now()}_Category_${newCatId}.${file.extname}`;
        iconlUrl = await ResourceService.uploadFile(file as any, filePath);
    }


      const category = await prisma.professionCategory.create({
        data: {
          title: data.title,
          icon: iconlUrl,
        },
      })
      return response.status(201).json(category)
    } catch (error) {
      console.error(error)
      return response.status(500).json({ error: `Failed to create category: ${error.message}` })
    }
  }
   // READ all ProfessionCategories
   public async getAllCategories({ response }: HttpContext) {
    try {
      const categories = await prisma.professionCategory.findMany({
        include: { professions: true }, // Include related professions if needed
      })
      return response.status(200).json({categories})
    } catch (error) {
      console.error(error)
      return response.status(500).json({ error: `Failed to fetch categories: ${error.message}` })
    }
  }

  // READ a single ProfessionCategory by ID
  public async getCategoryById({ params, response }: HttpContext) {
    try {
      const { id } = params
      const category = await prisma.professionCategory.findUnique({
        where: { id: parseInt(id, 10) },
        include: { professions: true }, // Include related professions if needed
      })

      if (!category) {
        return response.status(404).json({ error: 'Category not found' })
      }

      return response.status(200).json(category)
    } catch (error) {
      console.error(error)
      return response.status(500).json({ error: `Failed to fetch category: ${error.message}` })
    }
  }

  // UPDATE a ProfessionCategory
  public async updateCategory({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const data = request.only(['title'])
      // **Récupérer la category existante**
      const existingCategory = await prisma.professionCategory.findUnique({
          where: { id: Number(id) },
          select: { icon: true },
      });

      // Gestion de l'image (optionnel)
      let iconUrl  = existingCategory?.icon; // ⚠️ Garder l'ancienne image

      const file = request.file('icon', {
          size: '5mb',
          extnames: ['jpg', 'png', 'jpeg', 'gif'],
      });

      if (file) {
          const filePath = `categories_icons/${Date.now()}_category_${id}.${file.extname}`;
          iconUrl = await ResourceService.uploadFile(file as any, filePath);
      }

      const updatedCategory = await prisma.professionCategory.update({
        where: { id: parseInt(id, 10) },
        data: {
          title: data.title,
          icon: iconUrl,
        },
      })

      return response.status(200).json(updatedCategory)
    } catch (error) {
      console.error(error)
      return response.status(500).json({ error: `Failed to update category: ${error.message}` })
    }
  }

  // DELETE a ProfessionCategory
  public async deleteCategory({ params, response }: HttpContext) {
    try {
      const { id } = params
      await prisma.professionCategory.delete({
        where: { id: parseInt(id, 10) },
      })
      return response.status(200).json({ message: 'Category deleted successfully' })
    } catch (error) {
      console.error(error)
      return response.status(500).json({ error: `Failed to delete category: ${error.message}` })
    }
  }
  // Create a Comment
  // public async createComment({ request, response }: HttpContext) {
  //   try {
  //     const data = request.only(['senderId', 'professionVideoId', 'content', 'parentId'])
  //     const comment = await prisma.professionComment.create({
  //       data: {
  //         senderId: data.senderId,
  //         professionVideoId: data.professionVideoId,
  //         content: data.content,
  //         parentId: data.parentId,
  //       },
  //     })
  //     return response.status(201).json(comment)
  //   } catch (error) {
  //     return response.status(500).json({ error: 'Failed to create comment' })
  //   }
  // }
  public async createComment({ request, response }: HttpContext) {
    try {
      const data = request.only(['senderId', 'professionVideoId', 'professionId', 'content', 'parentId'])

      const comment = await prisma.professionComment.create({
        data: {
          senderId: data.senderId,
          professionVideoId: data.professionVideoId,
          professionId: data.professionId, // Ajoutez ce champ
          content: data.content,
          parentId: data.parentId || null,
        },
      })

      return response.status(201).json(comment)
    } catch (error) {
      console.error(error) // Log de l'erreur pour débogage
      return response.status(500).json({ error: 'Failed to create comment' })
    }
  }
  // Update a Comment
  public async updateComment({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const data = request.only(['content'])
      const comment = await prisma.professionComment.update({
        where: { id: parseInt(id) },
        data: {
          content: data.content,
        },
      })
      return response.status(200).json(comment)
    } catch (error) {
      return response.status(500).json({ error: 'Failed to update comment' })
    }
  }




  // Get Comments for a Video
  public async getCommentsByVideo({ params, response }: HttpContext) {
    try {
      const { id } = params
      const comments = await prisma.professionComment.findMany({
        where: { professionVideoId: parseInt(id) },
        include: {
          sender: true,
          // replies: true,
        },
      })
      return response.status(200).json(comments)
    } catch (error) {
      return response.status(500).json({ error: 'Failed to fetch comments' })
    }
  }
  // Get All Videos
public async getAllComments({ response }: HttpContext) {
  try {
    const videos = await prisma.professionComment.findMany(
      {
        include: {
      profession: true,
      replies: true,
      video: true,
      sender: true,
      },
      }
  )
    return response.status(200).json(videos)
  } catch (error) {
    return response.status(500).json({
      messages: 'Failed to fetch videos',
        error: error.message,
       })
  }
}

  // Delete a Comment
  public async deleteComment({ params, response }: HttpContext) {
    try {
      const { id } = params
      await prisma.professionComment.delete({
        where: { id: parseInt(id) },
      })
      return response.status(200).json({ message: 'Comment deleted successfully' })
    } catch (error) {
      return response.status(500).json({ error: 'Failed to delete comment' })
    }
  }


// Get All Videos
public async getAllVideos({ response }: HttpContext) {
  try {
    const videos = await prisma.professionVideo.findMany(
      {
        include: {
      profession: true,
      comments: true,
      },
      }
  )
    return response.status(200).json(videos)
  } catch (error) {
    return response.status(500).json({ error: 'Failed to fetch videos' })
  }
}

// Get Video By ID
public async getVideoById({ params, response }: HttpContext) {
  try {
    const { id } = params
    const video = await prisma.professionVideo.findUnique({
      where: { id: parseInt(id) },
      include: {
        profession: true,
        comments: true,
      },
    })

    if (!video) {
      return response.status(404).json({ error: 'Video not found' })
    }

    return response.status(200).json(video)
  } catch (error) {
    return response.status(500).json({ error: 'Failed to fetch video' })
  }
}

// Update a Video
public async updateVideo({ params, request, response }: HttpContext) {
  try {
    const { id } = params
    const data = request.only(['professionId', 'youtubeId','title'])
    // **Récupérer la video existante**
    const existingVideo = await prisma.professionVideo.findUnique({
      where: { id: Number(id) },
      select: { thumbnail: true },
  });

  // Gestion de l'image (optionnel)
  let thumbnailUrl  = existingVideo?.thumbnail; // ⚠️ Garder l'ancienne image

  const file = request.file('thumbnail', {
      size: '5mb',
      extnames: ['jpg', 'png', 'jpeg', 'gif'],
  });

  if (file) {
      const filePath = `video_thumbnails/${Date.now()}_video_${id}.${file.extname}`;
      thumbnailUrl = await ResourceService.uploadFile(file as any, filePath);
  }
    const video = await prisma.professionVideo.update({
      where: { id: parseInt(id) },
      data: {
        thumbnail: thumbnailUrl,
        professionId: parseInt(data.professionId),
        youtubeId: data.youtubeId,
        title:data.title
      },
    })

    return response.status(200).json(video)
  } catch (error) {
    return response.status(500).json({
      message: 'Failed to update video',
        error: error.message,
       })
  }
}


  // Create a Video
  public async createVideo({ request, response }: HttpContext) {
    try {
      const data = request.only([ 'professionId', 'youtubeId','title'])
      const file = request.file('thumbnail', {
        size: '5mb',
        extnames: ['jpg', 'png', 'jpeg', 'gif']
    });

    let thumbnailUrl: string ='';
    // Upload de l'image si elle est présente
    if (file) {
        const lastVid = await prisma.professionVideo.findFirst({
            orderBy: { id: 'desc' },
            select: { id: true },
        });

        const newVidId = (lastVid?.id ?? 0) + 1;
        const filePath = `video_thumbnails/${Date.now()}_video_${newVidId}.${file.extname}`;
        thumbnailUrl = await ResourceService.uploadFile(file as any, filePath);
    }

      const video = await prisma.professionVideo.create({
        data: {
          thumbnail: thumbnailUrl,
          professionId: parseInt(data.professionId),
          youtubeId: data.youtubeId,
          title:data.title
        },
      })
      return response.status(201).json(video)
    } catch (error) {
      return response.status(500).json({
        message: 'Error creating video',
        error: error.message, // Vous pouvez renvoyer le message d'erreur détaillé
      })
    }
  }

  // Get Videos for a Profession
  public async getVideosByProfession({ params, response }: HttpContext) {
    try {
      const { id } = params
      const videos = await prisma.professionVideo.findMany({
        where: { professionId: parseInt(id) },
      })
      return response.status(200).json(videos)
    } catch (error) {
      return response.status(500).json({ error: 'Failed to fetch videos' })
    }
  }

  // Delete a Video
  public async deleteVideo({ params, response }: HttpContext) {
    try {
      const { id } = params
      await prisma.professionVideo.delete({
        where: { id: parseInt(id) },
      })
      return response.status(200).json({ message: 'Video deleted successfully' })
    } catch (error) {
      return response.status(500).json({ error: 'Failed to delete video' })
    }
  }
}
