import dayjs from "dayjs";
import { sendEmail } from "./sendMail";
import { PuppeteerPDFGenerator } from "./puppeteerPdfGenerator";
import { Distributor } from "../models/mmsql/distributor.model";
import { generateDistributorOrderNotificationEmail, generateOrderConfirmationEmail, generateReturnOrderNotificationEmail } from "../view/emails";
import HomeSettings from "../models/postgres/homeSetting.model";
import settings from "../models/postgres/setting.model";
import { OrderHeader } from "../models/mmsql/orderHeader.model";

type OrderDefaultValues = Record<string, number | string | null | boolean | Date>;

export const getDefaultOrderValues = (): OrderDefaultValues => {
  const now = dayjs();

  const dateOnly = now.format("YYYY-MM-DD");              // '2025-07-10'
  const dateObject = new Date(now.format("YYYY-MM-DD"));  // as JS Date object
  const dateTimeObject = new Date(now.format("YYYY-MM-DDTHH:mm:ss")); // '2025-07-10T21:10:00'

  const defaultObj: OrderDefaultValues = {
    // Note: Order_Number is excluded as it's auto-increment
    Order_Updated: false,
    Order_Type: 0,
    Confirmed: false,
    Reprint_Invoice_Required: false,
    InventoryPrepaid_CIG: false,
    InventoryPrepaid_OTP: false,
    Tracking_Number: "",
    OtherPricingLevel: 0,
    Picklist_Printed: false,
    Labels_Printed: false,
    ePickStatus: 0,
    Workstation_ID: 0,
    Picker_ID: 0,
    Checker_ID: 0,
    P_Number: 0,
    eInvoice: 0,

    stax_State: 0,
    stax_County: 0,
    stax_City: 0,
    Bundles: 0,
    Totes: 0,
    Cig10: 0,
    Cig25: 0,
    POS_Cash: 0,
    POS_Check: 0,
    POS_Credit: 0,
    POS_Debit: 0,
    POS_Other: 0,
    POS_House: 0,
    HouseChargeApplied: 0,
    Commission_Paid: 0,
    Commission_Paid_Cust: 0,
    WarehouseID: 0,
    Suspend: false,
    Order_Number_Legacy: 0,
    Invoice_Number_Legacy: 0,
    Invoice_Number: 0,
    Order_Deleted: false,
    Delete_User_Number: 0,
    pCash: 0,
    pCheck: 0,
    pCredit: 0,
    pDebit: 0,
    pOther: 0,
    pPaidOut: 0,
    CardType_ID_Credit: 0,
    CardType_ID_Debit: 0,
    CardType_ID_Other: 0,
    MergedToOrder: 0,
    Prebook_CreateNew: false,
    Prebook_Prompt: false,
    POS_CardFee: 0,
    POS_PaidOnAccount: 0,
    AssignedToEPickUser: null,
    // AssignedOnforEPick:null,
    EpickStatusFromPicker: null,
    EpickCompletedOn: null,
    OrderedOn: null,

    // // ✅ Date-only fields as JS Date
    // Order_Date: dateObject,
    // Control_Date: dateObject,
    // Delivery_Date: dateObject,
    // Invoice_Date: dateObject,
    // QB_TransferDate: dateObject,
    // Delete_Date: dateObject,

    // // ✅ DateTime fields as JS Date
    // POS_Time: dateTimeObject,
    // Delete_Time: dateTimeObject,
    // Invoice_Time: dateTimeObject,
    // Picklist_Time: dateTimeObject,
    // Manifest_Time: dateTimeObject,

    TaxesOTP_State: 0,
    TaxesOTP_County: 0,
    TaxesOTP_City: 0,
    TaxesCIG_State: 0,
    TaxesCIG_County: 0,
    TaxesCIG_City: 0,
    PrepaidTax_Amount: 0,
    QB_Transfer: 0,
  };

  for (let i = 1; i <= 12; i++) {
    const key = String(i).padStart(2, "0");
    defaultObj[`Sales${key}`] = 0;
    defaultObj[`Taxes${key}`] = 0;
  }

  return defaultObj;
};

export const nonDefaultValuesObj = {
  C_Number: null,
  S_Number: null,
  Order_Source: 0,
  AR_C_Number: null,
  Jurisdiction_State: null,
  Jurisdiction_County: null,
  Jurisdiction_City: null,
  Route_Number: null,
  Stop_Number: null,
  Delivery_ID: null,
  Reference: null,
  User_ID: null,

  Invoice_Type: null,
  Invoice_Deposit: null,
  Delivery_Charge: null,
  Other_Charge: null,
  Invoice_Total: null,
  Sales_Taxable: null,
  Sales_NonTaxable: null,
  Cig20: null,
  Cig10tax: null,
  Cig20tax: null,
  Cig25tax: null,
  POS_ChangeDue: null,
  Points: null,
  Total_Weight: null,
  Delivery_Charge_Select: null,
  Other_Charge_Select: null
};

export const getNextOrderNumber = async () => {
  const orderNumber = await OrderHeader.max('Order_Number');
  return (orderNumber as number) + 1;
}


type OrderDetailDefaultValues = Record<string, number | string | boolean | null>;

export const getDefaultOrderDetailValues = (): OrderDetailDefaultValues => {
  // const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

  const defaults: OrderDetailDefaultValues = {
    

    Inventory_QtyDeductRegular: 0,
    Inventory_QtyDeductPrepaid: 0,
    Inventory_UpdateStamp_State: 0,
    Inventory_UpdateStamp_County: 0,
    Inventory_UpdateStamp_City: 0,
    Promo_Number: 0,
    Unit_Code: false,
    OrderDetail_Code: " ",
    Delivered: false,
    Credit_ReturnToStock: false,
    LineComplete: false,
    PrepaidTax_Amount: 0,
    Taxable: false,
    GL_Special: 0,
    Confirmed: false,
    Override_Code: 0,
    PickerNumber: 0,
    CreditIssuedAgainst: 0,
    Tote_ID: 0,
    Special_ID: 0,
    Order_Number_Legacy: 0,
    PPD_PackType: 0,
    PPD_Packs: 0,
    Prebook_ID: 0,
    MergedFromOrder: 0,
    AddOnDeposit_Item_Number: 0,
    EPick_ItemStatus: null,
    EPick_ItemStatusOn: null,
    Item_Message: null,
    // CasesPerPallet: 0
  };

  return defaults;
};



export const sendEmailToOrder = async (
  orderHeaderCreated: any,
  orderDetails: any[],
  customer: any,
  Delivery_Charge: number
) => {
  try {
    const orderSource =
      orderHeaderCreated.Order_Source === 12
        ? 'App'
        : orderHeaderCreated.Order_Source === 13
        ? 'Web'
        : 'ERP';

    // 1️⃣ Generate PDF for customer
    const pdfPath = await PuppeteerPDFGenerator.generateOrderRequestPDF(
      { orderHeader: orderHeaderCreated, orderDetails },
      customer
    );

    // 2️⃣ Prepare customer email HTML
    const customerEmailHtml = generateOrderConfirmationEmail(
      customer.C_Name,
      orderHeaderCreated.Order_Number,
      new Date(orderHeaderCreated.Order_Date).toLocaleDateString(),
      orderSource,
      orderDetails,
      Delivery_Charge
    );

    // 3️⃣ Send email to customer (if email exists)
    if (customer.C_Email) {
      const sendCustomer = process.env.SEND_CUSTOMER_EMAIL === 'true';
      let sendCustomerEmail = sendCustomer ? customer.C_Email : process.env.EMAIL_FROM || "CDT TEAM";
      console.log(sendCustomerEmail,'sendCustomerEmail');
      await sendEmail({
         to: sendCustomerEmail,
        subject: `Order Confirmation #${orderHeaderCreated.Order_Number} - CDT`,
        html: customerEmailHtml,
        attachments: [
          {
            filename: `Order_${orderHeaderCreated.Order_Number}.pdf`,
            path: pdfPath
          }
        ]
      });

      // Clean up PDF after sending
      setTimeout(async () => {
        await PuppeteerPDFGenerator.deletePDFFile(pdfPath);
      }, 5000);
    }

    // 4️⃣ Send distributor email
    let distributor: any = await Distributor.findOne({
      where: {
        // Add distributor search condition here if required
      }
    });
    distributor = distributor?.dataValues;

    const settingsRecord: any = await settings.findOne({});
    const orderEmailNotification = settingsRecord?.orderEmailNotification;


    const distributorEmailHtml = generateDistributorOrderNotificationEmail(
      distributor?.D_Name || 'CDT Distributor',
      customer.C_Name,
      customer.C_Number,
      customer.C_Email || '',
      customer.C_Phone || '',
      orderHeaderCreated.Order_Number,
      new Date(orderHeaderCreated.Order_Date).toLocaleDateString(),
      orderSource,
      orderDetails,
      Delivery_Charge
    );

    const distributorEmail = distributor?.D_Email || 'distributor@yopmail.com';

    let emailToSend = orderEmailNotification || distributorEmail;


    await sendEmail({
      to: emailToSend,
      subject: `New Order #${orderHeaderCreated.Order_Number} - Action Required`,
      html: distributorEmailHtml
    });

    console.log(`✅ Emails sent successfully for Order #${orderHeaderCreated.Order_Number}`);
  } catch (error) {
    console.error('❌ Error sending emails for order:', error);
    throw error; // Let the caller decide if they want to fail or ignore.
  }
};


export const sendEmailToReturnOrder = async (
  orderHeaderCreated: any,
  orderDetails: any[],
  customer: any,
  Delivery_Charge: number
) => {
  try {
    const orderSource =
      orderHeaderCreated.Order_Source === 12
        ? 'App'
        : orderHeaderCreated.Order_Source === 13
        ? 'Web'
        : 'ERP';

    // 1️⃣ Generate PDF for customer
    const pdfPath = await PuppeteerPDFGenerator.generateOrderRequestPDF(
      { orderHeader: orderHeaderCreated, orderDetails },
      customer
    );

    // 2️⃣ Prepare customer email HTML
    const returnEmailHtml = generateReturnOrderNotificationEmail(
      "CDT Distributor",
      customer.C_Name,
      customer.C_Number,
      customer.C_Email || "",
      customer.C_Phone || "",
      orderHeaderCreated.Return_Number,
      new Date(orderHeaderCreated.Return_Date).toLocaleDateString(),
      orderSource,
      orderDetails
    );
    

    // 3️⃣ Send email to customer (if email exists)
    if (customer.C_Email) {
      const sendCustomer = process.env.SEND_CUSTOMER_EMAIL === 'true';
      let sendCustomerEmail = sendCustomer ? customer.C_Email : process.env.EMAIL_FROM || "CDT TEAM";
      console.log(sendCustomerEmail,'sendCustomerEmail');
      await sendEmail({
         to: sendCustomerEmail,
        subject: `Order Confirmation #${orderHeaderCreated.Order_Number} - CDT`,
        html: returnEmailHtml,
        attachments: [
          {
            filename: `Order_${orderHeaderCreated.Order_Number}.pdf`,
            path: pdfPath
          }
        ]
      });

      // Clean up PDF after sending
      setTimeout(async () => {
        await PuppeteerPDFGenerator.deletePDFFile(pdfPath);
      }, 5000);
    }

    // 4️⃣ Send distributor email
    let distributor: any = await Distributor.findOne({
      where: {
        // Add distributor search condition here if required
      }
    });
    distributor = distributor?.dataValues;

    const distributorEmailHtml = generateDistributorOrderNotificationEmail(
      distributor?.D_Name || 'CDT Distributor',
      customer.C_Name,
      customer.C_Number,
      customer.C_Email || '',
      customer.C_Phone || '',
      orderHeaderCreated.Order_Number,
      new Date(orderHeaderCreated.Order_Date).toLocaleDateString(),
      orderSource,
      orderDetails,
      Delivery_Charge
    );

    const distributorEmail = distributor?.D_Email || 'distributor@yopmail.com';

    await sendEmail({
      to: distributorEmail,
      subject: `New Order #${orderHeaderCreated.Order_Number} - Action Required`,
      html: distributorEmailHtml
    });

    console.log(`✅ Emails sent successfully for Order #${orderHeaderCreated.Order_Number}`);
  } catch (error) {
    console.error('❌ Error sending emails for order:', error);
    throw error; // Let the caller decide if they want to fail or ignore
  }
};
