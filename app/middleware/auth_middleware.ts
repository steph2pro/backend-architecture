// import type { HttpContext } from '@adonisjs/core/http'
// import type { NextFn } from '@adonisjs/core/types/http'
// import type { Authenticators } from '@adonisjs/auth/types'

// /**
//  * Auth middleware is used authenticate HTTP requests and deny
//  * access to unauthenticated users.
//  */
// export default class AuthMiddleware {
//   /**
//    * The URL to redirect to, when authentication fails
//    */
//   redirectTo = '/login'

//   async handle(
//     ctx: HttpContext,
//     next: NextFn,
//     options: {
//       guards?: (keyof Authenticators)[]
//     } = {}
//   ) {
//     await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })
//     return next()
//   }
// }
'use strict'

const jwt = require('jsonwebtoken')

class AuthMiddleware {
  async handle({ request, response, auth }: any, next: () => any) {
    // Récupération de l'Authorization header
    const authToken = request.header('authorization')

    // Extraction du token
    const token = authToken && authToken.split(" ")[1]

    if (!token) {
      return response.status(401).send({ message: 'Token non fourni' })
    }

    try {
      // Vérification du token
      const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

      // Ajout du login dans la requête
      request.user = { login: user.login }

      // Passage au middleware suivant
      await next()
    } catch (err) {
      return response.status(403).send({ message: 'Token invalide ou expiré' })
    }
  }
}

module.exports = AuthMiddleware
