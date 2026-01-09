// interface LossRow {
//   Item_Number: number;
//   Description: string;
//   Order_Number: number;
//   Invoice_Date: string;
//   C_Number: number;
//   C_Name: string;
//   Quantity_Ordered: number;
//   Quantity_Shipped: number;
//   Loss_Qty: number;
// }

// export function formatItemOrderBreakdown(rows: LossRow[]) {
//   const map: Record<number, any> = {};

//   for (const row of rows) {
//     if (!map[row.Item_Number]) {
//       map[row.Item_Number] = {
//         Item_Number: row.Item_Number,
//         Description: row.Description,
//         orders: [],
//       };
//     }

//     map[row.Item_Number].orders.push({
//       Order_Number: row.Order_Number,
//       Invoice_Date: row.Invoice_Date,
//       C_Number: row.C_Number,
//       C_Name: row.C_Name,
//       Quantity_Ordered: row.Quantity_Ordered,
//       Quantity_Shipped: row.Quantity_Shipped,
//       Loss_Qty: row.Loss_Qty,
//     });
//   }

//   return Object.values(map);
// }


// export function formatCustomerItemBreakdown(rows: any[]) {
//   const map: Record<number, any> = {};

//   for (const row of rows) {
//     const cNo = row.C_Number;

//     if (!map[cNo]) {
//       map[cNo] = {
//         C_Number: row.C_Number,
//         C_Name: row.C_Name,
//         items: [],
//       };
//     }

//     map[cNo].items.push({
//       Item_Number: row.Item_Number,
//       Description: row.Description,
//       Pack: row.Pack,
//       Order_Number: row.Order_Number,
//       Invoice_Date: row.Invoice_Date,
//       Quantity_Ordered: row.Quantity_Ordered,
//       Quantity_Shipped: row.Quantity_Shipped,
//       Loss_Qty: row.Loss_Qty,
//     });
//   }

//   return Object.values(map);
// }

// export function formatDateItemBreakdown(rows: any[]) {
//   const map: Record<string, any> = {};

//   for (const row of rows) {
//     const orderDate = row.Invoice_Date;

//     if (!map[orderDate]) {
//       map[orderDate] = {
//         Order_Date: orderDate,
//         items: [],
//       };
//     }

//     const lossQty = Number(row.Loss_Qty || 0);
//     const avgCost = Number(row.AvgCost || 0);
//     const price = Number(row.Price || 0);
//     const OTP_Amount_State = Number(row.OTP_Amount_State || 0);
//     const onHand = Number(row.On_Hand || 0);

//     map[orderDate].items.push({
//       Item_Number: row.Item_Number,
//       Description: row.Description,

//       C_Number: row.C_Number,
//       C_Name: row.C_Name,

//       Order_Number: row.Order_Number,
//       Order_Date: orderDate,

//       Quantity_Shipped: Number(row.Quantity_Shipped || 0),
//       Quantity_Ordered: Number(row.Quantity_Ordered || 0),
//       Loss_Qty: lossQty,
//       On_Hand: onHand,

//       AvgCost: avgCost,
//       Price: price,
//       OTP_Amount_State: OTP_Amount_State,

//       // ✅ correct EXT loss
//       Ext_Loss: lossQty * (price + OTP_Amount_State),
//     });
//   }

//   return Object.values(map);
// }



export function formatCustomerVelocityItemBreakdown(rows: any[]) {
  const map: Record<number, any> = {};
  const grandTotal = {
    Quantity_Shipped: 0,
    Ext_Price: 0,
    Ext_Cost: 0,
    Profit: 0,
    Profit_Percent: 0,
  };

  for (const row of rows) {
    const cNo = row.C_Number;

    if (!map[cNo]) {
      map[cNo] = {
        C_Number: row.C_Number,
        C_Name: row.C_Name,
        C_Address: row.C_Address,
        C_City: row.C_City,
        C_State: row.C_State,
        C_Zip: row.C_Zip,
        C_Phone: row.C_Phone,
        items: [],
        totals: {
          Quantity_Shipped: 0,
          Ext_Price: 0,
          Ext_Cost: 0,
          Profit: 0,
          Profit_Percent: 0,
        },
      };
    }

    map[cNo].items.push({
      Item_Number: row.Item_Number,
      Description: row.Description,
      Pack: row.Pack,
      UOM: row.UOM,
      Order_Number: row.Order_Number,
      Invoice_Date: row.Invoice_Date,
      Quantity_Shipped: row.Quantity_Shipped,
      Price: row.Price,
      AvgCost: row.AvgCost,
      Ext_Price: row.Ext_Price,
      Ext_Cost: row.Ext_Cost,
      Profit: row.Profit,
      Profit_Percent: row.Profit_Percent,
    });

    map[cNo].totals.Quantity_Shipped += row.Quantity_Shipped || 0;
    map[cNo].totals.Ext_Price += row.Ext_Price || 0;
    map[cNo].totals.Ext_Cost += row.Ext_Cost || 0;
    map[cNo].totals.Profit += row.Profit || 0;

    grandTotal.Quantity_Shipped += row.Quantity_Shipped || 0;
    grandTotal.Ext_Price += row.Ext_Price || 0;
    grandTotal.Ext_Cost += row.Ext_Cost || 0;
    grandTotal.Profit += row.Profit || 0;
  }

  for (const customer of Object.values(map)) {
    customer.totals.Profit_Percent =
      customer.totals.Ext_Price > 0
        ? (customer.totals.Profit / customer.totals.Ext_Price) * 100
        : 0;
  }

  grandTotal.Profit_Percent =
    grandTotal.Ext_Price > 0
      ? (grandTotal.Profit / grandTotal.Ext_Price) * 100
      : 0;

  return {
    customers: Object.values(map),
    grandTotal,
  };
}



