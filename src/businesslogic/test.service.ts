// import User from '../models/test.model';
// import { Operations } from '../utils/operations';
// import { IUser, IUserCreate, IUserUpdate } from '../interfaces/test.interface';
// import { PaginationOptions } from '../interfaces/pagination.interface';

// export class UserService {
//     async createUser(userData: IUserCreate): Promise<IUser> {
//         return Operations.create(User, userData);
//     }

//     async getUserById(id: number, include?: any[]): Promise<IUser | null> {
//         return Operations.findById(User, id, { include });
//     }

//     async getAllUsers(options: PaginationOptions): Promise<IUser[]> {
//         const { page = 1, limit = 10, order, include } = options;
//         const result = await Operations.findAll(User, { page, limit, order, include });
//         return result.data;
//       }

//     async updateUser(id: number, userData: IUserUpdate): Promise<IUser | null> {
//         return Operations.update(User, id, userData);
//     }

//     async deleteUser(id: number): Promise<boolean> {
//         return Operations.delete(User, id);
//     }

//     async findUserByEmail(email: string, include?: any[]): Promise<IUser | null> {
//         return Operations.findOne(User, { email }, { include });
//     }

//     async findUsersByCondition(where: any, page = 1, limit = 10, order?: [string, 'ASC' | 'DESC'][], include?: any[]): Promise<IUser[]> {
//         return Operations.findAllWithWhere(User, where, { page, limit, order, include });
//     }
// } 