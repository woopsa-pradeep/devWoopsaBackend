import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from "../../db";
import { IDistributorAttributes } from "../../interfaces/distributor.interface";


export class Distributor
  extends Model<IDistributorAttributes>
  implements IDistributorAttributes
{
  public PM_ID!: string;
  public RJR_Whole_ID?: string;
  public RJR_Ship_ID?: string;
  public RJR_Descriptor?: string;
  public D_Name?: string;
  public D_Addr1?: string;
  public D_Addr2?: string;
  public D_City?: string;
  public D_State?: string;
  public D_Zip?: string;
  public D_Lcontact?: string;
  public D_Fcontact?: string;
  public D_Phone?: string;
  public D_Fax?: string;
  public D_Logo?: string;
  public ClientID?: number;
  public PO_ShipTo1?: string;
  public PO_ShipTo2?: string;
  public PO_ShipTo3?: string;
  public PO_ShipTo4?: string;
  public PO_BillTo1?: string;
  public PO_BillTo2?: string;
  public PO_BillTo3?: string;
  public PO_BillTo4?: string;
  public D_Email?: string;
  public D_OtherName?: string;
  public D_OtherAddr1?: string;
  public D_OtherAddr2?: string;
  public D_OtherCity?: string;
  public D_OtherState?: string;
  public D_OtherZip?: string;
  public D_OtherPhone?: string;
  public D_OtherFax?: string;
}


Distributor.init(
  {
    PM_ID: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      field: 'PM_ID',
    },
    RJR_Whole_ID: DataTypes.STRING,
    RJR_Ship_ID: DataTypes.STRING,
    RJR_Descriptor: DataTypes.STRING,
    D_Name: DataTypes.STRING,
    D_Addr1: DataTypes.STRING,
    D_Addr2: DataTypes.STRING,
    D_City: DataTypes.STRING,
    D_State: DataTypes.STRING,
    D_Zip: DataTypes.STRING,
    D_Lcontact: DataTypes.STRING,
    D_Fcontact: DataTypes.STRING,
    D_Phone: DataTypes.STRING,
    D_Fax: DataTypes.STRING,
    D_Logo: DataTypes.STRING,
    ClientID: DataTypes.INTEGER,
    PO_ShipTo1: DataTypes.STRING,
    PO_ShipTo2: DataTypes.STRING,
    PO_ShipTo3: DataTypes.STRING,
    PO_ShipTo4: DataTypes.STRING,
    PO_BillTo1: DataTypes.STRING,
    PO_BillTo2: DataTypes.STRING,
    PO_BillTo3: DataTypes.STRING,
    PO_BillTo4: DataTypes.STRING,
    D_Email: DataTypes.STRING,
    D_OtherName: DataTypes.STRING,
    D_OtherAddr1: DataTypes.STRING,
    D_OtherAddr2: DataTypes.STRING,
    D_OtherCity: DataTypes.STRING,
    D_OtherState: DataTypes.STRING,
    D_OtherZip: DataTypes.STRING,
    D_OtherPhone: DataTypes.STRING,
    D_OtherFax: DataTypes.STRING
  },
  {
    sequelize,
    tableName: 'Distributor',
    timestamps: false
  }
);
