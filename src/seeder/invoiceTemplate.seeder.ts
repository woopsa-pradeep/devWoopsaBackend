// seeder/invoiceTemplate.seeder.ts

import { InvoiceTemplate } from "../models/postgres/invoiceTemplate.model";

export async function seedInvoiceTemplates() {
  const templateData = {
    name: "Invoice Template 1",
    mainTemplate: true,
    groupBy: "",
    showGroupHeader: true,
    selectedColumns: {
      orderQty: true,
      shippedQty: true,
      description: true,
      itemNumber: true,
      sortNumber: true,
      upc: true,
      price: true,
      tax: false,
      priceWithTax: true,
      totalPrice: true,
      retail1: false,
      ebt: true,
      pack: true,
      size: true,
      deposit: false,
    },
    upcOption: "barcode_primary",
    showDistributorDetails: true,
    showCustomerDetails: true,
    showDocNumber: true,
    showPageOf: true,
    showInvoiceDate: true,
    showInvoiceDateWithTime: false,
    showRoute: true,
    showStop: true,
    showLogo: true,
    logoPosition: "center",
    showTerms: true,
    headerOnPages: "all",
    showHeaderMessage: false,
    headerMessageFirstPage: "",
    footerLayout: "messageLeft",
    showFooterMessage: true,
    footerMessageLastPage: "",
    showSubTotal: true,
    showDeliveryCharge: true,
    showLastBalance: true,
    showTotalAmountDue: true,
    showReportGeneratedByWoopsa: true,
    showBillTo: true,
    showShipTo: true,
    showDeposit: true,
  };

  // Convert all string fields to lowercase
  const templateToCreate = {
    ...templateData,
    name: templateData.name.toLowerCase(),
    groupBy: templateData.groupBy.toLowerCase(),
    upcOption: templateData.upcOption.toLowerCase(),
    logoPosition: templateData.logoPosition.toLowerCase(),
    headerOnPages: templateData.headerOnPages.toLowerCase(),
    headerMessageFirstPage: templateData.headerMessageFirstPage.toLowerCase(),
    footerLayout: templateData.footerLayout.toLowerCase(),
    footerMessageLastPage: templateData.footerMessageLastPage.toLowerCase(),
  };

  // Check if template with this name already exists (case-insensitive check)
  const existingTemplate = await InvoiceTemplate.findOne({
    where: { name: templateToCreate.name },
  });

  if (!existingTemplate) {
    await InvoiceTemplate.create(templateToCreate);
    console.log(`✅ Seeded InvoiceTemplate: ${templateToCreate.name}`);
  } else {
    console.log(`ℹ️ InvoiceTemplate "${templateToCreate.name}" already exists, skipping seed`);
  }
}
