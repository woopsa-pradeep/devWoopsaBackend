import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import moment from 'moment';
import axios from "axios";
import crypto from 'crypto';
import { GetDiscount } from "../models/mmsql/getDiscount.model";
import { col, fn, Op, Sequelize } from "sequelize";
import CustPricing from "../models/mmsql/customerPricing.model";
import CustAuthorized from "../models/mmsql/customerAuthorization.model";
import { Inventory } from "../models/mmsql/inventory.model";
import InventorySpecials from "../models/mmsql/inventorySpecail.model";
import InventorySubclass from "../models/mmsql/inventorySubClass.model";
import { TaxRatesOTP } from "../models/mmsql/taxRatesOtp.model";
import InventoryStatus from "../models/mmsql/inventoryStatus.model";
import { Retailer } from "../models/postgres/retailer.model";
import { Customer } from "../models/mmsql/customer.model";
import { ItemLimit } from "../models/postgres/itemLimit.model";
import SalesCategory from "../models/mmsql/salesCategory.model";
import PriceClass from "../models/mmsql/priceClass.mode";
import { InventoryUPC } from "../models/mmsql/inventoryUpc.model";
import InventoryQtyDiscount from "../models/mmsql/inventoryQtyDiscount.model";
import { sendDistributorEmail, sendEmail } from "./sendMail";
import { EmailMarketing } from "../models/postgres/emailMarketing.model";
import { Console } from "console";
import { SalesCategoryTaxRate } from "../models/mmsql/salesCategoryTaxes.model";
import { TaxRates } from "../models/mmsql/taxRates.model";
import { Inventory_ExcludeState } from "../models/mmsql/inventoryExcludeState.model";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import { OrderDetail } from "../models/mmsql/orderDetail.model";

type PriceFields = {
  Price1?: number | null;
  Price2?: number | null;
  Price3?: number | null;
  Price4?: number | null;
  Price5?: number | null;
  Price6?: number | null;
  Price7?: number | null;
  Price8?: number | null;
  Price9?: number | null;
  Price10?: number | null;
  Price11?: number | null;
  Price12?: number | null;
  Price13?: number | null;
  Price14?: number | null;
  Price15?: number | null;
  Price16?: number | null;
  Price17?: number | null;
  Price18?: number | null;
  Price19?: number | null;
};


export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "30d",
  });
};

export const round = (value: number, decimals = 2) => {
  return Number(Math.round(Number(value + "e" + decimals)) + "e-" + decimals);
};

export const calcPercentageTax = (
  myOtherRate: number,
  myOtherOption: number,
  QB_PO_TAX_COSTALIAS: number,
  Pricing_ItemCost: number,
  InventoryItem: any
) => {
  let otpTax = 0;

  if (myOtherOption === 2) {
    otpTax =
      QB_PO_TAX_COSTALIAS === 2
        ? round(Pricing_ItemCost * myOtherRate)
        : round(InventoryItem.NetCost * myOtherRate);
  } else if (myOtherOption === 3) {
    otpTax =
      QB_PO_TAX_COSTALIAS === 3
        ? round(Pricing_ItemCost * myOtherRate)
        : round(InventoryItem.BaseCost * myOtherRate);
  } else if (myOtherOption === 7) {
    otpTax =
      QB_PO_TAX_COSTALIAS === 7
        ? round(Pricing_ItemCost * myOtherRate)
        : round((InventoryItem.InvoiceCost || 0) * myOtherRate);
  } else {
    otpTax = round(Pricing_ItemCost * myOtherRate);
  }

  return otpTax;
};

export const formatTimeSpan = (milliseconds: number) => {
  const duration = moment.duration(milliseconds);
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  return `${hours}h ${minutes}m`;
}

export async function getCoordinatesAsync(
  address: string,
  city: string,
  state: string,
  zipcode: string
): Promise<{ latitude: string | null; longitude: string | null }> {
  try {
    const apiKey = process.env.GOOGLE_MAP_API_KEY;
    const formattedAddress = `${address}, ${city}, ${state}, ${zipcode}`;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formattedAddress)}&key=${apiKey}`;

    const response = await axios.get(url);
    const data: any = response.data;

    if (data.status === 'OK') {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat.toString(),
        longitude: location.lng.toString(),
      };
    } else {
      console.error('Google Maps API Error:', data.status);
      return { latitude: null, longitude: null };
    }
  } catch (error: any) {
    console.error('Axios Error:', error.message);
    return { latitude: null, longitude: null };
  }
}

export function convertMillisecondsToTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getWeekdayValue(dayName: string): number {
  const days: { [key: string]: number } = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  return days[dayName] ?? 0;
}

export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

const getEffectivePrice = (discountRow: any): number => {
  const level = discountRow.Price_Level;


  // If Price_Level is null or undefined, return Price1
  if (level == null) {
    return Number(discountRow.Price1);
  }

  const priceMap = {
    1: discountRow.Price1,
    2: discountRow.Price2,
    3: discountRow.Price3,
    4: discountRow.Price4,
    5: discountRow.Price5,
    6: discountRow.Price6,
  };

  const selectedPrice = priceMap[level as keyof typeof priceMap];

  // If selected price is non-zero, use it; otherwise, fallback to Price1
  return (selectedPrice && Number(selectedPrice) !== 0)
    ? Number(selectedPrice)
    : Number(discountRow.Price1);
}


export function generateForgotPasswordToken(length: number = 18): string {
  return crypto.randomBytes(length).toString('hex'); // 64-character hex string by default
}

export function generateRandomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}

function calculateItemPrice(findCustomerAuthorization: any, inventory: any): number | null {
  const { Item_Option, Item_Value } = findCustomerAuthorization;
  console.log(Item_Option, Item_Value, "Item_Option, Item_Value")
  const toFixed2 = (value: number) => parseFloat(value.toFixed(2));

  if (Item_Option === 0) return toFixed2(Item_Value);

  if (Item_Option >= 1 && Item_Option <= 6) {
    const price = inventory[`Price${Item_Option}`];
    return price != null ? toFixed2(price) : null;
  }

  switch (Item_Option) {
    case 7:
      return toFixed2((inventory.Price1 ?? 0) - Item_Value);

    case 8:
      return toFixed2(inventory.Retail1 ?? 0);

    case 10:
      return toFixed2((inventory.Price1 ?? 0) * (1 - (Item_Value / 100)));

    case 11:
      return toFixed2((inventory.BaseCost ?? 0) * (1 + (Item_Value / 100)));

    case 12:
      return toFixed2((inventory.NetCost ?? 0) * (1 + (Item_Value / 100)));

    case 13:
      return toFixed2((inventory.Price1 ?? 0) * (1 + (Item_Value / 100)));

    case 14:
      return toFixed2((inventory.Price1 ?? 0) + Item_Value);

    case 99:
      return null;

    default:
      return toFixed2(Item_Value);
  }
}

function calculateAdjustedPrice(priceAdjustment: any, inventory: any): number {
  const {
    Price,
    Price_Adjustment,
    Price_Adj_Pct,
    Price_Level,
  } = priceAdjustment;

  const toFixed2 = (value: number) => parseFloat(value.toFixed(2));

  // 1. Return price if directly it's set
  if (Price !== 0) return toFixed2(Price);

  // 2. Determine basePrice based on Price_Level
  let basePrice = 0;

  if (Price_Level >= 1 && Price_Level <= 6) {
    basePrice = inventory[`Price${Price_Level}`] ?? 0;
  } else if (Price_Level === 8) {
    basePrice = inventory.NetCost ?? 0;
  } else if (Price_Level === 9) {
    basePrice = inventory.BaseCost ?? 0;
  }
  if (!basePrice) {
    basePrice = inventory.Price1 ?? 0;
  }

  // 3. Apply adjustment
  if (!Price_Adj_Pct) {
    return toFixed2(basePrice + Price_Adjustment);
  }

  const adjValue = basePrice * (Price_Adjustment / 100);

  const result = (Math.round((basePrice + adjValue) * 100) / 100).toFixed(2);


  return Number(result);
}

export async function getDiscount(Item_Number: number, C_Number: number) {
  try {
    // let discount: any = await GetDiscount.findAll({
    //   where: {
    //     Item_Number: Item_Number,
    //     [Op.and]: [
    //       { C_Number: C_Number },
    //       { Conract_Cust: C_Number }
    //     ]
    //   }
    // });
    // console.log(discount, "discount")
    // const lastDiscount = discount.length > 0 ? discount[discount.length - 1] : null;
    // console.log(lastDiscount, "lastDiscount")
    // discount = lastDiscount;
    // discount = null
    // // check with view 
    // if (discount) {
    //   console.log(discount, "discount->>>>>")
    //   discount = discount.dataValues
    //   let adjustedPrice = 0;
    //   let specailPrice = null;
    //   let hasSpecailPrice = false;
    //   let applyContractPrice = true;
    //   let finalPrice = 0;

    //   if (discount.hasApplyCommanPrice) {
    //     if (discount.Perpetual) {
    //       hasSpecailPrice = true;
    //       specailPrice = discount.CommanPrice;
    //     }
    //     else if (discount.Idj_Startdate && discount.Idj_Enddate) {
    //       const currentDate = new Date();
    //       currentDate.setHours(0, 0, 0, 0); // Normalize to date-only

    //       const startDate = new Date(discount.Idj_Startdate);
    //       startDate.setHours(0, 0, 0, 0);

    //       const endDate = new Date(discount.Idj_Enddate);
    //       endDate.setHours(0, 0, 0, 0);

    //       // Check if current date is between start date and end date (inclusive)
    //       if (currentDate >= startDate && currentDate <= endDate) {
    //         hasSpecailPrice = true;
    //         specailPrice = discount.CommanPrice;
    //       }
    //     }


    //   }


    //   if (discount.Contract_Option !== null) {

    //     if (discount.Contract_Values === "Price") {

    //       adjustedPrice = discount.Contract_Price
    //     }
    //     else if (discount.Contract_Values === "Price1") {

    //       const tempPrice = discount.Price1
    //       adjustedPrice = tempPrice;
    //     }
    //     else if (discount.Contract_Values === "Price2") {

    //       const tempPrice = discount.Price2
    //       adjustedPrice = tempPrice;
    //     }
    //     else if (discount.Contract_Values === "Price3") {

    //       const tempPrice = discount.Price3
    //       adjustedPrice = tempPrice;
    //     }
    //     else if (discount.Contract_Values === "Price4") {

    //       const tempPrice = discount.Price4
    //       adjustedPrice = tempPrice;
    //     }
    //     else if (discount.Contract_Values === "Price5") {

    //       const tempPrice = discount.Price5
    //       adjustedPrice = tempPrice;
    //     }
    //     else if (discount.Contract_Values === "Price6") {

    //       const tempPrice = discount.Price6
    //       adjustedPrice = tempPrice;
    //     }
    //     else if (discount.Contract_Values === "discount_from_price1_as_per_p1") {
    //       const tempPrice = discount.Price1 - (discount.Price1 * discount.Contract_Price / 100)
    //       adjustedPrice = tempPrice;
    //     }
    //     else if (discount.Contract_Values === "discount_from_price1_as_price1") {
    //       const tempPrice = discount.Price1 - discount.Contract_Price
    //       adjustedPrice = tempPrice;
    //     }
    //     else if (discount.Contract_Values === "cost_on_base") {
    //       const tempPrice = discount.Price1
    //       adjustedPrice = tempPrice;
    //     }
    //     else if (discount.Contract_Values === "net-cost") {
    //       const tempPrice = discount.Price1
    //       adjustedPrice = tempPrice;
    //     }
    //     else if (discount.Contract_Values === "add_on_to_per_price1") {
    //       const tempPrice = discount.Price1 + (discount.Price1 * discount.Contract_Price / 100)
    //       adjustedPrice = tempPrice;
    //     }
    //     else if (discount.Contract_Values === "add_on_to_price1") {
    //       const tempPrice = discount.Price1 + discount.Contract_Price;
    //       adjustedPrice = tempPrice;
    //     }

    //     else if (discount.Contract_Values === "retail_price") {
    //       const tempPrice = discount.Retail1 - discount.CommanAllowance;
    //       adjustedPrice = tempPrice;
    //     }
    //     else if (discount.Contract_Values === "not_for_sold") {
    //       return null;
    //     }

    //   }
    //   else {
    //     console.log('GOES ELSEE')
    //     if (discount.Adj_Price) {
    //       adjustedPrice = discount.Adj_Price
    //     }
    //     else if (discount.Price_Adjustment && !discount.Price_Adj_Pct) {
    //       let tempPrice = getEffectivePrice(discount);
    //       adjustedPrice = tempPrice + discount.Price_Adjustment;
    //     }

    //     else if (discount.Price_Adjustment && discount.Price_Adj_Pct) {
    //       let tempPrice = getEffectivePrice(discount);
    //       adjustedPrice = tempPrice + (tempPrice * discount.Price_Adjustment / 100);
    //     }
    //     else {
    //       adjustedPrice = getEffectivePrice(discount);
    //     }
    //   }
    //   if (hasSpecailPrice && specailPrice != null) {
    //     if (specailPrice < adjustedPrice) {
    //       applyContractPrice = false
    //       finalPrice = specailPrice;
    //     } else {
    //       finalPrice = adjustedPrice;
    //     }
    //   } else {
    //     finalPrice = adjustedPrice;
    //   }

    //   adjustedPrice = finalPrice;
    //   // discount 
    //   let discountPrice = 0;
    //   if (discount.Perpetual) {
    //     if (discount.CommanAllowanceType === '$') {
    //       discountPrice += discount.CommanAllowance;
    //     }
    //     else if (discount.CommanAllowanceType === '%') {
    //       discountPrice += adjustedPrice * discount.CommanAllowance / 100;
    //       return discountPrice;
    //     }
    //   }
    //   else if (discount.Idj_Startdate && discount.Idj_Enddate) {
    //     const currentDate = new Date();
    //     currentDate.setHours(0, 0, 0, 0); // Normalize to date-only

    //     const startDate = new Date(discount.Idj_Startdate);
    //     startDate.setHours(0, 0, 0, 0);

    //     const endDate = new Date(discount.Idj_Enddate);
    //     endDate.setHours(0, 0, 0, 0);

    //     // Check if current date is between start date and end date (inclusive)
    //     if (currentDate >= startDate && currentDate <= endDate) {
    //       if (discount.CommanAllowanceType === '$') {
    //         discountPrice += discount.CommanAllowance;
    //       } else if (discount.CommanAllowanceType === '%') {
    //         discountPrice += (adjustedPrice * discount.CommanAllowance) / 100;
    //         return discountPrice;
    //       }
    //     }
    //   }

    //   //subcalass discount
    //   if (applyContractPrice) {
    //     const currentDate = new Date();
    //     currentDate.setHours(0, 0, 0, 0); // Normalize to date-only

    //     const startDate = new Date(discount.Subclass_Startdate);
    //     startDate.setHours(0, 0, 0, 0);

    //     const endDate = new Date(discount.Subclass_Enddate);
    //     endDate.setHours(0, 0, 0, 0);

    //     if (discount.UnlimitedFlag) {
    //       discountPrice += discount.Sub_Discount;
    //     } else if (startDate <= currentDate && currentDate <= endDate) {
    //       discountPrice += discount.Sub_Discount;
    //     }
    //   }


    //   return adjustedPrice - discountPrice;

    // }

    //check with query


  let customerPricingAccount : any = await Customer.findOne({
    where:{
      C_Number: C_Number,
    },
    attributes: ['C_PricingAccount'],
  })

  customerPricingAccount = customerPricingAccount?.dataValues;


  console.log(customerPricingAccount,'customerPricingAccount')
  if(customerPricingAccount.C_PricingAccount){
    C_Number = customerPricingAccount.C_PricingAccount;
  }


    
    console.log('GOES ELSE-->')
    let InventoryItem: any = await Inventory.findOne({
      where: {
        Item_Number: Item_Number
      }
    })

    InventoryItem = InventoryItem?.dataValues;


    let productPrice = 0;
    let myFinalPrice: any = null;
    let hasCustomerAuthorization = false;
    let letSpecailPrice = null;
    let allowancePrice = 0;
    let allowancePriceType = '$';
    let hasSpecailPriceApply = false;
    let discountPrice = 0;
    let findCustomerPricing: any = await CustPricing.findOne({
      where: {
        C_Number: C_Number,
        Price_Class: InventoryItem.Price_Class,

      }
    })


    if(!findCustomerPricing){
      let tempSalesCategory = InventoryItem.Sales_Category;
      tempSalesCategory = 1000+tempSalesCategory;
      findCustomerPricing = await CustPricing.findOne({
        where: {
          C_Number: C_Number,
          Price_Class: tempSalesCategory,
  
        }
      })
    }






    let findCustomerAuthorization: any = await CustAuthorized.findOne({
      where: {
        C_Number: C_Number,
        Item_Number: Item_Number
      }
    })

    findCustomerPricing = findCustomerPricing?.dataValues;
    findCustomerAuthorization = findCustomerAuthorization?.dataValues;
    console.log(findCustomerPricing, 'c')
    // check is Customer has Authorization Price or not
    if (findCustomerAuthorization) {
      hasCustomerAuthorization = true;

      const price = calculateItemPrice(findCustomerAuthorization, InventoryItem);
      myFinalPrice = price;

    }
    // check is Customer has Pricing Price or not
    if (findCustomerPricing) {
      const price = calculateAdjustedPrice(findCustomerPricing, InventoryItem);
      myFinalPrice = price;
    }

    if (!findCustomerAuthorization && !findCustomerPricing) {
      myFinalPrice = InventoryItem.Price1;
    }
    if (findCustomerAuthorization && findCustomerPricing) {
      hasCustomerAuthorization = true;
      const price = calculateItemPrice(findCustomerAuthorization, InventoryItem);
      myFinalPrice = price;
    }

    // check the subclass price
    let isInventorySubclass: any = await InventorySubclass.findOne({
      where: {
        Price_Subclass: InventoryItem.Price_Subclass,
      }
    })

    //check the special price
    const isInventorySpecials = await InventorySpecials.findOne({
      where: {
        Item_Number: Item_Number,
        Allowance: 0
      },
      order: [['myKey', 'DESC']], // or createdAt

    });

   
    if (!findCustomerAuthorization && !findCustomerPricing) {
      productPrice = InventoryItem.Price1;
    }

    if (isInventorySpecials) {

      let tempAllow = isInventorySpecials.dataValues;
      if (tempAllow.Perpetual) {
        letSpecailPrice = isInventorySpecials.dataValues.Price;
        allowancePrice = isInventorySpecials.dataValues.Allowance;
        allowancePriceType = isInventorySpecials.dataValues.AllowanceType;
      }
      if (tempAllow.Start_Date && tempAllow.End_Date) {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        const startDate = new Date(tempAllow.Start_Date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(tempAllow.End_Date);
        endDate.setHours(0, 0, 0, 0);

        if (currentDate >= startDate && currentDate <= endDate) {
          letSpecailPrice = isInventorySpecials.dataValues.Price;
          allowancePrice = isInventorySpecials.dataValues.Allowance;
          allowancePriceType = isInventorySpecials.dataValues.AllowanceType;
        }


      }
    }

    if (letSpecailPrice != null) {
      if (letSpecailPrice < myFinalPrice) {
        productPrice = letSpecailPrice;
        hasSpecailPriceApply = true;
      } else {
        productPrice = myFinalPrice;
      }

    }
    if (!productPrice) {
      productPrice = myFinalPrice;
    }



    /// check Allowance

    // let findAllowance: any = await InventorySpecials.findOne({
    //   where: {
    //     Item_Number: Item_Number,
    //     Allowance: {
    //       [Op.ne]: 0
    //     }
    //   }
    // });

    let findAllowance :any= await InventorySpecials.findOne({
      where: { Item_Number },
      order: [['myKey', 'DESC']], // or createdAt
    });
    
    findAllowance = findAllowance?.dataValues;
    if (!hasSpecailPriceApply) {
      if (findAllowance) {
        if (findAllowance.Perpetual) {
          if (findAllowance.AllowanceType === '$') {
            discountPrice += findAllowance.Allowance;
          }
          else if (findAllowance.AllowanceType === '%') {
            if (findAllowance.Allowance > 0) {
              discountPrice += productPrice * findAllowance.Allowance / 100;
            }

          }
        }

      }

      if (findAllowance) {
        if (findAllowance.Start_Date && findAllowance.End_Date) {
          const currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0);

          const startDate = new Date(findAllowance.Start_Date);
          startDate.setHours(0, 0, 0, 0);

          const endDate = new Date(findAllowance.End_Date);
          endDate.setHours(0, 0, 0, 0);

          // Check if current date is between start and end date (inclusive)
          if (currentDate >= startDate && currentDate <= endDate) {
            if (findAllowance.AllowanceType === '$') {
              discountPrice += findAllowance.Allowance;
            } else if (findAllowance.AllowanceType === '%') {
              discountPrice += (productPrice * findAllowance.Allowance) / 100;
              return discountPrice;
            }
          }
        }
      }
    }



    isInventorySubclass = isInventorySubclass?.dataValues;
    // check subclass discount
    if (!hasSpecailPriceApply) {
      if (isInventorySubclass) {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Normalize to date-only

        const startDate = new Date(isInventorySubclass.Start_Date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(isInventorySubclass.Cutoff_Date);
        endDate.setHours(0, 0, 0, 0);

        // Apply discount
        if (isInventorySubclass.UnlimitedFlag) {
          discountPrice += isInventorySubclass.Discount;
        } else if (startDate <= currentDate && currentDate <= endDate) {
          discountPrice += isInventorySubclass.Discount;
        }
      }
    }



    console.log(allowancePrice, 'allowancePrice')
    console.log(allowancePriceType, 'allowancePriceType')
    console.log(letSpecailPrice, 'myFinalPrice')
    console.log(productPrice, 'productPrice')
    console.log(myFinalPrice, 'myFinalPrice')
    console.log(letSpecailPrice, 'letSpecailPrice')
    console.log(hasSpecailPriceApply, 'hasSpecailPriceApply')
    console.log(discountPrice, 'discountPrice')

    // dicount 
    return productPrice - discountPrice


  } catch (error) {
    console.log(error)
    return null
  }
}

export async function getFirstValidPrice(data: PriceFields): Promise<number> {

  for (let i = 1; i <= 12; i++) {
    const key = `Price${i}` as keyof PriceFields;
    const value = data[key];
    if (value !== null && value !== undefined && value !== 0) {
      return value;
    }
  }
  return 0;
}

 async function getFirstValidPriceV1(data: PriceFields): Promise<number> {
  for (let i = 1; i <= 12; i++) {
    const key = `Price${i}` as keyof PriceFields;
    const value = data[key];
    if (value !== null && value !== undefined && value !== 0) {
      return value;
    }
  }
  return 0;
}

export async function getProductLimit(Item_Number: number) {
  const itemLimit = await ItemLimit.findOne({
    where: {
      Item_Number: Item_Number
    }
  })
  return itemLimit?.dataValues?.QtyLimit || null;
}

// export async function getTaxRateV1(OTP_Number: number, userJurisdiction: number) {

//   const taxRate = await TaxRatesOTP.findOne({
//     where: {
//       OTP_Number: OTP_Number,
//       Jurisdiction_State: userJurisdiction
//     }
//   });
//   let value = taxRate?.dataValues?.OTP_Rate || 0;
//   return value;
// }

export async function getTaxRateV1(
  OTP_Number: number,
  userJurisdiction: number,
  itemNumber: number,
  price: number
) {
  const taxRate = await TaxRatesOTP.findOne({
    where: {
      OTP_Number: OTP_Number,
      Jurisdiction_State: userJurisdiction
    }
  });

  let item = await Inventory.findOne({
    where: {
      Item_Number: itemNumber
    },
    attributes: [
      'Cig_Sticks',
      'BaseCost',
      'NetCost',
      'Cig_Pack',
      'Invoice_Cost',
      'SpecialTaxUnits'
    ]
  });
  item = item?.dataValues;

  let rate = taxRate?.dataValues?.OTP_Rate || 0;
  let value = taxRate?.dataValues?.OTP_Option || 0;

  let taxAmount = 0;

  switch (value) {
    case 0: // $ Rate / Stick
      taxAmount = rate
      break;

    case 1: // $ Rate / Ounce
      taxAmount = rate  // replace NetCost with weight field if available
      break;

    case 2: // % Rate on Net Cost (0.10 = 10%)
      taxAmount = rate * (item?.NetCost || 0);
      break;

    case 3: // % Rate on Base Cost
      taxAmount = rate * (item?.BaseCost || 0);
      break;

    case 4: // % Rate on Price
      taxAmount = rate * price;
      break;

    case 6: // $ Rate / Pack
      taxAmount = rate 
      break;

    case 7: // % Rate on MFG Inv Cost
      taxAmount = rate * (item?.Invoice_Cost || 0);
      break;

    case 8: // $ Rate / Ounce Rounded
      taxAmount = Math.ceil(rate || 0);
      break;

    case 9: // $ Rate / Special Tax Units
      taxAmount = rate
      break;

    case 10: // $ Rate / 100 Sticks
      taxAmount = rate 
      break;

    case 11: // $ Rate / 200 Sticks
      taxAmount = rate
      break;

    default:
      taxAmount = 0;
      break;
  }

  return taxAmount;
}

// export async function getTaxRateV1(
//   OTP_Number: number,
//   userJurisdiction: number,
//   itemNumber: number,
//   price: number
// ) {
//   const taxRate = await TaxRatesOTP.findOne({
//     where: {
//       OTP_Number: OTP_Number,
//       Jurisdiction_State: userJurisdiction
//     }
//   });

//   const item = await Inventory.findOne({
//     where: {
//       Item_Number: itemNumber
//     },
//     attributes: [
//       'Cig_Sticks',
//       'BaseCost',
//       'NetCost',
//       'Cig_Pack',
//       'Invoice_Cost',
//       'SpecialTaxUnits'
//     ]
//   });

//   let rate = taxRate?.dataValues?.OTP_Rate || 0;
//   let value = taxRate?.dataValues?.OTP_Option || 0;

//   let taxAmount = 0;

//   switch (value) {
//     case 0: // $ Rate / Stick
//       taxAmount = rate * (item?.Cig_Sticks || 0);
//       break;

//     case 1: // $ Rate / Ounce
//       taxAmount = rate * (item?.NetCost || 0); // replace NetCost with weight field if available
//       break;

//     case 2: // % Rate on Net Cost (0.10 = 10%)
//       taxAmount = rate * (item?.NetCost || 0);
//       break;

//     case 3: // % Rate on Base Cost
//       taxAmount = rate * (item?.BaseCost || 0);
//       break;

//     case 4: // % Rate on Price
//       taxAmount = rate * price;
//       break;

//     case 6: // $ Rate / Pack
//       taxAmount = rate * (item?.Cig_Pack || 0);
//       break;

//     case 7: // % Rate on MFG Inv Cost
//       taxAmount = rate * (item?.Invoice_Cost || 0);
//       break;

//     case 8: // $ Rate / Ounce Rounded
//       taxAmount = rate * Math.ceil(item?.NetCost || 0);
//       break;

//     case 9: // $ Rate / Special Tax Units
//       taxAmount = rate * (item?.SpecialTaxUnits || 0);
//       break;

//     case 10: // $ Rate / 100 Sticks
//       taxAmount = rate * ((item?.Cig_Sticks || 0) / 100);
//       break;

//     case 11: // $ Rate / 200 Sticks
//       taxAmount = rate * ((item?.Cig_Sticks || 0) / 200);
//       break;

//     default:
//       taxAmount = 0;
//       break;
//   }

//   return taxAmount;
// }


export async function getJurisdiction(userId: number) {
  const user = await Customer.findOne({
    where: {
      C_Number: userId
    },
    attributes: ['Jurisdiction_State']
  });
  return user?.dataValues?.Jurisdiction_State || null;
}
export async function getInventoryOnHand(Item_Number: number) {

  const date = moment().format('YYYY-MM-DD');
  const result: any = await OrderHeader.findAll({
    attributes: [],
    where: {
      Order_Updated: false,
      Order_Date: date
    },
    include: [
      {
        model: OrderDetail,
        as: 'orderDetails',
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('orderDetails.Quantity_Ordered')), 'totalQuantityOrdered']
        ],
        where: {
          Item_Number: Item_Number
        }
      }
    ],
    group: ['OrderHeader.Order_Number'],
    raw: true
  });


  const totalQty = result
  .map((r: any) => Number(r['orderDetails.totalQuantityOrdered'] || 0))
  .reduce((sum: any, qty: any) => sum + qty, 0);

console.log(totalQty, 'totalQty----->'); // 13

  

  const inventoryOnHandSum: any = await InventoryStatus.findAll({
    attributes: [[fn("SUM", col("Inventory_OnHand")), "total_onhand"]],
    where: {
      Item_Number: Item_Number,
      Code: 0,
    },
    raw: true,
  });




  return (inventoryOnHandSum[0].total_onhand || 0) - totalQty;
}

export async function checkRegisterCustomer(id: number) {
  const customer = await Retailer.findOne({
    where: {
      Customer_Number: id
    },

  });
  return customer?.dataValues ? true : false;
}


export async function getRegisterCustomer(id: number) {
  const customer = await Customer.findOne({
    where: {
      C_Number: id
    }
  });
  return customer?.dataValues;
}

export async function getRegisterCustomerName(id: number) {
  const customer = await Customer.findOne({
    where: {
      C_Number: id
    },
    attributes: ['C_Name', 'C_Number']
  });
  return customer?.dataValues
}

export async function hasDiscountedItem(
  Item_Number: number,
  price_subclass: number
): Promise<boolean> {
  // Helper: coerce any truthy DB bit/boolean into a strict boolean
  const asBool = (v: any) => v === true || v === 1 || v === "1";

  // Helper: normalize a Date-like value to local midnight, or null if invalid
  const asLocalMidnight = (value: any): Date | null => {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Today at local midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1) Check InventorySpecials
  let special = await InventorySpecials.findOne({
    where: { Item_Number },
    raw: true,
  });

  if (special) {
    // raw:true already returns a plain object (no dataValues)
    if (asBool((special as any).Perpetual)) {
      return true;
    }

    const startDate = asLocalMidnight((special as any).Start_Date);
    const endDate = asLocalMidnight((special as any).End_Date);

    if (startDate && endDate) {
      // Inclusive range: start <= today <= end
      if (today >= startDate && today <= endDate) return true;
    }
  }

  // 2) If not in specials (or not active by date), check InventorySubclass
  let subclass = await InventorySubclass.findOne({
    where: { Price_Subclass: price_subclass },
    raw: true,
  });

  if (subclass) {
    if (asBool((subclass as any).UnlimitedFlag)) {
      return true;
    }

    const startDate = asLocalMidnight((subclass as any).Start_Date);
    const endDate = asLocalMidnight((subclass as any).Cutoff_Date);

    if (startDate && endDate) {
      if (today >= startDate && today <= endDate) return true;
    }
  }

  // 3) Default: no discount
  return false;
}


export function checkTimeOut(isTImeOut: string) {
  const currentTimeUTC = moment.utc();
  const isTimeOutMoment = moment.utc(isTImeOut, 'HH:mm:ss');
  return currentTimeUTC.isBefore(isTimeOutMoment);
}

export async function getDiscountsForItemNumbers(itemNumbers: number[], userId: number,) {
  const map: Record<number, number> = {};
  await Promise.all(itemNumbers.map(async item => {
    const price = await getDiscount(item, userId);
    if (price) map[item] = price;
  }));
  return map;
}

// export async function getInventoryMap(itemNumbers: number[]) {
//   const items = await InventoryStatus.findAll({
//     where: { Item_Number: { [Op.in]: itemNumbers } },
//     attributes: ['Item_Number', 'Inventory_OnHand']
//   });
//   const map: Record<number, number> = {};
//   items.forEach((i: any) => map[i.Item_Number] = i.Inventory_OnHand);
//   return map;
// }


/**
 * Renders an order table using your field names.
 * rows[i] must have: Description, Pack, CaseCount, Quantity_Ordered, Item_Number
 * 
 * Optional: pass showMoney:true AND getPrice:(row)=>number to show Price/Total.
 */
export function renderOrderTableFromERP(rows: any, opts: any = {}, orderNumber: any, customerInfo?: any, warehouseInfo?: any) {
  const {
    showMoney = false,
    getPrice = null,               // (row) => number | null
    headerBg = '#3c7795',
    headerColor = '#ffffff'
  } = opts;

  const esc = (s: any) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const money = (n: any) =>
    (typeof n === 'number' && isFinite(n)) ? `$${n.toFixed(2)}` : '';

  // Get current date
  const currentDate = new Date();
  const month = currentDate.toLocaleString('default', { month: 'long' });
  const day = currentDate.getDate();
  const year = currentDate.getFullYear();
  const todayDate = `${month} ${day} ${year}`;

  const head = `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Price Quote - Order ${orderNumber}</title>
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #ffffff;
    color: #333333;
    line-height: 1.4;
    padding: 15px;
    padding-bottom: 80px;
    font-size: 12px;
  }
  

  
  .header-section {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #3c7795;
  }
  
  .customer-info {
    flex: 1;
    text-align: left;
  }
  
  .customer-info div {
    margin-bottom: 3px;
    font-size: 11px;
    line-height: 1.2;
  }
  
  .customer-info .label {
    font-weight: bold;
    color: #3c7795;
  }
  
  .center-title {
    flex: 1;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .center-title h1 {
    font-size: 24px;
    font-weight: bold;
    color: #3c7795;
    margin: 0;
  }
  
  .warehouse-info {
    flex: 1;
    text-align: right;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  .warehouse-info div {
    margin-bottom: 3px;
    font-size: 11px;
    line-height: 1.2;
    word-break: break-word;
  }
  
  .warehouse-info .label {
    font-weight: bold;
    color: #3c7795;
  }
  
  .order-table {
    width: 100%;
    border-collapse: collapse;
    background-color: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    font-size: 11px;
  }
  
  .order-table thead th {
    background-color: #3c7795;
    color: #ffffff;
    font-weight: 600;
    font-size: 11px;
    text-align: left;
    padding: 10px 8px;
    border: none;
  }
  
  .order-table tbody td {
    padding: 10px 8px;
    border-top: 1px solid #e6eef2;
    font-size: 11px;
    vertical-align: top;
  }
  
  .order-table tbody tr:hover {
    background-color: #f8f9fa;
  }
  
  .product-info {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  
  .product-icon {
    width: 18px;
    height: 18px;
    background-color: #f0f0f0;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #666;
    flex-shrink: 0;
  }
  
  .product-details {
    flex: 1;
  }
  
  .product-name {
    font-weight: 500;
    color: #333333;
    margin-bottom: 2px;
    line-height: 1.2;
    font-size: 11px;
  }
  
  .product-meta {
    font-size: 10px;
    color: #6b7280;
    line-height: 1.1;
  }
  
  .item-number {
    font-family: 'Courier New', monospace;
    color: #333333;
    font-size: 11px;
  }
  
  .quantity {
    text-align: center;
    font-weight: 500;
    color: #333333;
    font-size: 11px;
  }
  
  .price, .subtotal, .total-price {
    text-align: right;
    font-family: 'Courier New', monospace;
    color: #333333;
    white-space: nowrap;
    font-size: 11px;
  }
  
  .currency {
    color: #666666;
  }
  
  .order-summary {
    margin-top: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 6px;
    border-left: 3px solid #3c7795;
    font-size: 11px;
  }
  
  .summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  
  .summary-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .summary-label {
    font-weight: 500;
    color: #333333;
  }
  
  .summary-value {
    font-weight: 600;
    color: #3c7795;
  }
  
  .total-row {
    border-top: 1px solid #e6eef2;
    padding-top: 8px;
    margin-top: 8px;
    font-size: 12px;
  }
  
  .notes-section {
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 4px;
    padding: 10px;
    font-size: 10px;
    color: #856404;
    text-align: center;
    font-style: italic;
    z-index: 1000;
  }
  
  @page {
    margin: 20mm;
  }
  
  /* Hide notes on all pages except the last one */
  @page :not(:last) {
    margin-bottom: 20mm;
  }
  
  @page :not(:last) .notes-section {
    display: none;
  }
  
  @page :last {
    margin-bottom: 40mm;
  }
</style>
</head>
<body>
  <div class="header-section">
    <div class="customer-info">
      <div><span class="label">Account:</span> ${customerInfo?.C_Number || 'N/A'}</div>
      <div><span class="label">Customer:</span> ${customerInfo?.C_Name || 'N/A'}</div>
      <div>${customerInfo?.C_CoName || ''}</div>
      <div>${customerInfo?.C_Address || ''}</div>
      <div>${customerInfo?.C_City || ''}, ${customerInfo?.C_State || ''} ${customerInfo?.C_Zip || ''}</div>
      <div>${customerInfo?.C_Phone || ''}</div>
    </div>
    
    <div class="center-title">
      <h1>PRICE QUOTE</h1>
    </div>
    
    <div class="warehouse-info">
      <div><span class="label"> Date:</span> ${todayDate}</div>
      <div><span class="label">Order Number:</span> ${orderNumber}</div>
      <div class="label">${warehouseInfo?.D_Name || 'N/A'}</div>
      <div  class="label">${warehouseInfo?.D_Addr1 || ''}</div>
      <div class="label">${warehouseInfo?.D_City || ''}, ${warehouseInfo?.D_State || ''} ${warehouseInfo?.D_Zip || ''}</div>
      <div class="label">${warehouseInfo?.D_Phone || ''}</div>
      <div class="label">${warehouseInfo?.D_Email || ''}</div>
    </div>
  </div>
  
  <table class="order-table">
    <thead>
      <tr>
        <th>Products</th>
        <th>Item Number</th>
        <th>Qty</th>
        ${showMoney ? '<th>Price</th><th>Total Price</th>' : ''}
      </tr>
    </thead>
    <tbody>
`;

  const body = rows.map((row: any) => {
    const name = row.Description;
    const pack = row.Pack;
    const caseQty = row.CaseCount;
    const qty = row.Quantity_Ordered;
    const itemNo = row.Item_Number;

    let priceCell = '', subtotalCell = '', totalPriceCell = '';
    if (showMoney && typeof getPrice === 'function') {
      const unitPrice = getPrice(row);
      const subtotal = (typeof unitPrice === 'number' && typeof qty === 'number')
        ? unitPrice * qty
        : null;
      priceCell = `<td class="">${money(unitPrice)}</td>`;
      totalPriceCell = `<td class="">${money(subtotal)}</td>`;
    }

    // Get first letter of product name for icon

    return `
    <tr>
      <td>
        <div class="product-info">
         
          <div class="product-details">
            <div class="product-name">${esc(name)}</div>
            <div class="product-meta">Pack: ${esc(pack)} &nbsp; Case: ${esc(caseQty)} &nbsp; Size: ${esc(row.Size)}</div>
          </div>
        </div>
      </td>
      <td class="item-number">${esc(itemNo)}</td>
      <td class="quantity">${esc(qty)}</td>
      ${showMoney ? priceCell + subtotalCell + totalPriceCell : ''}
    </tr>`;
  }).join('\n');

  // Calculate totals for summary
  let totalItems = 0;
  let totalQuantity = 0;
  let totalAmount = 0;

  if (showMoney && typeof getPrice === 'function') {
    rows.forEach((row: any) => {
      totalItems++;
      totalQuantity += row.Quantity_Ordered || 0;
      const unitPrice = getPrice(row);
      const subtotal = (typeof unitPrice === 'number' && typeof row.Quantity_Ordered === 'number')
        ? unitPrice * row.Quantity_Ordered
        : 0;
      totalAmount += subtotal;
    });
  } else {
    rows.forEach((row: any) => {
      totalItems++;
      totalQuantity += row.Quantity_Ordered || 0;
    });
  }

  const tail = `
    </tbody>
  </table>
  
  ${showMoney ? `
  <div class="order-summary">
    <div class="summary-row">
      <div class="summary-item">
        <span class="summary-label">Total Items:</span>
        <span class="summary-value">${totalItems}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Total Quantity:</span>
        <span class="summary-value">${totalQuantity}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Total Amount:</span>
        <span class="summary-value">${money(totalAmount)}</span>
      </div>
    </div>
  </div>
  ` : `
  <div class="order-summary">
    <div class="summary-row">
      <div class="summary-item">
        <span class="summary-label">Total Items:</span>
        <span class="summary-value">${totalItems}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Total Quantity:</span>
        <span class="summary-value">${totalQuantity}</span>
      </div>
    </div>
  </div>
  `}
  
 
</body>
</html>`;

  return head + body + tail;
}



export async function generatePDFFromHTML(html: string, orientation: 'portrait' | 'landscape' = 'portrait'): Promise<Buffer> {
  const puppeteer = require('puppeteer');

  return new Promise(async (resolve, reject) => {
    let browser;
    try {
      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });

      // Create new page
      const page = await browser.newPage();

      // Set content and wait for it to load
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Generate PDF with proper settings
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        landscape: orientation === 'landscape',
        margin: {
          top: '25mm',
          right: '20mm',
          bottom: '30mm',
          left: '20mm'
        },
        displayHeaderFooter: true,
        headerTemplate: '<div style="font-size: 10px; text-align: right; width: 100%; padding-right: 20px; color: #666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
        footerTemplate: '<div style="background:#aad8ef; color:#3c7795; font-size:10px; text-align:center; padding:10px 16px; width:100%;">Notes: Pricing valid through the "Valid Until" date. Quantities, specifications, and availability subject to change. Please confirm before ordering.</div>'
      });

      await browser.close();
      resolve(pdfBuffer);

    } catch (error) {
      if (browser) {
        await browser.close();
      }
      reject(error);
    }
  });
}


export async function getInventoryFullItemNumber(itemNumber: number) {
  const whereClause: any = {
    Item_Number: itemNumber,
  };

  

  const inventory = await Inventory.findOne({
    where: whereClause,
    attributes: [
      'Item_Number',
      'Description',
      'ALT_Description2',
      'Pack',
      'CaseCount',
      'UOM',
      'Price1',
      'Price2',
      'BaseCost',
      'Invoice_Cost',
      'AvgCost',
      'NetCost',
      'eCommerce',
      'I_Inactive',
      'Date_Created',
      'OTP_Number',
      'Sales_Category',
      'UnitOunces',
      'Price_Class',
      'Price_Subclass',
    ],
    include: [
      {
        model: SalesCategory,
        as: 'SalesCategory',
        attributes: ['Category_Desc'],
        required: false,
      },
      {
        model: PriceClass,
        as: 'PriceClass',
        attributes: ['Class_Desc'],
        required: false,
      },
      {
        model: InventoryUPC,
        as: 'UPCList',
        attributes: ['UPC_Number'],
        where: {
          Status: 0,
        },
        required: false,
      },
    ],
  });

  return inventory?.dataValues || false;
}

export async function isItemInActive(itemNumber: number) {
  const inventory = await Inventory.findOne({
    where: { Item_Number: itemNumber, I_Inactive: true },
  });
  return inventory?.dataValues ? true : false;
}

export async function checkQtyDiscount(itemNumber: number, customerId: number, price: number) {
  let response = {
    allowToDiscount: false,
    hasCaseDiscount: false,
    hasQtyDiscount: false,
    isCaseDiscount: false,
    isQtyDiscount: false,
    percentageCaseDiscount: 0,
    minimumQtyForCaseDiscount: 0,
    qtyDiscount: [],
    price: price,
  }
  let customer: any = await Customer.findOne({
    where: { C_Number: customerId },
    attributes: ['C_CaseDiscount'],
  });
  customer = customer?.dataValues || null;

  if (!customer?.C_CaseDiscount) {
    return response;
  }
  const qtyDiscount: any = await InventoryQtyDiscount.findAll({
    where: { Item_Number: itemNumber },
    attributes: ['BreakQty', 'BreakDiscount', 'BreakAmount', 'BreakPriceLevel'],
  });

  console.log(qtyDiscount, 'qtyDiscount')

  if (qtyDiscount.length > 0) {

    const output = qtyDiscount.map((item: any) => ({
      minQty: item.BreakQty,
      perDiscount: item.BreakDiscount,
      amountDiscount: item.BreakAmount,
      hasPercentageDiscount: item.BreakDiscount > 0

    }));

    response.allowToDiscount = true;
    response.hasQtyDiscount = true;
    response.isQtyDiscount = true;
    response.isCaseDiscount = false;
    response.percentageCaseDiscount = 0
    response.minimumQtyForCaseDiscount = 0
    response.qtyDiscount = output;
    return response;
  }

  let caseDiscount = await Inventory.findOne({
    where: {
      Item_Number: itemNumber,
      CaseDiscount_Pct: { [Op.gt]: 0 }
    },
    attributes: ["CaseCount", "CaseDiscount_Pct"],
  });

  caseDiscount = caseDiscount?.dataValues || null;

  if (caseDiscount?.CaseDiscount_Pct) {
    response.allowToDiscount = true;
    response.hasQtyDiscount = true;
    response.isCaseDiscount = true;
    response.isQtyDiscount = false;
    response.percentageCaseDiscount = caseDiscount?.CaseDiscount_Pct * 100 || 0
    response.minimumQtyForCaseDiscount = caseDiscount?.CaseCount || 0
    response.qtyDiscount = [];

    return response;
  }

  return response;


}

export async function getTopLatestItems() {
  const productList = await Inventory.findAll({
    attributes: ['Item_Number'],
    where: {
    
      I_Inactive: false,
      ShortOrderForm: true,
    },
    order: [['Item_Number', 'DESC']],
    limit: 30,
    offset: 0,
    logging: console.log // <-- logs the SQL
  });
  

  return productList;
}


export const sendEmailToMarketing = async (data: any) => {
  const {to, subject, html,attachments,id,cc} = data;
  const emailJobs: Promise<any>[] = [];
  for (const email of to) {
    emailJobs.push(
      sendDistributorEmail(email, subject, html, attachments, cc)
    );
  }
  const results = await Promise.all(emailJobs);

  // Separate successful and failed emails
  const successEmails = results.filter(r => r.status === 'fulfilled').map(r => r.email);
  const failedEmails = results.filter(r => r.status === 'rejected');

  await EmailMarketing.update({ status: 'sent' }, { where: { id } });
  console.log('✅ Successfully sent:', successEmails);
  console.log('❌ Failed to send:', failedEmails.map(f => ({ email: f.email, error: f.error })));
}
export function generateBarcode(orderNumber: number | string): string {
  // Convert to string for concatenation
  const base = String(orderNumber);

  // Last 6 digits of timestamp (compact uniqueness)
  const timestamp = Date.now().toString().slice(-6);

  // Random 3-digit suffix
  const random = Math.floor(100 + Math.random() * 900).toString();

  // Final barcode includes orderNumber always
  return `${base}${timestamp}${random}`;
}

export function generateRandomSixDigitNumber() {
  return Math.floor(100000 + Math.random() * 900000);
}

export function pgArrayToJsArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;    // already an array
  return value
    .replace("{", "")
    .replace("}", "")
    .split(",")
    .map((v: any) => v.replace(/"/g, ""));
}



export async function getPrepaidTaxRate(userJurisdiction:number,salesId:number){
 
  const taxRate = await SalesCategoryTaxRate.findOne({
    where: {
      Jurisdiction_State: userJurisdiction,
      Sales_Category: salesId,
    },
  });

  if(!taxRate){
    return 0;
  }else{


    const taxRateValue = await TaxRates.findOne({
      where:{
        Jurisdiction_State: userJurisdiction,
      },
      attributes: ['TaxRate'],
    })

    return taxRateValue?.dataValues?.TaxRate || 0;
  }

}


export async function getCustomerExcludeItem(
  state: string,
  zip: string,
  jurisdiction: number
) {
  const rows = await Inventory_ExcludeState.findAll({
    where: {
      [Op.or]: [
        { C_State: state },
        { C_Zip: zip },
        { Jurisdiction_State: jurisdiction }
      ]
    },
    attributes: ["Item_Number"],   // return only Item_Number
    raw: true                      // return plain objects
  });

  // convert array of objects → array of Item_Number
  return rows.map((r :any)=> Number(r.Item_Number));
}

export async function excludeItemByUser(userId: number){
  const excludeItem = await CustAuthorized.findAll({
    where: {
      C_Number: userId,
      Item_Option: 99
    },
    attributes: ['Item_Number'],
  })
  if(excludeItem.length > 0){
    return excludeItem.map((item: any) => Number(item.Item_Number));
  }
  return [];
}


export const dayFunctionObject:any = {
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6,
  'sunday': 7,
}


export const toNum = (v: any) => {
  // Handles: number, "5.74", "5.74 ", null, undefined, Decimal-like objects
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = parseFloat(v.trim());
    return Number.isFinite(n) ? n : 0;
  }
  // Some drivers return DECIMAL as object; try valueOf/toString
  const n = parseFloat(String(v).trim());
  return Number.isFinite(n) ? n : 0;
};



export function hasPriceChange(obj:any){
  const keysToCheck = ['Price1', 'Price2', 'Price3',"Price4","Price5","Price6","BaseCost","NetCost","Invoice_Cost"];
  return keysToCheck.some((key:any) => obj.hasOwnProperty(key));
}



export async function getAllowedSalesCategoriesAndPriceClasses(customerNumber: number) {
  // 1) Fetch customer flags
  const customer :any= await Customer.findOne({
    where: { C_Number: customerNumber },
    raw: true,
  });

  if (!customer) throw new Error("Customer not found");

  // 2) Build allowed category list [1..12]
  const allowedCategories: number[] = [];
  for (let i = 1; i <= 12; i++) {
    const key = `Category_Allow${String(i).padStart(2, "0")}`;
    if (Number(customer[key] ?? 0) === 1) allowedCategories.push(i);
  }

  if (allowedCategories.length === 0) {
    return { priceClasses: [], salesCategories: [] };
  }

  // 3) Fetch allowed Sales Categories (only needed columns)
  const salesCategories = await SalesCategory.findAll({
    where: { Sales_Category: { [Op.in]: allowedCategories } },
    attributes: ["Sales_Category", "Category_Desc"],
    order: [["Sales_Category", "ASC"]],
    raw: true,
  });

  // 4) Fetch Price Classes that belong to those groups (only needed columns)
  const priceClasses = await PriceClass.findAll({
    where: { Sales_Category_Group: { [Op.in]: allowedCategories } },
    attributes: ["Price_Class", "Class_Desc"],
    order: [["Price_Class", "ASC"]],
    raw: true,
  });

  return { priceClasses, salesCategories };
}

export async function getAllowedSalesCategories(customerNumber: number) {
  // 1) Fetch customer flags
  const customer :any= await Customer.findOne({
    where: { C_Number: customerNumber },
    raw: true,
  });

  if (!customer) throw new Error("Customer not found");

  // 2) Build allowed category list [1..12]
  const allowedCategories: number[] = [];
  for (let i = 1; i <= 12; i++) {
    const key = `Category_Allow${String(i).padStart(2, "0")}`;
    if (Number(customer[key] ?? 0) === 1) allowedCategories.push(i);
  }

  if (allowedCategories.length === 0) {
    return { priceClasses: [], salesCategories: [] };
  }

  // 3) Fetch allowed Sales Categories (only needed columns)
  const salesCategories = await SalesCategory.findAll({
    where: { Sales_Category: { [Op.in]: allowedCategories } },
    attributes: ["Sales_Category", "Category_Desc"],
    order: [["Sales_Category", "ASC"]],
    raw: true,
  });

  const retrunSalesCategories = salesCategories.map((r: any) => r.Sales_Category);
 

  return {  retrunSalesCategories };
}
