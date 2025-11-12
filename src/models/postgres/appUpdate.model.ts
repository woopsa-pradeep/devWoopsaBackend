// import { Model, DataTypes, Optional } from "sequelize";
// import { postgresSequelize } from "../../db/index"
// import { IAppUpdate } from "../../interfaces/postgress/appupdate.interface";

// // id, timestamps handled by Sequelize automatically
// type AppUpdateCreationAttributes = Optional<IAppUpdate, "created_at" | "updated_at">;

// export class AppUpdate extends Model<IAppUpdate, AppUpdateCreationAttributes> implements IAppUpdate {
//   public app_name!: string;
//   public version_name!: string;
//   public version_code!: number;
//   public force_update!: 0 | 1 | 2;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
// }

// AppUpdate.init(
//   {
//     app_name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     version_name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     version_code: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     force_update: {
//       type: DataTypes.SMALLINT,
//       allowNull: false,
//       defaultValue: 0,
//       comment: "0 = Normal, 1 = Popup, 2 = Must Update",
//     },
//   },
//   {
//     sequelize: postgresSequelize,
//     tableName: "app_update",
//     modelName: "AppUpdate",
//     timestamps: true,
//     createdAt: "created_at",
//     updatedAt: "updated_at",
//   }
// );


import { Model, DataTypes, Optional } from "sequelize";
import { postgresSequelize } from "../../db";
// import { IAppUpdate } from "../../interfaces/postgres/appUpdate.interface";
import { IAppUpdate } from "../../interfaces/postgress/appupdate.interface";


type CreationAttrs = Optional<IAppUpdate, "created_at" | "updated_at">;

export class AppUpdate extends Model<IAppUpdate, CreationAttrs> implements IAppUpdate {
  public app_name!: string;
  public version_name!: string;
  public version_code!: number | string;
  public force_update!: 0 | 1 | 2;
  public platform!: "android" | "ios";
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AppUpdate.init(
  {
    app_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    version_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    version_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    force_update: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0,
    },
    platform: {
      type: DataTypes.ENUM('android', 'ios'),
      allowNull: false,
      defaultValue: 'android',
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: "app_update",
    modelName: "AppUpdate",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
