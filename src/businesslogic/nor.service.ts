export class nroService {
  async getNeoList() {
    const customerSupportEmail =
      process.env.CUSTOMER_SUPPORT_EMAIL || "support@example.com";
    const customerSupportNumber =
      process.env.CUSTOMER_SUPPORT_NUMBER || "000-000-0000";

    const payload = {
      CreditBalanceEnabled: false,
      PriceWithTaxEnabled: false,
      CustomerSupportEmail: customerSupportEmail,
      CustomerSupportNumber: customerSupportNumber,
    };

    return payload;
  }
}
