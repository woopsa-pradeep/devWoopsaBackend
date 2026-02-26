import { InvoiceTemplate } from "../models/postgres/invoiceTemplate.model";

export const DEFAULT_INVOICE_TEMPLATE = {
  mainTemplate: false,

  // ==========================
  // Grouping
  // ==========================
  groupBy: "",
  showGroupHeader: true,

  // ==========================
  // Columns
  // ==========================
  selectedColumns: {
    orderQty: true,
    shippedQty: true,
    itemNumber: true,
    description: true,
    pack: true,
    size: true,
    upc: true,
    sortNumber: true,
    ebt: true,
    retail1: false,
    deposit: false,
    price: true,
    unitPrice: false,
    tax: false,
    prepaidTaxAmount: false,
    totalPPD: false,
    priceWithTaxWithPPD: false,
    priceWithTaxWithoutPPD: false,
    extendedTotal: true,
  },

  columnHeaderNames: {},
  columnPlacement: "default",
  columnOrder: {},

  // ==========================
  // UPC
  // ==========================
  upcOption: "barcode_primary",

  // ==========================
  // Header Visibility
  // ==========================
  showDistributorDetails: true,
  showCustomerDetails: true,
  showBillTo: true,
  showShipTo: true,
  showDocNumber: true,
  showPageOf: true,
  showInvoiceDate: true,
  showInvoiceDateWithTime: false,
  showRoute: true,
  showStop: true,
  showLogo: true,
  logoPosition: "left",
  showTerms: true,

  headerOnPages: "firstplussummary",
  showHeaderMessage: false,
  headerMessageFirstPage: "",

  // ==========================
  // Footer
  // ==========================
  footerLayout: "messageleft",
  showFooterMessage: false,
  footerMessageLastPage: "",
  footerSummaryLabels: {},

  // ==========================
  // Totals Section
  // ==========================
  showSubTotal: true,
  showDeliveryCharge: true,
  showDeposit: true,
  showHouseCharge: false,
  showPosCheck: false,
  showPosCash: false,
  showPosCredit: false,
  showInvoiceTotal: true,
  showLastBalance: true,
  showTotalAmountDue: true,

  // ==========================
  // Misc
  // ==========================
  showReportGeneratedByWoopsa: true,
};

export async function seedInvoiceTemplates() {
  const templateName = "invoice template 1";

  try {
    const existingTemplate = await InvoiceTemplate.findOne({
      where: { name: templateName },
    });

    if (existingTemplate) {
      console.log(`ℹ️ InvoiceTemplate "${templateName}" already exists`);
      return;
    }

    // Ensure no other template remains main
    await InvoiceTemplate.update(
      { mainTemplate: false },
      { where: { mainTemplate: true } }
    );

    await InvoiceTemplate.create({
      ...DEFAULT_INVOICE_TEMPLATE,
      name: templateName,
      mainTemplate: true,
    });

    console.log(`✅ Seeded InvoiceTemplate: ${templateName}`);
  } catch (error) {
    console.error("❌ Seeder error:", error);
  }
}
