interface LossRow {
  Item_Number: number;
  Description: string;
  Order_Number: number;
  Invoice_Date: string;
  C_Number: number;
  C_Name: string;
  Quantity_Ordered: number;
  Quantity_Shipped: number;
  Loss_Qty: number;
}

export function formatItemOrderBreakdown(rows: LossRow[]) {
  const map: Record<number, any> = {};

  for (const row of rows) {
    if (!map[row.Item_Number]) {
      map[row.Item_Number] = {
        Item_Number: row.Item_Number,
        Description: row.Description,
        orders: [],
      };
    }

    map[row.Item_Number].orders.push({
      Order_Number: row.Order_Number,
      Invoice_Date: row.Invoice_Date,
      C_Number: row.C_Number,
      C_Name: row.C_Name,
      Quantity_Ordered: row.Quantity_Ordered,
      Quantity_Shipped: row.Quantity_Shipped,
      Loss_Qty: row.Loss_Qty,
    });
  }

  return Object.values(map);
}


export function formatCustomerItemBreakdown(rows: any[]) {
  const map: Record<number, any> = {};

  for (const row of rows) {
    const cNo = row.C_Number;

    if (!map[cNo]) {
      map[cNo] = {
        C_Number: row.C_Number,
        C_Name: row.C_Name,
        items: [],
      };
    }

    map[cNo].items.push({
      Item_Number: row.Item_Number,
      Description: row.Description,
      Pack: row.Pack,
      Order_Number: row.Order_Number,
      Invoice_Date: row.Invoice_Date,
      Quantity_Ordered: row.Quantity_Ordered,
      Quantity_Shipped: row.Quantity_Shipped,
      Loss_Qty: row.Loss_Qty,
    });
  }

  return Object.values(map);
}
