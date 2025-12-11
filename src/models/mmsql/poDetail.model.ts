import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../../db"; // adjust path

export interface IPODetail {
  PO_Number: number;
  Line_Number: number;
  Item_Number: number | null;
  Sales_Category: number | null;
  OTP_Number: number | null;
  Quantity_Ordered: number | null;
  Quantity_Recd: number | null;
  Quantity_RecdDamaged: number | null;
  Unit_Code: string | null;
  Pack: number | null;
  Cost: number | null;
  BaseCost: number | null;
  NetCost: number | null;
  Invoice_Cost: number | null;
  AvgCost: number | null;
  PrepaidTax_State: number | null;
  PrepaidTax_County: number | null;
  PrepaidTax_City: number | null;
  PendingTax_State: number | null;
  PendingTax_County: number | null;
  PendingTax_City: number | null;
  GL_Special: boolean | null;
  Unit_Allowance: number | null;
  Credit_ReturnType: number | null;
  Confirmed: boolean | null;
  DetailPosted: boolean | null;
  AdjFromInventoryID: number | null;
  PO_Number_Legacy: number | null;
  PO_LocationID: number | null;
  InventoryGroupID: number | null;
  Inventory_ExpDate: Date | null;
  Inventory_LotRef: string | null;
  Unit_Allowance2: number | null;
  CaseCount: number | null;
  Unit_Allowance_ID: number | null;
  Unit_Allowance2_ID: number | null;
  STAMP_Requied: boolean | null;
  STAMP_Qty: number | null;
  AddOnDeposit_Item_Number: number | null;
  DepositAmount: number | null;
  IsIncludeDeposit_QB: boolean | null;
  CaseWeight: number | null;
  CaseOrd: number | null;
  CaseRecd: number | null;
  CasesPerPallet: number | null;
  PO_Detail_Code: number | null;
}

// Only PO_Number + Line_Number are required
type PODetailCreation = Optional<
  IPODetail,
  | "Item_Number"
  | "Sales_Category"
  | "OTP_Number"
  | "Quantity_Ordered"
  | "Quantity_Recd"
  | "Quantity_RecdDamaged"
  | "Unit_Code"
  | "Pack"
  | "Cost"
  | "BaseCost"
  | "NetCost"
  | "Invoice_Cost"
  | "AvgCost"
  | "PrepaidTax_State"
  | "PrepaidTax_County"
  | "PrepaidTax_City"
  | "PendingTax_State"
  | "PendingTax_County"
  | "PendingTax_City"
  | "GL_Special"
  | "Unit_Allowance"
  | "Credit_ReturnType"
  | "Confirmed"
  | "DetailPosted"
  | "AdjFromInventoryID"
  | "PO_Number_Legacy"
  | "PO_LocationID"
  | "InventoryGroupID"
  | "Inventory_ExpDate"
  | "Inventory_LotRef"
  | "Unit_Allowance2"
  | "CaseCount"
  | "Unit_Allowance_ID"
  | "Unit_Allowance2_ID"
  | "STAMP_Requied"
  | "STAMP_Qty"
  | "AddOnDeposit_Item_Number"
  | "DepositAmount"
  | "IsIncludeDeposit_QB"
  | "CaseWeight"
  | "CaseOrd"
  | "CaseRecd"
  | "CasesPerPallet"
  | "PO_Detail_Code"
>;

export class PODetail
  extends Model<IPODetail, PODetailCreation>
  implements IPODetail
{
  public PO_Number!: number;
  public Line_Number!: number;
  public Item_Number!: number | null;
  public Sales_Category!: number | null;
  public OTP_Number!: number | null;
  public Quantity_Ordered!: number | null;
  public Quantity_Recd!: number | null;
  public Quantity_RecdDamaged!: number | null;
  public Unit_Code!: string | null;
  public Pack!: number | null;
  public Cost!: number | null;
  public BaseCost!: number | null;
  public NetCost!: number | null;
  public Invoice_Cost!: number | null;
  public AvgCost!: number | null;
  public PrepaidTax_State!: number | null;
  public PrepaidTax_County!: number | null;
  public PrepaidTax_City!: number | null;
  public PendingTax_State!: number | null;
  public PendingTax_County!: number | null;
  public PendingTax_City!: number | null;
  public GL_Special!: boolean | null;
  public Unit_Allowance!: number | null;
  public Credit_ReturnType!: number | null;
  public Confirmed!: boolean | null;
  public DetailPosted!: boolean | null;
  public AdjFromInventoryID!: number | null;
  public PO_Number_Legacy!: number | null;
  public PO_LocationID!: number | null;
  public InventoryGroupID!: number | null;
  public Inventory_ExpDate!: Date | null;
  public Inventory_LotRef!: string | null;
  public Unit_Allowance2!: number | null;
  public CaseCount!: number | null;
  public Unit_Allowance_ID!: number | null;
  public Unit_Allowance2_ID!: number | null;
  public STAMP_Requied!: boolean | null;
  public STAMP_Qty!: number | null;
  public AddOnDeposit_Item_Number!: number | null;
  public DepositAmount!: number | null;
  public IsIncludeDeposit_QB!: boolean | null;
  public CaseWeight!: number | null;
  public CaseOrd!: number | null;
  public CaseRecd!: number | null;
  public CasesPerPallet!: number | null;
  public PO_Detail_Code!: number | null;
}

PODetail.init(
  {
    PO_Number: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    Line_Number: { type: DataTypes.INTEGER, allowNull: false },

    Item_Number: DataTypes.INTEGER,
    Sales_Category: DataTypes.INTEGER,
    OTP_Number: DataTypes.INTEGER,

    Quantity_Ordered: DataTypes.FLOAT,
    Quantity_Recd: DataTypes.FLOAT,
    Quantity_RecdDamaged: DataTypes.FLOAT,

    Unit_Code: DataTypes.STRING,
    Pack: DataTypes.INTEGER,

    Cost: DataTypes.FLOAT,
    BaseCost: DataTypes.FLOAT,
    NetCost: DataTypes.FLOAT,
    Invoice_Cost: DataTypes.FLOAT,
    AvgCost: DataTypes.FLOAT,

    PrepaidTax_State: DataTypes.INTEGER,
    PrepaidTax_County: DataTypes.INTEGER,
    PrepaidTax_City: DataTypes.INTEGER,

    PendingTax_State: DataTypes.INTEGER,
    PendingTax_County: DataTypes.INTEGER,
    PendingTax_City: DataTypes.INTEGER,

    GL_Special: DataTypes.BOOLEAN,

    Unit_Allowance: DataTypes.FLOAT,
    Credit_ReturnType: DataTypes.INTEGER,
    Confirmed: DataTypes.BOOLEAN,
    DetailPosted: DataTypes.BOOLEAN,

    AdjFromInventoryID: DataTypes.INTEGER,
    PO_Number_Legacy: DataTypes.INTEGER,
    PO_LocationID: DataTypes.INTEGER,
    InventoryGroupID: DataTypes.INTEGER,

    Inventory_ExpDate: DataTypes.DATE,
    Inventory_LotRef: DataTypes.STRING,

    Unit_Allowance2: DataTypes.FLOAT,
    CaseCount: DataTypes.INTEGER,

    Unit_Allowance_ID: DataTypes.INTEGER,
    Unit_Allowance2_ID: DataTypes.INTEGER,

    STAMP_Requied: DataTypes.BOOLEAN,
    STAMP_Qty: DataTypes.INTEGER,

    AddOnDeposit_Item_Number: DataTypes.INTEGER,
    DepositAmount: DataTypes.FLOAT,
    IsIncludeDeposit_QB: DataTypes.BOOLEAN,

    CaseWeight: DataTypes.FLOAT,
    CaseOrd: DataTypes.FLOAT,
    CaseRecd: DataTypes.FLOAT,
    CasesPerPallet: DataTypes.FLOAT,

    PO_Detail_Code: DataTypes.INTEGER
  },
  {
    sequelize,
    modelName: "PO_Detail",
    tableName: "PO_Detail",
    timestamps: false
  }
);
