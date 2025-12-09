export interface IInvoiceSetting {
  id?: number;
  header_line_1?: string | null;
  header_line_2?: string | null;
  Name?: string | null;
  Email?: string | null;
  Address_line_1?: string | null;
  Address_line_2?: string | null;
  Full_address?: {
    City?: string;
    State?: string;
    Zip?: string;
    [key: string]: any;
  } | null; // JSON object for full address details
  Phone?: string | null;
  Fax?: string | null;
  whatsapp_Number?: string | null;
  Footer_message_1?: string | null;
  Footer_message_2?: string | null;
  Invoice_Formate?: {
    landscape?: boolean;
    portraite?: boolean; // default true
    [key: string]: any;
  } | null;
  logo?: string | null;
  fields?: any[] | null; // array of arbitrary objects/values
  invoice_Upc_Type?: string | null; // stored as lowercase string (can represent number or text)
  invoice_Upc_Value?: string | null; // stored as lowercase string (can represent number or text)
  createdAt?: Date;
  updatedAt?: Date;
}
