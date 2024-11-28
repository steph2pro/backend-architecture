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




  router.group(()=>{
      router.get('/users', [UsersController, 'getAllUsers'])
  }).use(middleware.auth());

}).prefix('/api');


