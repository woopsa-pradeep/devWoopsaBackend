// import { Request, Response } from "express";
// import { UserService } from "../businesslogic/test.service";
// import { AppError } from "../utils/AppError";
// import { uploadFileToAzure } from "../utils/azureUploader";

// export class UserController {
//   private userService: UserService;

//   constructor() {
//     this.userService = new UserService();
//   }

//   async createUser(req: Request, res: Response): Promise<void> {
//     const user = await this.userService.createUser(req.body);
//     res.status(201).json({
//       success: true,
//       data: user,
//     });
//   }

//   async getUserById(req: Request, res: Response): Promise<void> {
//     const user = await this.userService.getUserById(Number(req.params.id));
//     if (!user) {
//       throw new AppError("User not found", 404);
//     }
//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   }

//   async getAllUsers(req: Request, res: Response): Promise<void> {
//     const users = await this.userService.getAllUsers(req.query);
//     res.status(200).json({
//       success: true,
//       data: users,
//     });
//   }

//   async updateUser(req: Request, res: Response): Promise<void> {
//     const user = await this.userService.updateUser(
//       Number(req.params.id),
//       req.body
//     );
//     if (!user) {
//       throw new AppError("User not found", 404);
//     }
//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   }

//   async deleteUser(req: Request, res: Response): Promise<void> {
//     const success = await this.userService.deleteUser(Number(req.params.id));
//     if (!success) {
//       throw new AppError("User not found", 404);
//     }
//     res.status(200).json({
//       success: true,
//       data: null,
//     });
//   }

//   async  uploadToAzure (req: Request, res: Response) {
//   try {
//     const file = req.file;
//     if (!file) {
//       return res.status(400).json({ success: false, message: "No file provided" });
//     }

//     const result = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype);

//     if (!result.success) {
//       return res.status(500).json({ success: false, message: "Upload failed", error: result.error });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Image uploaded successfully",
//       fileName: result.fileName,
//       url: result.url,
//     });

//   } catch (err: any) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };
// }
