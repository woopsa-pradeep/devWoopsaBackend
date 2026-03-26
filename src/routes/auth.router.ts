import { Router } from 'express';
import { validateRequest } from '../middlewares/validation.middleware';
import { changePasswordSchema, checkUserWareHouseSchema, forgotPasswordSchema, loginPasswrodSchema, loginSalesSchema, loginSchema, resetPasswordSchema, signUpValidation, verifyOtpSchema } from '../validations/auth.validation';
import { catchAsync } from '../utils/catchAsync';
import { AuthController } from '../controllers/auth.controller';
import verifyToken from '../middlewares/verifyToken.middleware';


const router = Router();
 const authController = new AuthController();


 

router.post('/signup',validateRequest(signUpValidation),catchAsync(authController.signUp.bind(authController)));
router.post('/verifyRetailerOtp',catchAsync(authController.verifyRetailerOtp.bind(authController)));

 router.post('/login',validateRequest(loginSchema),catchAsync(authController.login.bind(authController)));
 router.post('/loginWithPassword', validateRequest(loginPasswrodSchema), catchAsync(authController.loginWithPassword.bind(authController)));
 router.post('/verify',validateRequest(verifyOtpSchema),catchAsync(authController.verfiyOtp.bind(authController)));
 router.post('/checkUserWareHouse',validateRequest(checkUserWareHouseSchema),catchAsync(authController.checkUserWareHouse.bind(authController)));
 router.post('/forgotPassword',validateRequest(forgotPasswordSchema),catchAsync(authController.forgotPassword.bind(authController)));
 router.post('/resetPassword',validateRequest(resetPasswordSchema),catchAsync(authController.resetPassword.bind(authController)));
 router.post('/verifyToken',catchAsync(authController.verifyToken.bind(authController)));
 router.post('/resendOtp',  catchAsync(authController.resendOtp.bind(authController)));
 router.get('/getServerDetail/:serverId', catchAsync(authController.getServerDetail.bind(authController)));
 // sales person login
 router.post('/salesLogin', validateRequest(loginSalesSchema), catchAsync(authController.loginSalesUser.bind(authController)));
 router.post('/epikLogin', validateRequest(loginSalesSchema), catchAsync(authController.epikLogin.bind(authController)));
 router.post('/checkerLogin', validateRequest(loginSalesSchema), catchAsync(authController.checkerLogin.bind(authController)));
router.post('/driverLogin', validateRequest(loginSalesSchema), catchAsync(authController.driverLogin.bind(authController)));
 
 router.post('/changePassword', verifyToken,validateRequest(changePasswordSchema),catchAsync(authController.changePassword.bind(authController)));
//  router.post('/epikLogout', verifyToken, catchAsync(authController.epikLogout.bind(authController)));
 router.post('/logout', verifyToken, catchAsync(authController.logout.bind(authController)));

 router.delete('/deleteAccount', verifyToken, catchAsync(authController.deleteAccount.bind(authController)));


 export default router; 
