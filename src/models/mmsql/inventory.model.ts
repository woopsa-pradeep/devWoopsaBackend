
import { sequelize } from '../../db';
import { DataTypes, Model } from 'sequelize';
import { InventoryUPC } from './inventoryUpc.model';
import { SalesCategory } from './salesCategory.model';
import { PriceClass } from './priceClass.model';


export class Inventory extends Model {
  public Item_Number!: number;
  public Sales_Category!: number;
  public Price_Class!: number;
  public Price_Subclass?: number;
  public OTP_Number?: number;
  public Description?: string;
  public Pack!: number;
  public UOM?: string;
  public Section?: string;
  public Location?: number;
  public Section2?: string;
  public Location2?: number;
  public PickArea?: string;
  public BaseCost!: number;
  public NetCost!: number;
  public Invoice_Cost?: number;
  public AvgCost?: number;
  public Price1!: number;
  public Price2!: number;
  public Price3!: number;
  public Price4!: number;
  public Price5?: number;
  public Price6?: number;
  public Price7?: number;
  public Price10?: number;
  public Price11?: number;
  public Price12?: number;
  public Price13?: number;
  public Price14?: number;
  public Price15?: number;
  public Price16?: number;
  public Price17?: number;
  public Price18?: number;
  public Price19?: number;
  public Retail1!: number;
  public Retail2!: number;
  public Retail3!: number;
  public Primary_Vendor?: number;
  public CaseCount?: number;
  public CaseWeight?: number;
  public Sequence!: number;
  public Case_Discounts?: boolean;
  public Cig_Total!: number;
  public ShortOrderForm!: boolean;
  public PriceBook_Include?: boolean;
  public eCommerce!: boolean;
  public eCommerce_UpdateTag?: boolean;
  public eCommerce_FTP_HostID?: number;
  public Cig_Pack!: number;
  public Cig_Sticks?: number;
  public Cig_PremDisc_Code!: string;
  public Cig_Promo_Code!: number;
  public Cig_Upc_Ref?: string;
  public PM_Exclude!: boolean;
  public AltDesc?: string;
  public Item_Message?: string;
  public I_Cube?: number;
  public DepositAmount?: number;
  public CaseDiscount_Pct?: number;
  public Project_Identifier?: string;
  public UnitOunces?: number;
  public Reorder_Level?: number;
  public Vendor_ItemNumberLegacy?: number;
  public HeadingFlag?: boolean;
  public Unit_Upcharge?: number;
  public Unit_Price?: number;
  public I_WeightRate?: number;
  public TaxableAtRetail?: boolean;
  public Vendor_ItemNumberAlpha?: string;
  public Reorder_Qty?: number;
  public Date_Created?: any;
  public Date_CreatedUser?: number;
  public Date_LastChange?: Date;
  public Date_LastChangeUser?: number;
  public ROQ_Method?: number;
  public MSA_Category_Code?: string;
  public I_Inactive?: boolean;
  public MSA_Description?: string;
  public ALT_Description2?: string;
  public Manufacturer?: number;
  public Breakable?: boolean;
  public I_SalesTaxSelect?: string;
  public I_NeverDiscount?: boolean;
  public BumpToMinimum?: number;
  public NACS?: string;
  public NACS_Unit?: string;
  public Brand_ID?: number;
  public MinimumQTY?: number;
  public MaximumQTY?: number;
  public SpecialTaxUnits?: number;
  public ExclusionGroup_ID?: number;
  public RetailPct1?: number;
  public RetailPct2?: number;
  public RetailPct3?: number;
  public OnHand_Maximum?: number;
  public CaseLength?: number;
  public CaseWidth?: number;
  public CaseHeight?: number;
  public CasesPerPallet?: number;
  public I_PrepaidStatus?: boolean;
  public Jurisdiction_State?: number;
  public Jurisdiction_County?: number;
  public Jurisdiction_City?: number;
  public NoRetailRounding?: boolean;
  public Inactive_Date?: Date;
  public EBT?: boolean;
  public Lot_ID?: number;
  public I_ReturnStatus?: string;
  public Item_GroupID?: number;
  public ImageFlag?: boolean;
  public NonMerchandiseCode?: number;
  public NonMerchandiseCodeSelect?: number;
  public FrozenFlag?: boolean;
  public CoolerFlag?: boolean;
  public HazMatFlag?: boolean;
  public StandardUnitDescription?: string;
  public MSA_Promotion?: string;
  public MSA_Promotion_Code?: string;
  public MSA_Component?: boolean;
  public I_Discontinued?: boolean;
  public Customer_LimitQty?: number;
  public Customer_LimitDays?: number;
  public Points!: number;
  public PriceCostModifiedDate?: Date;
  public PriceCostModifiedUser?: number;
  public Track_ExpirationDate?: boolean;
  public Track_LotRef?: boolean;
  public CatchWeight_Capture?: boolean;
  public MaximumCustomerOrderQty?: number;
  public MaximumCustomerOrderDays?: number;
  public Item_Number_Verify?: number;
  public UseMasterImage?: boolean;
  public IsAddOnDeposit_Inventory!: boolean;
  public AddOnDeposit_Item_Number!: number;
  public IsIncludeDeposit_QB!: boolean;
  public MinimumStockAvailability!: number;
  // public ItemExpiryDate?: string;
  public ItemExpiryDate?: string;
  public UPCList?: InventoryUPC[];
  public SalesCategory?: SalesCategory;
  public PriceClass?: PriceClass;
  
}

Inventory.init(
  {
    Item_Number: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    Sales_Category: DataTypes.TINYINT,
    Price_Class: DataTypes.SMALLINT,
    Price_Subclass: DataTypes.SMALLINT,
    OTP_Number: DataTypes.SMALLINT,
Description: {
  // @ts-ignore
  type: 'VARCHAR(100)', // Use raw SQL type (works in migrations or strict dialect setups)
  allowNull: true,
  field: 'Description',
},



    Pack: DataTypes.INTEGER,
    UOM: DataTypes.STRING,
    Section: DataTypes.STRING,
    Location: DataTypes.INTEGER,
    Section2: DataTypes.STRING,
    Location2: DataTypes.INTEGER,
    PickArea: DataTypes.STRING,
    BaseCost: DataTypes.DECIMAL,
    NetCost: DataTypes.DECIMAL,
    Invoice_Cost: DataTypes.DECIMAL,
    AvgCost: DataTypes.DECIMAL,
    Price1: DataTypes.DECIMAL,
    Price2: DataTypes.DECIMAL,
    Price3: DataTypes.DECIMAL,
    Price4: DataTypes.DECIMAL,
    Price5: DataTypes.DECIMAL,
    Price6: DataTypes.DECIMAL,
    Price7: DataTypes.DECIMAL,
    Price10: DataTypes.DECIMAL,
    Price11: DataTypes.DECIMAL,
    Price12: DataTypes.DECIMAL,
    Price13: DataTypes.DECIMAL,
    Price14: DataTypes.DECIMAL,
    Price15: DataTypes.DECIMAL,
    Price16: DataTypes.DECIMAL,
    Price17: DataTypes.DECIMAL,
    Price18: DataTypes.DECIMAL,
    Price19: DataTypes.DECIMAL,
    Retail1: DataTypes.DECIMAL,
    Retail2: DataTypes.DECIMAL,
    Retail3: DataTypes.DECIMAL,
    Primary_Vendor: DataTypes.INTEGER,
    CaseCount: DataTypes.INTEGER,
    CaseWeight: DataTypes.DECIMAL,
    Sequence: DataTypes.INTEGER,
    Case_Discounts: DataTypes.BOOLEAN,
    Cig_Total: DataTypes.INTEGER,
    ShortOrderForm: DataTypes.BOOLEAN,
    PriceBook_Include: DataTypes.BOOLEAN,
    eCommerce: DataTypes.BOOLEAN,
    eCommerce_UpdateTag: DataTypes.BOOLEAN,
    eCommerce_FTP_HostID: DataTypes.INTEGER,
    Cig_Pack: DataTypes.SMALLINT,
    Cig_Sticks: DataTypes.INTEGER,
    Cig_PremDisc_Code: DataTypes.STRING,
    Cig_Promo_Code: DataTypes.SMALLINT,
    Cig_Upc_Ref: DataTypes.STRING,
    PM_Exclude: DataTypes.BOOLEAN,
    AltDesc: DataTypes.STRING,
    Item_Message: DataTypes.STRING,
    I_Cube: DataTypes.DECIMAL,
    DepositAmount: DataTypes.DECIMAL,
    CaseDiscount_Pct: DataTypes.DECIMAL,
    Project_Identifier: DataTypes.STRING,
    UnitOunces: DataTypes.DECIMAL,
    Reorder_Level: DataTypes.DECIMAL,
    Vendor_ItemNumberLegacy: DataTypes.INTEGER,
    HeadingFlag: DataTypes.BOOLEAN,
    Unit_Upcharge: DataTypes.DECIMAL,
    Unit_Price: DataTypes.DECIMAL,
    I_WeightRate: DataTypes.DECIMAL,
    TaxableAtRetail: DataTypes.BOOLEAN,
    Vendor_ItemNumberAlpha: DataTypes.STRING,
    Reorder_Qty: DataTypes.DECIMAL,
    Date_Created: DataTypes.DATE,
    Date_CreatedUser: DataTypes.SMALLINT,
    Date_LastChange: DataTypes.DATE,
    Date_LastChangeUser: DataTypes.SMALLINT,
    ROQ_Method: DataTypes.INTEGER,
    MSA_Category_Code: DataTypes.STRING,
    I_Inactive: DataTypes.BOOLEAN,
    MSA_Description: DataTypes.STRING,
    ALT_Description2: DataTypes.STRING,
    Manufacturer: DataTypes.INTEGER,
    Breakable: DataTypes.BOOLEAN,
    I_SalesTaxSelect: DataTypes.STRING,
    I_NeverDiscount: DataTypes.BOOLEAN,
    BumpToMinimum: DataTypes.INTEGER,
    NACS: DataTypes.STRING,
    NACS_Unit: DataTypes.STRING,
    Brand_ID: DataTypes.SMALLINT,
    MinimumQTY: DataTypes.DECIMAL,
    MaximumQTY: DataTypes.DECIMAL,
    SpecialTaxUnits: DataTypes.DECIMAL,
    ExclusionGroup_ID: DataTypes.SMALLINT,
    RetailPct1: DataTypes.SMALLINT,
    RetailPct2: DataTypes.SMALLINT,
    RetailPct3: DataTypes.SMALLINT,
    OnHand_Maximum: DataTypes.DECIMAL,
    CaseLength: DataTypes.DECIMAL,
    CaseWidth: DataTypes.DECIMAL,
    CaseHeight: DataTypes.DECIMAL,
    CasesPerPallet: DataTypes.INTEGER,
    I_PrepaidStatus: DataTypes.BOOLEAN,
    Jurisdiction_State: DataTypes.INTEGER,
    Jurisdiction_County: DataTypes.INTEGER,
    Jurisdiction_City: DataTypes.INTEGER,
    NoRetailRounding: DataTypes.BOOLEAN,
    Inactive_Date: DataTypes.DATE,
    EBT: DataTypes.BOOLEAN,
    Lot_ID: DataTypes.SMALLINT,
    I_ReturnStatus: DataTypes.STRING,
    Item_GroupID: DataTypes.SMALLINT,
    ImageFlag: DataTypes.BOOLEAN,
    NonMerchandiseCode: DataTypes.SMALLINT,
    NonMerchandiseCodeSelect: DataTypes.TINYINT,
    FrozenFlag: DataTypes.BOOLEAN,
    CoolerFlag: DataTypes.BOOLEAN,
    HazMatFlag: DataTypes.BOOLEAN,
    StandardUnitDescription: DataTypes.STRING,
    MSA_Promotion: DataTypes.STRING,
    MSA_Promotion_Code: DataTypes.STRING,
    MSA_Component: DataTypes.BOOLEAN,
    I_Discontinued: DataTypes.BOOLEAN,
    Customer_LimitQty: DataTypes.INTEGER,
    Customer_LimitDays: DataTypes.INTEGER,
    Points: DataTypes.DECIMAL,
    PriceCostModifiedDate: DataTypes.DATE,
    PriceCostModifiedUser: DataTypes.SMALLINT,
    Track_ExpirationDate: DataTypes.BOOLEAN,
    Track_LotRef: DataTypes.BOOLEAN,
    CatchWeight_Capture: DataTypes.BOOLEAN,
    MaximumCustomerOrderQty: DataTypes.SMALLINT,
    MaximumCustomerOrderDays: DataTypes.SMALLINT,
    Item_Number_Verify: DataTypes.INTEGER,
    UseMasterImage: DataTypes.BOOLEAN,
    IsAddOnDeposit_Inventory: DataTypes.BOOLEAN,
    AddOnDeposit_Item_Number: DataTypes.INTEGER,
    IsIncludeDeposit_QB: DataTypes.BOOLEAN,
    MinimumStockAvailability: DataTypes.DECIMAL,
    ItemExpiryDate: DataTypes.STRING,
  },
  {
    sequelize,
    tableName: 'Inventory',
    timestamps: false,
  }
);