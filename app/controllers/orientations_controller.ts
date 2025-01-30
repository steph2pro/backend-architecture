import prisma from '#services/prisma'
import type { HttpContext } from '@adonisjs/core/http'
import { messages } from '@vinejs/vine/defaults'

export default class OrientationsController {
  // Create a Profession
  public async createProfession({ request, response }: HttpContext) {
    try {
      const data = request.only(['name', 'userId', 'categoryId','tabs'])
      const profession = await prisma.profession.create({
        data: {
          name: data.name,
          userId: data.userId,
          categoryId: data.categoryId,
          tabs: data.tabs,
        },
      })
      return response.status(201).json(profession)
    } catch (error) {
      return response.status(500).json({
        message: 'Error creating Profession',
        error: error.message, // Vous pouvez renvoyer le message d'erreur détaillé
      })
    }
  }

  // Get all Professions
  public async getAllProfessions({ response }: HttpContext) {
    try {
      const professions = await prisma.profession.findMany({
        include: {
          category: true,
          user: true,
          videos: true,
          comments: true,
        },
      })
      return response.status(200).json({professions})
    } catch (error) {
      return response.status(500).json({ message: 'Failed to fetch professions', error:error })
    }
  }
  public async getProfessionByCategory({ params, response }: HttpContextContract) {
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
  public async updateProfession({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const data = request.only(['name', 'userId', 'categoryId','tabs'])
      const profession = await prisma.profession.update({
        where: { id: parseInt(id) },
        data: {
          name: data.name,
          userId: data.userId,
          categoryId: data.categoryId,
          tabs: data.tabs,
        },
      })
      return response.status(200).json(profession)
    } catch (error) {
      return response.status(500).json({
        message: 'Error uploading profession',
        error: error.message, // Vous pouvez renvoyer le message d'erreur détaillé
      })
    }
  }

  // Delete a Profession
  public async deleteProfession({ params, response }: HttpContext) {
    try {
      const { id } = params
      await prisma.profession.delete({
        where: { id: parseInt(id) },
      })
      return response.status(200).json({ message: 'Profession deleted successfully' })
    } catch (error) {
      return response.status(500).json({
        message: 'Failed to delete profession',
        error: error.message, // Vous pouvez renvoyer le message d'erreur détaillé
      })
    }
  }
   // CREATE a new ProfessionCategory
   public async createCategory({ request, response }: HttpContext) {
    try {
      const data = request.only(['title', 'icon'])
      const category = await prisma.professionCategory.create({
        data: {
          title: data.title,
          icon: data.icon,
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
      const data = request.only(['title', 'icon'])
      const updatedCategory = await prisma.professionCategory.update({
        where: { id: parseInt(id, 10) },
        data: {
          title: data.title,
          icon: data.icon,
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
    const data = request.only(['thumbnail', 'professionId', 'youtubeId'])

    const video = await prisma.professionVideo.update({
      where: { id: parseInt(id) },
      data: {
        thumbnail: data.thumbnail,
        professionId: data.professionId,
        youtubeId: data.youtubeId,
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
      const data = request.only(['thumbnail', 'professionId', 'youtubeId'])
      const video = await prisma.professionVideo.create({
        data: {
          thumbnail: data.thumbnail,
          professionId: data.professionId,
          youtubeId: data.youtubeId,
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
