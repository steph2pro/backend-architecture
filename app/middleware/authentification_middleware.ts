import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import jwt, { JwtPayload } from 'jsonwebtoken'
import Env from '#start/env'
import { User } from '@prisma/client'


export default class AuthentificationMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const request=ctx.request
    const response=ctx.response
    const headers = request.headers()
    const authorizationValue = headers.authorization ?? ''
    const authorizationToken = authorizationValue.substring(7, authorizationValue.length)

    console.log('ca arrive ici')
    if (!authorizationToken.trim()) {
      return response
        .status(401)
        .json({ message: 'Unauthorized access. Authorization header is missing.' })
    }

    /**
     * Middleware logic goes here (before the next call)
    //  */
    // console.log(ctx)
    const token = authorizationValue.split(' ')[1]

    try {
      // Vérifier le token avec la clé secrète
      const decoded = jwt.verify(token, Env.get('ACCESS_TOKEN_SECRET')) as { user: User }

      // Ajouter les informations utilisateur au contexte de la requête
      request.updateBody({ user: decoded.user })

      /**
       * Call next method in the pipeline and return its output
       */
      const output = await next()

      console.log(output)
      return output

    } catch (err) {
      // Retourner une erreur si le token est invalide
      return response.forbidden({
        message: 'Forbidden: Invalid token',
      })
    }


  }
}
