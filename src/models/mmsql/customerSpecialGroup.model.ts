// models/customerSpecialGroups.model.ts

import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../../db";

// Interface
export interface ICustomerSpecialGroup {
  myKey: number;
  C_Number: number;
  Special_GroupID: number;
}

// Creation attributes
type CustomerSpecialGroupCreationAttributes = Optional<
  ICustomerSpecialGroup,
  "myKey"
>;

export class CustomerSpecialGroup
  extends Model<ICustomerSpecialGroup, CustomerSpecialGroupCreationAttributes>
  implements ICustomerSpecialGroup
{
  public myKey!: number;
  public C_Number!: number;
  public Special_GroupID!: number;
}

CustomerSpecialGroup.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    C_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    Special_GroupID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Customer_SpecialGroups",
    tableName: "Customer_SpecialGroups",
    timestamps: false,
  }
);
