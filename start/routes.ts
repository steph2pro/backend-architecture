/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const AuthController = () => import('#controllers/auth_controller')
const UsersController = () => import('#controllers/users_controller')
const ForetPasswordsController = () => import('#controllers/foret_passwords_controller')
const TemplatesController = () => import('#controllers/templates_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.group(() => {
//auth
  router.post('/auth/register', [AuthController, 'register'])
  router.post('/auth/login', [AuthController, 'login'])
  // router.get('/profile', [AuthController, 'profile'])
  router.post('/auth/refresh-token', [AuthController, 'refreshToken'])

  router.post('/verify-ident', [ForetPasswordsController, 'verifyIdentifier'])
  router.post('/verify-uid', [ForetPasswordsController, 'verifyUser'])
  router.post('/verify-otp', [ForetPasswordsController, 'verifyOtp'])
  router.post('/update-password', [ForetPasswordsController, 'updatePassword'])
  //cv builder
  router.post('templates', [TemplatesController, 'listTemplates'])
  router.post('generate-pdf', [TemplatesController, 'generatePDF'])


}).prefix('/api');



  router.group(()=>{
      router.get('/users', [UsersController, 'getAllUsers'])
  }).use(middleware.auth());
