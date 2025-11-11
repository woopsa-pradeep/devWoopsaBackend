// utils/inventoryDefaults.ts
import moment from 'moment';
import { Inventory } from '../models/mmsql/inventory.model';

export const getDefaultInventoryValues = (UserID: number) => {
  const currentDate = moment.utc().format('YYYY-MM-DD HH:mm:ss.SSSSSSS +00:00');

  return {
    // Price fields
    Price7: 0,
    Price8: 0,
    Price9: 0,
    Price10: 0,
    Price11: 0,
    Price12: 0,
    Price13: 0,
    Price14: 0,
    Price15: 0,
    Price16: 0,
    Price17: 0,
    Price18: 0,
    Price19: 0,

    // Other fields
    Cig_Total: 0,
    eCommerce: false,
    eCommerce_UpdateTag: false,
    eCommerce_FTP_HostID: null,
    Cig_Upc_Ref: '',

    PM_Exclude: false,
    Vendor_ItemNumberLegacy: null,
    TaxableAtRetail: false,

    Date_Created: currentDate,
    Date_LastChange: currentDate,
    Date_CreatedUser: UserID,
    Date_LastChangeUser: UserID,

    ROQ_Method: null,
    BumpToMinimum: 0,
    NoRetailRounding: false,
    ImageFlag: false,
    NonMerchandiseCode: 0,
    NonMerchandiseCodeSelect: 0,
    Customer_LimitQty: 0,
    Customer_LimitDays: 0,
    CatchWeight_Capture: false,
    MaximumCustomerOrderQty: 0,
    MaximumCustomerOrderDays: 0,
    Item_Number_Verify: 0,
    ItemExpiryDate: null,
    UseMasterImage: false,
    IsAddOnDeposit_Inventory: false,
    AddOnDeposit_Item_Number: 0,
    IsIncludeDeposit_QB: false,
    MinimumStockAvailability: 0,
  };
};

export async function getNextItemNumber() {
    const maxItem = await Inventory.max('Item_Number');
    const nextItemNumber = (maxItem as number) + 1;
    return nextItemNumber;

    
}   