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
const UserCoursesController = () => import('#controllers/user_courses_controller')
const CoursController = () => import('#controllers/courses_controller')
const OrientationsController = () => import('#controllers/orientations_controller')
const InterestsController = () => import('#controllers/interests_controller')
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
  router.post('/auth/loginAdmin', [UsersController, 'login'])
  // router.get('/profile', [AuthController, 'profile'])
  router.post('/auth/refresh-token', [AuthController, 'refreshToken'])

  router.post('/verify-ident', [ForetPasswordsController, 'verifyIdentifier'])
  router.post('/verify-uid', [ForetPasswordsController, 'verifyUser'])
  router.post('/verify-otp', [ForetPasswordsController, 'verifyOtp'])
  router.post('/update-password', [ForetPasswordsController, 'updatePassword'])

  //User
  router.get('user-index/', [UsersController,'index'])
  router.post('user-store', [UsersController, 'store'])
  router.get('user-show/:id', [UsersController,'show'])
  router.put('user-update/:id', [UsersController,'update'])
  // router.put('user-interets/:id', [UsersController,'updateInterests'])
  // router.get('user-getInterests/:id', [UsersController,'getUserInterests'])
  router.delete('user-destroy/:id', [UsersController,'destroy'])
  router.get('user-getMentors/', [UsersController,'getMentors'])
  //UserCours
  router.post('/enroll', [UserCoursesController, 'enroll'])
  router.get('/user-courses/:userId', [UserCoursesController, 'userCourses'])
  router.put('/updateProgress', [UserCoursesController, 'updateProgress'])
  //Course
  router.post('course-store', [CoursController, 'store'])
  router.get('course-index', [CoursController, 'index'])
  router.get('course-show/:id', [CoursController,'show'])
  router.put('course-update/:id', [CoursController,'update'])
  router.delete('course-destroy/:id', [CoursController,'destroy'])
  router.get('/orientation-getCoursesByUserInterests/:userId', [CoursController,'getCoursesByUserInterests'])

  //Interest
  router.post('/interest-store', [InterestsController, 'store'])
  router.get('/interest-index', [InterestsController, 'index'])
  router.get('/interest-show/:id', [InterestsController,'show'])
  router.put('/interest-update/:id', [InterestsController,'update'])
  router.delete('/interest-destroy/:id', [InterestsController,'destroy'])
  router.put('/interest-addInterestsToUser/:userId', [InterestsController, 'addInterestsToUser'])
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
  router.get('/orientation-getProfByUserInterests/:userId', [OrientationsController,'getProfessionsByUserInterests'])

  // router.get('/orientation-getProfessionsByInterest/:interestId', [OrientationsController,'getProfessionsByInterest'])

  router.post('/orientation-createVideo', [OrientationsController, 'createVideo'])
  router.get('/orientation-getAllVideo', [OrientationsController, 'getAllVideos'])
  router.get('/orientation-getVideoById/:id', [OrientationsController,'getVideoById'])
  router.put('/orientation-updateVideo/:id', [OrientationsController,'updateVideo'])
  router.delete('/orientation-deleteVideo/:id', [OrientationsController,'deleteVideo'])

  router.get('/orientation-getAllComments', [OrientationsController, 'getAllComments'])
  router.post('/orientation-createComment', [OrientationsController, 'createComment'])
  router.delete('/orientation-deleteComment/:id', [OrientationsController,'deleteComment'])

  router.post('/orientation-createCategory', [OrientationsController, 'createCategory'])
  router.get('/orientation-getAllCategory', [OrientationsController, 'getAllCategories'])
  router.get('/orientation-getCategoryById/:id', [OrientationsController, 'getCategoryById'])
  router.put('/orientation-updateCategory/:id', [OrientationsController, 'updateCategory'])
  router.delete('/orientation-deleteCategory/:id', [OrientationsController, 'deleteCategory'])

  router.get('/test', async ({ view }) => {
    return view.render('template')
  })

}).prefix('/api');



  router.group(()=>{
      // router.get('/users', [UsersController, 'getAllUsers'])
  }).use(middleware.auth());
