// import { Router } from 'express';
// import { UserController } from '../controllers/test.controller';
// import { validateRequest } from '../middlewares/validation.middleware';
// import { createUserSchema, updateUserSchema } from '../validations/user.validation';
// import { catchAsync } from '../utils/catchAsync';
// import { multerUpload } from '../middlewares/upload.middleware';

// const router = Router();
// const userController = new UserController();

// // Create a new user
// router.post('/', validateRequest(createUserSchema), catchAsync(userController.createUser.bind(userController)));

// // Get all users
// router.get('/', catchAsync(userController.getAllUsers.bind(userController)));

// // Get user by ID
// router.get('/:id', userController.getUserById.bind(userController));

// // Update user
// router.put('/:id', validateRequest(updateUserSchema), userController.updateUser.bind(userController));

// // Delete user
// router.delete('/:id', userController.deleteUser.bind(userController));
// router.post('/image', multerUpload.single('profile'),userController.uploadToAzure.bind(userController));

// export default router; 