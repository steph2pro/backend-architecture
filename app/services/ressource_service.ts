import { createClient, SupabaseClient } from '@supabase/supabase-js'
import env from '#start/env'
import fs, { readFile } from 'fs/promises'

  import { MultipartFile } from '@adonisjs/bodyparser' // Assure-toi d'importer ceci
export type ExtendedFile = Omit<File, 'stream'> & {
  subtype: string
  clientName: string
  tmpPath: string
  stream: NodeJS.ReadableStream // ou NodeJS.ReadableStream
}
const supabase: SupabaseClient = createClient(
  env.get('SUPABASE_URL'),
  env.get('SUPABASE_ANON_KEY')
)

const BUCKET_NAME = 'images'
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default class ResourceService {


  static async uploadFile(file: ExtendedFile, filePath: string): Promise<string> {
    const mimeType = `${file.type}/${file.subtype}`
    this.validateFile(file, mimeType)
    const buffer = await this.getFileBuffer(file)

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: mimeType
      })

    if (error || !data) {
      throw new Error(`Erreur lors de l'upload du fichier ${file.clientName}: ${error?.message || 'Données manquantes'}`)
    }

    return `${process.env.SUPABASE_URL}/storage/v1/object/public/${data.fullPath}`
  }

  static async uploadMultipleFiles(files: ExtendedFile[], basePath: string): Promise<string[]> {
    const uploadPromises = files.map(async (file) => {
      const mimeType = `${file.type}/${file.subtype}`
      this.validateFile(file, mimeType)
      const buffer = await this.getFileBuffer(file)
      const filePath = `${basePath}/${file.clientName}`

      const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, buffer, {
        contentType: mimeType
      })

      if (error || !data) {
        throw new Error(`Erreur lors de l'upload du fichier ${file.clientName}: ${error?.message || 'Données manquantes'}`)
      }
      return `${process.env.SUPABASE_URL}/storage/v1/object/public/${data.fullPath}`
    })

    return Promise.all(uploadPromises)
  }

  static async getFile(filePath: string): Promise<string> {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
    if ( !data?.publicUrl) {
      throw new Error(`Erreur lors de la récupération du fichier ${filePath}: ${ 'Pas d\'URL publique'}`)
    }
    return data.publicUrl
  }

  static async updateFile(file: any | ExtendedFile, filePath: string): Promise<string> {
    await this.deleteFileIfExists(filePath)
    return this.uploadFile(file, filePath)
  }

  static async deleteFile(filePath: string) {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath])
    if (error) {
      throw new Error(`Erreur lors de la suppression du fichier ${filePath}: ${error.message}`)
    }
    return { success: true }
  }

  static async listFiles(path = '') {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list(path)
    if (error) {
      throw new Error(`Erreur lors de la récupération des fichiers: ${error.message}`)
    }
    return data
  }

  // Méthodes internes
  private static validateFile(file: ExtendedFile, mimeType: string) {
    if (!ALLOWED_FILE_TYPES.includes(mimeType)) {
      throw new Error(`Type de fichier non autorisé. Autorisés: ${ALLOWED_FILE_TYPES.join(', ')}`)
    }

    if (file.size && file.size > MAX_FILE_SIZE) {
      throw new Error(`Fichier trop volumineux. Taille max: ${MAX_FILE_SIZE / (1024 * 1024)} MB`)
    }
  }

  private static async getFileBuffer(file: ExtendedFile): Promise<Buffer> {
    if (file.tmpPath) {
      // Si un tmpPath est défini, on lit directement le fichier
      return fs.readFile(file.tmpPath)
    }
    // Sinon, on lit le flux manuellement
    return this.streamToBuffer(file.stream)
  }

  private static streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      stream.on('error', (err) => reject(err))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
    })
  }

  private static async deleteFileIfExists(filePath: string) {
    try {
      await this.deleteFile(filePath)
    } catch (err) {
      console.warn(`Pas de fichier à supprimer pour ${filePath}:`, err)
    }
  }
}
