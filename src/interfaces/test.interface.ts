export interface IUser {
    id:any;
    username: string;
    email: string;
    password: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUserCreate {
    username: string;
    email: string;
    password: string;
}

export interface IUserUpdate {
    username?: string;
    email?: string;
    password?: string;
}

