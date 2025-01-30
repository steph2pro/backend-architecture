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
const CoursController = () => import('#controllers/courses_controller')
const OrientationsController = () => import('#controllers/orientations_controller')
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
  //User
  router.post('user-store', [UsersController, 'store'])
  router.get('user-index', [UsersController, 'index'])
  router.get('user-show/:id', [UsersController,'show'])
  router.put('user-update/:id', [UsersController,'update'])
  router.delete('user-destroy/:id', [UsersController,'destroy'])
  router.get('user-getMentors/', [UsersController,'getMentors'])
  //Course
  router.post('course-store', [CoursController, 'store'])
  router.get('course-index', [CoursController, 'index'])
  router.get('course-show/:id', [CoursController,'show'])
  router.put('course-update/:id', [CoursController,'update'])
  router.delete('course-destroy/:id', [CoursController,'destroy'])

  //cv builder
  router.post('template-store', [TemplatesController, 'store'])
  router.get('template-index', [TemplatesController, 'index'])
  router.get('template-getCVTemplate', [TemplatesController, 'getCVTemplate'])
  //Orientation
  router.post('/orientation-createPof', [OrientationsController, 'createProfession'])
  router.get('/orientation-getAllPof', [OrientationsController, 'getAllProfessions'])
  router.get('/orientation-getPofByCategoryId/:categoryId', [OrientationsController,'getProfessionByCategory'])
  router.get('/orientation-getPofById/:id', [OrientationsController,'getProfessionById'])
  router.put('/orientation-updatePof/:id', [OrientationsController,'updateProfession'])
  router.delete('/orientation-deleteProf/:id', [OrientationsController,'deleteProfession'])

  router.post('/orientation-createVideo', [OrientationsController, 'createVideo'])
  router.get('/orientation-getAllVideo', [OrientationsController, 'getAllVideos'])
  router.get('/orientation-getVideoById/:id', [OrientationsController,'getVideoById'])
  router.put('/orientation-updateVideo/:id', [OrientationsController,'updateVideo'])
  router.delete('/orientation-deleteVideo/:id', [OrientationsController,'deleteVideo'])

  router.get('/orientation-getAllComments', [OrientationsController, 'getAllComments'])
  router.delete('/orientation-deleteComment/:id', [OrientationsController,'deleteComment'])

  router.post('/orientation-createCategory', [OrientationsController, 'createCategory'])
  router.get('/orientation-getAllCat', [OrientationsController, 'getAllCategories'])
  router.post('/orientation-createComment', [OrientationsController, 'createComment'])

  router.get('/test', async ({ view }) => {
    return view.render('template')
  })

}).prefix('/api');



  router.group(()=>{
      // router.get('/users', [UsersController, 'getAllUsers'])
  }).use(middleware.auth());
