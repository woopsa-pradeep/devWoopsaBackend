// import { DataTypes, Model, Optional } from 'sequelize';
// import { postgresSequelize } from '../../db';

// // Interface for User attributes
// interface UserAttributes {
//   id: number;
//   email: string;
//   name: string;
//   role: string;
//   isActive: boolean;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// // Interface for User creation attributes (optional fields)
// interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> {}

// // User model class
// export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
//   public id!: number;
//   public email!: string;
//   public name!: string;
//   public role!: string;
//   public isActive!: boolean;

//   // Timestamps
//   public readonly createdAt!: Date;
//   public readonly updatedAt!: Date;
// }

// // Initialize the User model
// User.init(
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//     email: {
//       type: DataTypes.STRING(255),
//       allowNull: false,
//       unique: true,
//       validate: {
//         isEmail: true,
//       },
//     },
//     name: {
//       type: DataTypes.STRING(255),
//       allowNull: false,
//     },
//     role: {
//       type: DataTypes.ENUM('admin', 'user', 'manager'),
//       allowNull: false,
//       defaultValue: 'user',
//     },
//     isActive: {
//       type: DataTypes.BOOLEAN,
//       allowNull: false,
//       defaultValue: true,
//     },
//   },
//   {
//     sequelize: postgresSequelize,
//     tableName: 'users',
//     timestamps: true,
//   }
// );

// export default User; 