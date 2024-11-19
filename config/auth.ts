import { defineConfig } from '@adonisjs/auth'
import { tokensGuard, tokensUserProvider } from '@adonisjs/auth/access_tokens'
import type { InferAuthEvents, Authenticators } from '@adonisjs/auth/types'

const authConfig = defineConfig({
  default: 'api',
  guards: {
    api: tokensGuard({
      provider: tokensUserProvider({
        /**
         * Table des tokens (doit correspondre à la table définie pour stocker les tokens dans Prisma)
         */
        tokens: 'accessTokens',

        /**
         * Modèle d'utilisateur : connectez ici le modèle Prisma pour gérer les utilisateurs.
         */
        model: () => import('#models/user'), // Assurez-vous que votre modèle est correctement exporté
      }),
    }),
  },
})

export default authConfig

/**
 * Types d'authentification
 */
declare module '@adonisjs/auth/types' {
  export interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
declare module '@adonisjs/core/types' {
  interface EventsList extends InferAuthEvents<Authenticators> {}
}
