import { sequelize } from '../../db';
import { DataTypes, Model } from 'sequelize';

export class OrderDetail extends Model {
  public Order_Number!: number;
  public Line_Number!: number;
  public DetailUpdated?: boolean;
  public Inventory_QtyDeductRegular?: number;
  public Inventory_QtyDeductPrepaid?: number;
  public Inventory_UpdateStamp_State?: boolean;
  public Inventory_UpdateStamp_County?: boolean;
  public Inventory_UpdateStamp_City?: boolean;
  public Promo_Number?: number;
  public Item_Number!: number;
  public Sales_Category?: number;
  public OTP_Number?: number;
  public Quantity_Ordered?: number;
  public Quantity_Shipped?: number;
  public Unit_Code?: boolean;
  public Pack?: number;
  public OrderDetail_Code?: string;
  public Delivered?: boolean;
  public Credit_ReturnToStock?: boolean;
  public LineComplete?: boolean;
  public Price?: number;
  public Price_Reference?: number;
  public Retail?: number;
  public NetCost?: number;
  public BaseCost?: number;
  public Invoice_Cost?: number;
  public AvgCost?: number;
  public OTP_Amount_State?: number;
  public OTP_Amount_County?: number;
  public OTP_Amount_City?: number;
  public PrepaidTax_Amount?: number;
  public DepositAmount?: number;
  public Price_Subclass?: number;
  public OffInvoice_Amount?: number;
  public OffInvoice_OffCost?: boolean;
  public OffInvoice_Special?: number;
  public Taxable?: boolean;
  public EBT?: boolean;
  public GL_Special?: number;
  public Points?: number;
  public Confirmed?: boolean;
  public Override_Code?: number;
  public PickerNumber?: number;
  public CreditIssuedAgainst?: boolean;
  public Tote_ID?: number;
  public Special_ID?: number;
  public Order_Number_Legacy?: number;
  public PPD_PackType?: number;
  public PPD_Packs?: number;
  public Prebook_ID?: number;
  public MergedFromOrder?: number;
  public AddOnDeposit_Item_Number?: number;
  public EPick_ItemStatus?: number;
  public EPick_ItemStatusOn?: Date;
  public STAMP_Qty?: number;
  public ItemDescription?: string;
  public CaseWeight?: number;
  public CaseCount?: number;
  public Item_Message?: string;
  // public CasesPerPallet?: number;
}

OrderDetail.init({
  Order_Number: {
    type: DataTypes.INTEGER,
   
  },
  Line_Number: {
    type: DataTypes.SMALLINT,
    primaryKey: true,
  },

  DetailUpdated: {
    type: DataTypes.BOOLEAN,
  },

  Inventory_QtyDeductRegular: { type: DataTypes.DECIMAL(19, 4) },
  Inventory_QtyDeductPrepaid: { type: DataTypes.DECIMAL(19, 4) },
  Inventory_UpdateStamp_State: { type: DataTypes.BOOLEAN },
  Inventory_UpdateStamp_County: { type: DataTypes.BOOLEAN },
  Inventory_UpdateStamp_City: { type: DataTypes.BOOLEAN },

  Promo_Number: { type: DataTypes.INTEGER },
  Item_Number: DataTypes.INTEGER,
  Sales_Category: DataTypes.TINYINT,
  OTP_Number: DataTypes.TINYINT,
  Quantity_Ordered: DataTypes.DECIMAL(19, 4),
  Quantity_Shipped: DataTypes.DECIMAL(19, 4),

  Unit_Code: { type: DataTypes.BOOLEAN },
  Pack: DataTypes.SMALLINT,
  OrderDetail_Code: { type: DataTypes.STRING(1) },

  Delivered: { type: DataTypes.BOOLEAN },
  Credit_ReturnToStock: { type: DataTypes.BOOLEAN },
  LineComplete: { type: DataTypes.BOOLEAN },

  Price: DataTypes.DECIMAL(19, 4),
  Price_Reference: DataTypes.DECIMAL(19, 4),
  Retail: DataTypes.DECIMAL(19, 4),  
  NetCost: DataTypes.DECIMAL(19, 4),
  BaseCost: DataTypes.DECIMAL(19, 4),
  Invoice_Cost: DataTypes.DECIMAL(19, 4),
  AvgCost: DataTypes.DECIMAL(19, 4),

  OTP_Amount_State: DataTypes.DECIMAL(19, 4),
  OTP_Amount_County: DataTypes.DECIMAL(19, 4),
  OTP_Amount_City: DataTypes.DECIMAL(19, 4),
  PrepaidTax_Amount: { type: DataTypes.DECIMAL(19, 4) },

  DepositAmount: DataTypes.DECIMAL(19, 4),
  Price_Subclass: DataTypes.INTEGER,
  OffInvoice_Amount: DataTypes.DECIMAL(19, 4),
  OffInvoice_OffCost: DataTypes.BOOLEAN,
  OffInvoice_Special: DataTypes.DECIMAL(19, 4),

  Taxable: { type: DataTypes.BOOLEAN },
  EBT: DataTypes.BOOLEAN,

  GL_Special: DataTypes.TINYINT,
  Points: DataTypes.INTEGER,

  Confirmed: { type: DataTypes.BOOLEAN},

  Override_Code: { type: DataTypes.TINYINT },
  PickerNumber: { type: DataTypes.SMALLINT },
  CreditIssuedAgainst: { type: DataTypes.BOOLEAN},
  Tote_ID: { type: DataTypes.INTEGER },
  Special_ID: { type: DataTypes.INTEGER },
  Order_Number_Legacy: { type: DataTypes.INTEGER },
  PPD_PackType: { type: DataTypes.SMALLINT },
  PPD_Packs: { type: DataTypes.INTEGER },
  Prebook_ID: { type: DataTypes.INTEGER },
  MergedFromOrder: { type: DataTypes.INTEGER },
  AddOnDeposit_Item_Number: { type: DataTypes.INTEGER },
  EPick_ItemStatus: { type: DataTypes.INTEGER },
  EPick_ItemStatusOn: { type: DataTypes.DATE, allowNull: true },

  STAMP_Qty: DataTypes.DECIMAL(18, 2),
  ItemDescription: DataTypes.STRING(100),
  CaseWeight: DataTypes.DECIMAL(18, 4),
  CaseCount: DataTypes.INTEGER,
  Item_Message:{
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue:null
  },
  CasesPerPallet: {
    type: DataTypes.INTEGER,
    defaultValue:0
  },
}, {
  sequelize,
  tableName: 'Order_Detail',
  timestamps: false,
});
