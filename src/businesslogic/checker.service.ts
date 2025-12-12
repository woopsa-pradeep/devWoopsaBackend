import { Op, QueryTypes, literal } from "sequelize";
import { Request } from "express";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import { OrderPick } from "../models/postgres/epickOrder.model";
import { Customer } from "../models/mmsql/customer.model";
import { CustomerRoute } from "../models/mmsql/customerRoutes.model";
import { OrderPickBox } from "../models/postgres/epickOrderBox.model";
import { OrderPickScan } from "../models/postgres/epickOrderScan.model";
import { OrderDetail } from "../models/mmsql/orderDetail.model";
import { Inventory } from "../models/mmsql/inventory.model";
import { InventoryUPC } from "../models/mmsql/inventoryUpc.model";
import { ProductImage } from "../models/postgres/product.model";
import { Users } from "../models/mmsql/user.model";
import { OverrideRequest } from "../models/postgres/overrideRequest.model";
import { WebUsers } from "../models/postgres/users.model";
import { getInventoryOnHand, generatePDFFromHTML } from "../utils/helper";
import { AppError } from "../utils/AppError";
import { uploadFileToAzure, deleteFileFromAzure } from "../utils/azureUploader";
import { generateBarcodeAndUpload } from "../utils/barCodeGenerate";
import { getDefaultOrderDetailValues } from "../utils/order";
import puppeteer from 'puppeteer';
import moment from 'moment';
import { sequelize } from "../db";

export class CheckerService {

  /**
   * Get complete checker orders (ready for delivery)
   * - Returns orders where OrderPick.status = 'ready_for_delivery'
   * - Returns all ready for delivery orders (no date filter)
   * - Includes only: order number, route, stop, customer name, time, box, tote, drink, startedAt, completedAt
   */
  async getCompleteCheckerOrder() {
    // Get all ready_for_delivery orders from OrderPick (no date filter - get all ready for delivery orders)
    const readyForDeliveryOrders = await OrderPick.findAll({
      where: {
        status: 'ready_for_delivery', // Only get orders marked as ready for delivery by checker
      },
      attributes: ['orderNumber', 'startedAt', 'completedAt'],
      raw: false,
    });

    // Clean + dedupe array of order numbers
    const readyForDeliveryOrderNumbers = Array.from(
      new Set(
        readyForDeliveryOrders
        .map((o: any) => o?.orderNumber)
        .filter((v: any) => v !== null && v !== undefined && String(v).trim() !== '')
        .map((v: any) => Number(v)) // normalize to number
      )
    );
    
    console.log(readyForDeliveryOrderNumbers, 'readyForDeliveryOrderNumbers for checker');
  
    // If no ready for delivery orders, return empty array
    if (readyForDeliveryOrderNumbers.length === 0) {
      return [];
    }

    // Create a map of orderNumber to startedAt and completedAt
    const orderPickMap: any = {};
    readyForDeliveryOrders.forEach((order: any) => {
      if (order.orderNumber) {
        orderPickMap[order.orderNumber] = {
          startedAt: order.startedAt,
          completedAt: order.completedAt
        };
      }
    });

    // Query OrderHeader for ready for delivery orders
    const headerWhere: any = {
      // Exclude orders where Order_Updated = 1
      Order_Updated: { [Op.ne]: true },
      // Only get orders that are ready for delivery
      Order_Number: { [Op.in]: readyForDeliveryOrderNumbers }
    };
    
    console.log(headerWhere, 'headerWhere for complete checker order');
    
    const readyForDeliveryOrdersList = await OrderHeader.findAll({
      where: headerWhere,
      attributes: ['Order_Number', 'Order_Date', 'Invoice_Number', 'Picker_ID'],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['C_Number', 'C_Name'],
          include: [
            {
              model: CustomerRoute,
              as: 'Routes',
              attributes: ['Route_Number', 'Stop_Number'],
              required: false,
            },
          ],
          required: false,
        },
      ],
      order: [
        ['Order_Number', 'DESC'], // Newest first
      ],
    });
  
    console.log(readyForDeliveryOrdersList, 'readyForDeliveryOrdersList for checker');
  
    // If no orders, return empty array
    if (readyForDeliveryOrdersList.length === 0) {
      return [];
    }
  
    // Get all order numbers from the ready for delivery orders list
    const orderNumbers = readyForDeliveryOrdersList.map((order: any) => order.Order_Number);
    
    // Get unique picker IDs and fetch picker names
    const pickerIds = Array.from(
      new Set(
        readyForDeliveryOrdersList
          .map((order: any) => order.Picker_ID)
          .filter((id: any) => id !== null && id !== undefined)
      )
    );
    
    // Fetch picker names from Users table
    const pickers = await Users.findAll({
      where: {
        UserNumber: { [Op.in]: pickerIds },
      },
      attributes: ['UserNumber', 'UserName'],
      raw: true,
    });
    
    // Create a map of picker ID to picker name
    const pickerMap: any = {};
    pickers.forEach((picker: any) => {
      pickerMap[picker.UserNumber] = picker.UserName;
    });
    
    // Query all OrderPickBox records for these orders
    const orderBoxes = await OrderPickBox.findAll({
      where: {
        orderNumber: { [Op.in]: orderNumbers }
      },
      attributes: ['id', 'orderNumber', 'type'],
      raw: true,
    });
    
    // Group boxes by order number and collect IDs by type
    const boxIdsByOrder: any = {};
    orderBoxes.forEach((box: any) => {
      const orderNum = box.orderNumber;
      if (!boxIdsByOrder[orderNum]) {
        boxIdsByOrder[orderNum] = {
          box: [],
          tote: [],
          drink: []
        };
      }
      if (box.type === 'box') {
        boxIdsByOrder[orderNum].box.push(box.id);
      } else if (box.type === 'tote') {
        boxIdsByOrder[orderNum].tote.push(box.id);
      } else if (box.type === 'drink') {
        boxIdsByOrder[orderNum].drink.push(box.id);
      }
    });
    
    // Transform to only include requested fields
    const simplifiedOrders = readyForDeliveryOrdersList.map((order: any) => {
      const orderNum = order.Order_Number;
      const boxIds = boxIdsByOrder[orderNum] || { box: [], tote: [], drink: [] };
      const orderPickData = orderPickMap[orderNum] || { startedAt: null, completedAt: null };
      
      // Get first route and stop if available
      const route = order.customer?.Routes?.[0]?.Route_Number || null;
      const stop = order.customer?.Routes?.[0]?.Stop_Number || null;
      
      // Determine invoiced status: if Invoice_Number = 0, invoice not created (false), otherwise true
      const invoiceNumber = order.Invoice_Number || 0;
      const invoiced = invoiceNumber !== 0;
      
      // Get picker name from picker map
      const pickerName = order.Picker_ID ? (pickerMap[order.Picker_ID] || null) : null;
      
      return {
        orderNumber: orderNum,
        route: route,
        stop: stop,
        customerName: order.customer?.C_Name || null,
        time: order.Order_Date,
        box: boxIds.box, 
        tote: boxIds.tote,
        drink: boxIds.drink,
        startedAt: orderPickData.startedAt,
        completedAt: orderPickData.completedAt,
        invoiced: invoiced,
        pickerName: pickerName
      };
    });
    
    return simplifiedOrders;
  }

  /**
   * Get completed orders for checker to verify
   * - Returns orders where OrderPick.status = 'completed'
   * - Returns all completed orders (no date filter)
   * - Includes only: order number, route, stop, customer name, time, box, tote, drink, startedAt, completedAt
   */
  async getOrder() {
    // Get all completed orders from OrderPick (no date filter - get all completed orders)
    const completedOrders = await OrderPick.findAll({
      where: {
      status: 'completed', // Only get completed orders (already picked by epick)
      },
      attributes: ['orderNumber', 'startedAt', 'completedAt'],
      raw: false,
    });

    // Clean + dedupe array of order numbers
    const completedOrderNumbers = Array.from(
      new Set(
        completedOrders
        .map((o: any) => o?.orderNumber)
        .filter((v: any) => v !== null && v !== undefined && String(v).trim() !== '')
        .map((v: any) => Number(v)) // normalize to number
      )
    );
    
    console.log(completedOrderNumbers, 'completedOrderNumbers for checker');
  
    // If no completed orders, return empty array
    if (completedOrderNumbers.length === 0) {
      return [];
    }

    // Create a map of orderNumber to startedAt and completedAt
    const orderPickMap: any = {};
    completedOrders.forEach((order: any) => {
      if (order.orderNumber) {
        orderPickMap[order.orderNumber] = {
          startedAt: order.startedAt,
          completedAt: order.completedAt
        };
      }
    });

    // Query OrderHeader for completed orders
    const headerWhere: any = {
      // Exclude orders where Order_Updated = 1
      Order_Updated: { [Op.ne]: true },
      // Only get orders that are completed (already picked)
      Order_Number: { [Op.in]: completedOrderNumbers }
    };
    
    console.log(headerWhere, 'headerWhere for checker');
    
    const completedOrdersList = await OrderHeader.findAll({
      where: headerWhere,
      attributes: ['Order_Number', 'Order_Date', 'Invoice_Number', 'Picker_ID'],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['C_Number', 'C_Name'],
          include: [
            {
              model: CustomerRoute,
              as: 'Routes',
              attributes: ['Route_Number', 'Stop_Number'],
              required: false,
            },
          ],
          required: false,
        },
      ],
      order: [
        ['Order_Number', 'DESC'], // Newest first
      ],
    });
  
    console.log(completedOrdersList, 'completedOrdersList for checker');
  
    // If no orders, return empty array
    if (completedOrdersList.length === 0) {
      return [];
    }
  
    // Get all order numbers from the completed orders list
    const orderNumbers = completedOrdersList.map((order: any) => order.Order_Number);
    
    // Validation: Check that ALL products in OrderDetail have Confirmed = 1
    // Only include orders where every item is confirmed
    let validatedOrderNumbers = orderNumbers;
    if (orderNumbers.length > 0) {
      // Query to find orders where ALL items have Confirmed = 1
      // This query returns orders where total items = confirmed items
      // Only orders where every single item has Confirmed = 1 will pass this validation
      const confirmedOrdersQuery = await sequelize.query(
        `SELECT Order_Number
         FROM Order_Detail
         WHERE Order_Number IN (:orderNumbers)
         GROUP BY Order_Number
         HAVING COUNT(*) = SUM(CASE WHEN Confirmed = 1 THEN 1 ELSE 0 END)`,
        {
          replacements: { orderNumbers: orderNumbers },
          type: QueryTypes.SELECT,
          raw: true,
        }
      ) as any[];
      
      const validatedOrderNumbersSet = new Set(
        confirmedOrdersQuery
          .map((row: any) => row.Order_Number)
          .filter((v: any) => v !== null && v !== undefined)
          .map((v: any) => Number(v))
      );
      
      console.log(`Orders with all items confirmed: ${validatedOrderNumbersSet.size} out of ${orderNumbers.length}`);
      
      // Filter completedOrdersList to only include orders where all items are confirmed
      validatedOrderNumbers = Array.from(validatedOrderNumbersSet);
      
      // If no orders pass validation, return empty array
      if (validatedOrderNumbers.length === 0) {
        return [];
      }
      
      // Filter completedOrdersList to only include validated orders
      const filteredOrders = completedOrdersList.filter((order: any) => 
        validatedOrderNumbers.includes(order.Order_Number)
      );
      
      // Update completedOrdersList to only include validated orders
      completedOrdersList.length = 0;
      completedOrdersList.push(...filteredOrders);
      
      // Update orderNumbers to only include validated orders
      orderNumbers.length = 0;
      orderNumbers.push(...validatedOrderNumbers);
    }
    
    // Get unique picker IDs and fetch picker names
    const pickerIds = Array.from(
      new Set(
        completedOrdersList
          .map((order: any) => order.Picker_ID)
          .filter((id: any) => id !== null && id !== undefined)
      )
    );
    
    // Fetch picker names from Users table
    const pickers = await Users.findAll({
      where: {
        UserNumber: { [Op.in]: pickerIds },
      },
      attributes: ['UserNumber', 'UserName'],
      raw: true,
    });
    
    // Create a map of picker ID to picker name
    const pickerMap: any = {};
    pickers.forEach((picker: any) => {
      pickerMap[picker.UserNumber] = picker.UserName;
    });
    
    // Query all OrderPickBox records for these orders
    const orderBoxes = await OrderPickBox.findAll({
      where: {
        orderNumber: { [Op.in]: orderNumbers }
      },
      attributes: ['id', 'orderNumber', 'type'],
      raw: true,
    });
    
    // Group boxes by order number and collect IDs by type
    const boxIdsByOrder: any = {};
    orderBoxes.forEach((box: any) => {
      const orderNum = box.orderNumber;
      if (!boxIdsByOrder[orderNum]) {
        boxIdsByOrder[orderNum] = {
          box: [],
          tote: [],
          drink: []
        };
      }
      if (box.type === 'box') {
        boxIdsByOrder[orderNum].box.push(box.id);
      } else if (box.type === 'tote') {
        boxIdsByOrder[orderNum].tote.push(box.id);
      } else if (box.type === 'drink') {
        boxIdsByOrder[orderNum].drink.push(box.id);
      }
    });
    
    // Transform to only include requested fields
    const simplifiedOrders = completedOrdersList.map((order: any) => {
      const orderNum = order.Order_Number;
      const boxIds = boxIdsByOrder[orderNum] || { box: [], tote: [], drink: [] };
      const orderPickData = orderPickMap[orderNum] || { startedAt: null, completedAt: null };
      
      // Get first route and stop if available
      const route = order.customer?.Routes?.[0]?.Route_Number || null;
      const stop = order.customer?.Routes?.[0]?.Stop_Number || null;
      
      // Determine invoiced status: if Invoice_Number = 0, invoice not created (false), otherwise true
      const invoiceNumber = order.Invoice_Number || 0;
      const invoiced = invoiceNumber !== 0;
      
      // Get picker name from picker map
      const pickerName = order.Picker_ID ? (pickerMap[order.Picker_ID] || null) : null;
      
      return {
        orderNumber: orderNum,
        route: route,
        stop: stop,
        customerName: order.customer?.C_Name || null,
        time: order.Order_Date,
        box: boxIds.box, 
        tote: boxIds.tote,
        drink: boxIds.drink,
        startedAt: orderPickData.startedAt,
        completedAt: orderPickData.completedAt,
        invoiced: invoiced,
        pickerName: pickerName
      };
    });
  
    return simplifiedOrders;
  }

  /**
   * Get items in a box by box ID
   * - Returns item details with qty from Quantity_Shipped
   */
  async getBoxItem(boxId: number) {
    // Get all scans for this box with actual qty values
    const scans = await OrderPickScan.findAll({
      where: { boxId },
      attributes: ['orderNumber', 'itemNumber', 'qty', 'isSubsitute'],
      raw: true,
    });

    if (!scans || scans.length === 0) {
      return [];
    }

    // Get unique order numbers and item numbers
    const orderNumbers = Array.from(new Set(scans.map((s: any) => s.orderNumber)));
    const itemNumbers = Array.from(new Set(scans.map((s: any) => s.itemNumber)));

    // Get Inventory details for all items
    const inventories = await Inventory.findAll({
      where: {
        Item_Number: { [Op.in]: itemNumbers }
      },
      attributes: [
        'Item_Number',
        'Description',
        'Location',
        'Section',
        'Pack',
        'CaseCount',
        'UOM'
      ],
      include: [
        {
          model: InventoryUPC,
          as: 'UPCList',
          attributes: ['UPC_Number'],
          required: false
        }
      ]
    });

    // Create inventory map
    const inventoryMap: any = {};
    inventories.forEach((inv: any) => {
      inventoryMap[inv.Item_Number] = inv.get({ plain: true });
    });

    // Get product images
    const productImages = await ProductImage.findAll({
      where: {
        product_number: { [Op.in]: itemNumbers.map(String) },
        isAllow: true
      },
      attributes: ['product_number', 'img_url', 'isAllow']
    });

    const imageMap: any = {};
    productImages.forEach((img: any) => {
      imageMap[img.product_number] = img;
    });

    // Build final response with async inventory on hand
    const finalData = await Promise.all(
      scans.map(async (scan: any) => {
        const itemNumber = scan.itemNumber;
        const orderNumber = scan.orderNumber;
        
        // Use actual scan qty from OrderPickScan (box-specific)
        const qty = scan.qty || 0;
        
        // Get inventory details
        const inventory = inventoryMap[itemNumber] || null;
        
        // Get product image
        const productImage = imageMap[itemNumber.toString()] || null;
        
        // Get inventory on hand
        const inventoryOnHand = inventory ? await getInventoryOnHand(itemNumber) : null;
        
        // Build master image if UPC exists
        const masterImage = inventory?.UPCList?.[0]?.UPC_Number
          ? `${process.env.AZUREIMAGESERVER}${inventory.UPCList[0].UPC_Number}.jpg`
          : null;

        return {
          orderNumber: orderNumber,
          itemNumber: itemNumber,
          qty: qty, // Quantity_Shipped as qty
          isSubsitute: scan.isSubsitute || false,
          description: inventory?.Description || null,
          location: inventory?.Location || null,
          section: inventory?.Section || null,
          pack: inventory?.Pack || null,
          caseCount: inventory?.CaseCount || null,
          uom: inventory?.UOM || null,
          inventoryOnHand: inventoryOnHand,
          masterImage: masterImage,
          isDistributorImageShow: productImage?.isAllow ?? false,
          distributorImage: productImage?.img_url ?? null,
          upcList: inventory?.UPCList || []
        };
      })
    );

    return finalData;
  }

  /**
   * Get order details with all items
   * - Order information (without box/tote/drink arrays)
   * - All order items with Quantity_Ordered and Quantity_Shipped
   * - Complete item details
   */
  async getOrderDetails(orderNumber: number) {
    // Validate order exists
    const orderPick = await OrderPick.findOne({
      where: { orderNumber }
    });

    if (!orderPick) {
      throw new AppError("Order not found", 404);
    }

    // Get order header with customer information
    const orderHeader = await OrderHeader.findOne({
      where: { Order_Number: orderNumber },
      attributes: [
        'Order_Number',
        'Order_Date',
        'C_Number',
        'Route_Number',
        'Stop_Number',
        'Invoice_Number',
        'Bundles',
        'Totes',
        'Picker_ID',
        'Confirmed',
        'Invoice_Total'
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['C_Number', 'C_Name', 'C_Address', 'C_City', 'C_State', 'C_Zip'],
          required: false,
          include: [
            {
              model: CustomerRoute,
              as: 'Routes',
              attributes: ['Route_Number', 'Stop_Number'],
              required: false,
            }
          ]
        }
      ]
    });

    if (!orderHeader) {
      throw new AppError("Order header not found", 404);
    }

    // Get all order details with items
    const orderDetails = await OrderDetail.findAll({
      where: { Order_Number: orderNumber },
      attributes: [
        'Order_Number',
        'Line_Number',
        'Item_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Pack',
        'CaseCount',
        'ItemDescription',
        'Price',
        'NetCost',
        'Invoice_Cost',
        'Confirmed'
      ],
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: [
            'Item_Number',
            'Description',
            'Pack',
            'CaseCount',
            'UOM',
            'Section',
            'Location'
          ],
          required: false,
          include: [
            {
              model: InventoryUPC,
              as: 'UPCList',
              attributes: ['UPC_Number'],
              where: { Status: 0 },
              required: false,
            }
          ]
        }
      ],
      order: [['Line_Number', 'ASC']],
    });

    // Get product images for all items
    const itemNumbers = orderDetails.map((detail: any) => detail.Item_Number);
    const productImages = await ProductImage.findAll({
      where: {
        product_number: { [Op.in]: itemNumbers.map(String) },
        isAllow: true
      },
      attributes: ['product_number', 'img_url', 'isAllow']
    });

    const imageMap: any = {};
    productImages.forEach((img: any) => {
      imageMap[img.product_number] = img;
    });

    // Format order details with images
    const orderDetailsWithImages = await Promise.all(
      orderDetails.map(async (detail: any) => {
        const itemNumber = detail.Item_Number;
        const inventory = detail.inventory;
        const productImage = imageMap[itemNumber.toString()] || null;

        // Build master image if UPC exists
        const masterImage = inventory?.UPCList?.[0]?.UPC_Number
          ? `${process.env.AZUREIMAGESERVER}${inventory.UPCList[0].UPC_Number}.jpg`
          : null;

        return {
          lineNumber: detail.Line_Number,
          itemNumber: detail.Item_Number,
          itemDescription: detail.ItemDescription || inventory?.Description || null,
          quantityOrdered: detail.Quantity_Ordered || 0,
          quantityShipped: detail.Quantity_Shipped || 0,
          pack: detail.Pack || inventory?.Pack || null,
          caseCount: detail.CaseCount || inventory?.CaseCount || null,
          uom: inventory?.UOM || null,
          section: inventory?.Section || null,
          location: inventory?.Location || null,
          price: detail.Price || null,
          netCost: detail.NetCost || null,
          invoiceCost: detail.Invoice_Cost || null,
          confirmed: detail.Confirmed || false,
          upcList: inventory?.UPCList?.map((upc: any) => ({ UPC_Number: upc.UPC_Number })) || [],
          masterImage: masterImage,
          distributorImage: productImage?.img_url || null,
          isDistributorImageShow: productImage?.isAllow ?? false
        };
      })
    );

    // Get all override requests for this order (all statuses)
    const overrideRequests = await OverrideRequest.findAll({
      where: { orderNumber: orderNumber },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'userNumber'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Get item descriptions for override requests
    const overrideItemNumbers = overrideRequests.map(req => req.itemNumber);
    const overrideInventories = overrideItemNumbers.length > 0 ? await Inventory.findAll({
      where: {
        Item_Number: { [Op.in]: overrideItemNumbers },
      },
      attributes: ['Item_Number', 'Description'],
    }) : [];

    const inventoryMap = new Map(overrideInventories.map(inv => [inv.Item_Number, inv.Description]));

    // Format override requests
    const formattedOverrideRequests = overrideRequests.map((req: any) => {
      const user = req.user as WebUsers | undefined;
      return {
        requestId: req.id,
        orderNumber: req.orderNumber,
        itemNumber: req.itemNumber,
        itemDescription: inventoryMap.get(req.itemNumber) || null,
        pickerUserNumber: req.pickerUserNumber,
        userName: user ? `${user.firstName} ${user.lastName}` : null,
        userEmail: user?.email || null,
        status: req.status,
        note: req.note,
        rejectionReason: req.rejectionReason,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      };
    });

    // Format customer information
    const orderHeaderData = orderHeader as any;
    const customer = orderHeaderData.customer;
    const customerRoute = customer?.Routes?.[0];

    // Get picker name if available
    let pickerName = null;
    if (orderHeaderData.Picker_ID) {
      const picker = await Users.findOne({
        where: { UserNumber: orderHeaderData.Picker_ID },
        attributes: ['UserName'],
        raw: true
      });
      pickerName = (picker as any)?.UserName || null;
    }

    return {
      orderInfo: {
        orderNumber: orderHeaderData.Order_Number,
        orderDate: orderHeaderData.Order_Date,
        invoiceNumber: orderHeaderData.Invoice_Number || 0,
        bundles: orderHeaderData.Bundles || 0,
        totes: orderHeaderData.Totes || 0,
        pickerId: orderHeaderData.Picker_ID || null,
        pickerName: pickerName,
        confirmed: orderHeaderData.Confirmed || false,
        invoiceTotal: orderHeaderData.Invoice_Total || null,
        customer: customer ? {
          customerNumber: customer.C_Number,
          customerName: customer.C_Name,
          address: customer.C_Address,
          city: customer.C_City,
          state: customer.C_State,
          zip: customer.C_Zip,
          route: customerRoute?.Route_Number || orderHeaderData.Route_Number || null,
          stop: customerRoute?.Stop_Number || orderHeaderData.Stop_Number || null
        } : null,
        startedAt: orderPick.startedAt,
        completedAt: orderPick.completedAt
      },
      orderItems: orderDetailsWithImages,
      overrideRequests: formattedOverrideRequests,
      summary: {
        totalItemsOrdered: orderDetails.reduce((sum, detail: any) => sum + (detail.Quantity_Ordered || 0), 0),
        totalItemsShipped: orderDetails.reduce((sum, detail: any) => sum + (detail.Quantity_Shipped || 0), 0),
        totalItems: orderDetails.length
      }
    };
  }

  /**
   * Get all items in an order (across all boxes)
   * Returns items grouped by box or as a flat list
   */
  async getOrderItems(orderNumber: number, groupByBox: boolean = false) {
    // Validate order exists
    const orderPick = await OrderPick.findOne({
      where: { orderNumber }
    });

    if (!orderPick) {
      throw new AppError("Order not found", 404);
    }

    // Get all scans for this order across all boxes
    const scans = await OrderPickScan.findAll({
      where: { orderNumber },
      attributes: ['orderNumber', 'itemNumber', 'qty', 'isSubsitute', 'boxId'],
      order: [['itemNumber', 'ASC']], // Order by itemNumber ascending
      raw: true,
    });

    if (!scans || scans.length === 0) {
      return groupByBox ? {} : [];
    }

    // Get all boxes for this order
    const boxes = await OrderPickBox.findAll({
      where: { orderNumber },
      attributes: ['id', 'type', 'orderNumber'],
      raw: true,
    });

    // Create box map
    const boxMap: any = {};
    boxes.forEach((box: any) => {
      boxMap[box.id] = box;
    });

    // Get unique item numbers
    const itemNumbers = Array.from(new Set(scans.map((s: any) => s.itemNumber)));

    // Get Inventory details for all items
    const inventories = await Inventory.findAll({
      where: {
        Item_Number: { [Op.in]: itemNumbers }
      },
      attributes: [
        'Item_Number',
        'Description',
        'Location',
        'Section',
        'Pack',
        'CaseCount',
        'UOM'
      ],
      include: [
        {
          model: InventoryUPC,
          as: 'UPCList',
          attributes: ['UPC_Number'],
          required: false
        }
      ]
    });

    // Create inventory map
    const inventoryMap: any = {};
    inventories.forEach((inv: any) => {
      inventoryMap[inv.Item_Number] = inv.get({ plain: true });
    });

    // Get product images
    const productImages = await ProductImage.findAll({
      where: {
        product_number: { [Op.in]: itemNumbers.map(String) },
        isAllow: true
      },
      attributes: ['product_number', 'img_url', 'isAllow']
    });

    const imageMap: any = {};
    productImages.forEach((img: any) => {
      imageMap[img.product_number] = img;
    });

    // Build final response
    const finalData = await Promise.all(
      scans.map(async (scan: any) => {
        const itemNumber = scan.itemNumber;
        const box = boxMap[scan.boxId] || null;

        // Use actual scan qty from OrderPickScan
        const qty = scan.qty || 0;

        // Get inventory details
        const inventory = inventoryMap[itemNumber] || null;

        // Get product image
        const productImage = imageMap[itemNumber.toString()] || null;

        // Get inventory on hand
        const inventoryOnHand = inventory ? await getInventoryOnHand(itemNumber) : null;

        // Build master image if UPC exists
        const masterImage = inventory?.UPCList?.[0]?.UPC_Number
          ? `${process.env.AZUREIMAGESERVER}${inventory.UPCList[0].UPC_Number}.jpg`
          : null;

        return {
          orderNumber: scan.orderNumber,
          itemNumber: itemNumber,
          qty: qty,
          isSubsitute: scan.isSubsitute || false,
          boxId: scan.boxId,
          boxType: box?.type || null,
          description: inventory?.Description || null,
          location: inventory?.Location || null,
          section: inventory?.Section || null,
          pack: inventory?.Pack || null,
          caseCount: inventory?.CaseCount || null,
          uom: inventory?.UOM || null,
          inventoryOnHand: inventoryOnHand,
          masterImage: masterImage,
          isDistributorImageShow: productImage?.isAllow ?? false,
          distributorImage: productImage?.img_url || null,
          upcList: inventory?.UPCList || []
        };
      })
    );

    // If groupByBox is true, group items by box
    if (groupByBox) {
      const groupedData: any = {};
      finalData.forEach((item: any) => {
        const boxId = item.boxId;
        if (!groupedData[boxId]) {
          const box = boxMap[boxId];
          groupedData[boxId] = {
            boxId: boxId,
            boxType: box?.type || null,
            items: []
          };
        }
        // Remove boxId and boxType from item (already in group)
        const { boxId: _, boxType: __, ...itemWithoutBox } = item;
        groupedData[boxId].items.push(itemWithoutBox);
      });
      return groupedData;
    }

    // Return flat list
    return finalData;
  }

  /**
   * Move items from one box to another box
   * Supports: box-box, tote-tote, box-tote, tote-box, drink-drink
   * Supports partial moves (e.g., move 5 out of 10 qty)
   */
  async moveItemsToBox(data: {
    sourceBoxId: number;
    destinationBoxId: number;
    itemNumber: number;
    qty: number;
  }) {
    const { sourceBoxId, destinationBoxId, itemNumber, qty } = data;

    // Validate inputs
    if (!sourceBoxId || !destinationBoxId || !itemNumber || !qty || qty <= 0) {
      throw new AppError("Invalid input parameters", 400);
    }

    if (sourceBoxId === destinationBoxId) {
      throw new AppError("Source and destination boxes cannot be the same", 400);
    }

    // Validate both boxes exist and get their types
    const sourceBox = await OrderPickBox.findByPk(sourceBoxId);
    const destinationBox = await OrderPickBox.findByPk(destinationBoxId);

    if (!sourceBox) {
      throw new AppError("Source box not found", 404);
    }

    if (!destinationBox) {
      throw new AppError("Destination box not found", 404);
    }

    // Both boxes must belong to the same order
    if (sourceBox.orderNumber !== destinationBox.orderNumber) {
      throw new AppError("Source and destination boxes must belong to the same order", 400);
    }

    // Find the item in the source box
    const sourceScans = await OrderPickScan.findAll({
      where: {
        boxId: sourceBoxId,
        itemNumber: itemNumber
      }
    });

    if (!sourceScans || sourceScans.length === 0) {
      throw new AppError("Item not found in source box", 404);
    }

    // Calculate total quantity available in source box
    const totalSourceQty = sourceScans.reduce((sum, scan) => sum + scan.qty, 0);

    if (totalSourceQty < qty) {
      throw new AppError(`Insufficient quantity. Available: ${totalSourceQty}, Requested: ${qty}`, 400);
    }

    // Get order number from first scan
    const orderNumber = sourceScans[0].orderNumber;
    const isSubsitute = sourceScans[0].isSubsitute;

    // Check if destination box already has this item
    let existingDestinationScan = await OrderPickScan.findOne({
      where: {
        boxId: destinationBoxId,
        itemNumber: itemNumber,
        orderNumber: orderNumber
      }
    });

    // Start transaction-like operations
    let remainingQty = qty;
    let totalMovedQty = 0;

    // Process source scans - reduce quantity
    for (const scan of sourceScans) {
      if (remainingQty <= 0) break;

      if (scan.qty <= remainingQty) {
        // Move entire scan quantity
        const moveQty = scan.qty;
        remainingQty -= moveQty;
        totalMovedQty += moveQty;
        
        if (existingDestinationScan) {
          // Update existing destination scan using database-level increment to avoid stale values
          await OrderPickScan.update(
            {
              qty: literal(`qty + ${moveQty}`)
            },
            {
              where: {
                id: existingDestinationScan.id
              }
            }
          );
          // Re-fetch to get updated value for potential subsequent operations
          await existingDestinationScan.reload();
        } else {
          // Create new scan in destination
          existingDestinationScan = await OrderPickScan.create({
            orderNumber: orderNumber,
            itemNumber: itemNumber,
            qty: moveQty,
            boxId: destinationBoxId,
            isSubsitute: isSubsitute
          });
        }
        
        // Delete source scan if all moved
        await scan.destroy();
      } else {
        // Move partial quantity
        const moveQty = remainingQty;
        remainingQty = 0;
        totalMovedQty += moveQty;

        // Update source scan - reduce quantity
        await scan.update({
          qty: scan.qty - moveQty
        });

        if (existingDestinationScan) {
          // Update existing destination scan using database-level increment to avoid stale values
          await OrderPickScan.update(
            {
              qty: literal(`qty + ${moveQty}`)
            },
            {
              where: {
                id: existingDestinationScan.id
              }
            }
          );
          // Re-fetch to get updated value for potential subsequent operations
          await existingDestinationScan.reload();
        } else {
          // Create new scan in destination
          existingDestinationScan = await OrderPickScan.create({
            orderNumber: orderNumber,
            itemNumber: itemNumber,
            qty: moveQty,
            boxId: destinationBoxId,
            isSubsitute: isSubsitute
          });
        }
      }
    }

    return {
      success: true,
      message: `Successfully moved ${totalMovedQty} quantity of item ${itemNumber} from ${sourceBox.type} ${sourceBoxId} to ${destinationBox.type} ${destinationBoxId}`,
      sourceBoxId,
      destinationBoxId,
      itemNumber,
      qtyMoved: totalMovedQty,
      sourceBoxType: sourceBox.type,
      destinationBoxType: destinationBox.type
    };
  }

  /**
   * Capture photos for an order and distribute across all containers
   * - Gets all containers (boxes, totes, drinks) for the order
   * - Validates: min = container count, max = 2 * container count
   * - Distributes images evenly across containers (1-2 images per container)
   * - Updates each container with assigned images
   */
  
  async capturePhotos(req: Request, orderNumber: number) {
    // Validate order exists
    const orderPick = await OrderPick.findOne({
      where: { orderNumber }
    });

    if (!orderPick) {
      throw new AppError("Order not found", 404);
    }

    // Get all containers (boxes, totes, drinks) for this order to calculate min/max images
    const containers = await OrderPickBox.findAll({
      where: { orderNumber },
      attributes: ['id', 'type', 'orderNumber']
    });

    if (!containers || containers.length === 0) {
      throw new AppError("No containers found for this order", 404);
    }

    const containerCount = containers.length;
    // Validate image count based on containers: 1 image per container minimum, 2 images per container maximum
    const minImages = containerCount; // 1 image per container minimum
    const maxImages = containerCount * 2; // 2 images per container maximum

    // Get existing images from order
    const existingImages = orderPick.images || [];

    // Upload images
    let uploadedImages: string[] = [];

    if (req.files && (req.files as any).length > 0) {
      // Upload all files in parallel
      const uploadResults = await Promise.all(
        (req.files as any).map((file: any) =>
          uploadFileToAzure(file.buffer, file.originalname, file.mimetype, "checker")
        )
      );

      // Collect only successful uploads
      uploadedImages = uploadResults
        .filter(result => result.success)
        .map(result => result.url || "")
        .filter(url => url && url.trim() !== "");
    }

    // Combine existing images with new uploaded images
    const combinedImages = [...existingImages, ...uploadedImages];

    // Validate total image count (existing + new)
    if (combinedImages.length < minImages) {
      throw new AppError(
        `Insufficient images. Minimum ${minImages} images required (1 per container), currently have ${combinedImages.length} (${existingImages.length} existing + ${uploadedImages.length} new)`,
        400
      );
    }

    if (combinedImages.length > maxImages) {
      throw new AppError(
        `Too many images. Maximum ${maxImages} images allowed (2 per container), currently have ${combinedImages.length} (${existingImages.length} existing + ${uploadedImages.length} new)`,
        400
      );
    }

    // Update order with combined images (existing + new)
    await orderPick.update({
      images: combinedImages,
      notes: req.body.notes || orderPick.notes || " "
    });

    return {
      success: true,
      message: `Photos captured successfully for order ${orderNumber}`,
      orderNumber,
      totalImages: combinedImages.length,
      existingImages: existingImages.length,
      newImages: uploadedImages.length,
      photos: combinedImages,
      notes: req.body.notes || orderPick.notes || " "
    };
  }

  /**
   * Print labels for boxes
   * - Supports multiple label sizes
   * - Generates "X of Y" labels for multiple boxes
   * - Includes barcode from box ID
   * - Uploads PDFs to Azure
   */
  async printLabels(data: {
    orderNumber: number;
    size: '4x3' | '4x6' | '3x6' | '3x2' | '4x4' | '2x2' | '2x3' | 'A4';
    boxIds?: number[]; // If provided, print only these boxes. If not, print all
  }) {
    const { orderNumber, size, boxIds } = data;

    // Get order information with customer address details
    const orderHeader = await OrderHeader.findOne({
      where: { Order_Number: orderNumber },
      attributes: ['Order_Number', 'Order_Date', 'Delivery_Date'],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['C_Number', 'C_Name', 'C_Address', 'C_City', 'C_State', 'C_Zip'],
          include: [
            {
              model: CustomerRoute,
              as: 'Routes',
              attributes: ['Route_Number', 'Stop_Number'],
              required: false,
            },
          ],
          required: false,
        },
      ],
    });

    if (!orderHeader) {
      throw new AppError("Order not found", 404);
    }

    // Get all boxes/totes/drinks for this order
    const allBoxes = await OrderPickBox.findAll({
      where: { orderNumber },
      order: [['id', 'ASC']],
    });

    if (!allBoxes || allBoxes.length === 0) {
      throw new AppError("No boxes found for this order", 404);
    }

    // Filter boxes if specific boxIds provided
    const boxesToPrint = boxIds && boxIds.length > 0
      ? allBoxes.filter(box => boxIds.includes(box.id))
      : allBoxes;

    if (boxesToPrint.length === 0) {
      throw new AppError("No boxes found matching the provided IDs", 404);
    }

    const totalBoxes = allBoxes.length;
    const customer = (orderHeader as any).customer;
    const route = customer?.Routes?.[0]?.Route_Number || null;
    const stop = customer?.Routes?.[0]?.Stop_Number || null;
    const accountNumber = customer?.C_Number || null;
    const customerName = customer?.C_Name || null;
    const customerAddress = customer?.C_Address || null;
    const city = customer?.C_City || null;
    const state = customer?.C_State || null;
    const zip = customer?.C_Zip || null;
    const orderDate = moment((orderHeader as any).Order_Date).format('MM/DD/YYYY');
    const deliveryDate = (orderHeader as any).Delivery_Date 
      ? moment((orderHeader as any).Delivery_Date).format('MM/DD/YYYY')
      : null;

    // Generate PDFs for each box
    const pdfUrls: string[] = [];

    for (let i = 0; i < boxesToPrint.length; i++) {
      const box = boxesToPrint[i];
      const boxIndex = allBoxes.findIndex(b => b.id === box.id) + 1; // 1-based index
      const xOfY = `${boxIndex} of ${totalBoxes}`;

      // Generate barcode from box ID
      const barcodeResult = await generateBarcodeAndUpload(box.id.toString(), {
        folderName: 'checker/barcodes',
        type: 'code128',
        includeText: true,
        scale: 3,
        height: 12,
      });

      if (!barcodeResult.success || !barcodeResult.url) {
        throw new AppError(`Failed to generate barcode for box ${box.id}`, 500);
      }

      // Get box items to count them
      const boxItems = await this.getBoxItem(box.id);
      const itemCount = boxItems.length;

      // Generate HTML for label using size-specific method
      const html = this.generateLabelHTMLBySize({
        size,
        route: route?.toString() || 'N/A',
        stop: stop?.toString() || 'N/A',
        barcodeUrl: barcodeResult.url,
        boxId: box.id,
        customerName: customerName || 'N/A',
        customerAddress: customerAddress || undefined,
        city: city || undefined,
        state: state || undefined,
        zip: zip || undefined,
        custNumber: accountNumber?.toString() || undefined,
        accountNumber: accountNumber?.toString() || 'N/A',
        deliveryDate: deliveryDate || undefined,
        itemCount: itemCount,
        xOfY,
        date: orderDate,
        boxItems: size === 'A4' ? boxItems : undefined,
      });

      // Generate PDF
      const pdfBuffer = await this.generateLabelPDF(html, size);

      // Upload to Azure
      const fileName = `order-${orderNumber}-box-${box.id}-${boxIndex}of${totalBoxes}-${Date.now()}.pdf`;
      const uploadResult = await uploadFileToAzure(
        pdfBuffer,
        fileName,
        'application/pdf',
        'checker/labels'
      );

      if (!uploadResult.success || !uploadResult.url) {
        throw new AppError(`Failed to upload PDF for box ${box.id}`, 500);
      }

      pdfUrls.push(uploadResult.url);
    }

    return {
      success: true,
      message: `Successfully generated ${pdfUrls.length} label(s)`,
      pdfUrls,
      orderNumber,
      size,
      totalBoxes,
      printedBoxes: boxesToPrint.length,
    };
  }

  /**
   * Generate label HTML based on size - routes to size-specific layouts
   */
  private generateLabelHTMLBySize(data: {
    size: string;
    route: string;
    stop: string;
    barcodeUrl: string;
    boxId: number;
    customerName: string;
    customerAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    custNumber?: string;
    accountNumber: string;
    deliveryDate?: string;
    itemCount?: number;
    xOfY: string;
    date: string;
    boxItems?: any[];
  }): string {
    // Route to size-specific layout methods
    if (data.size === 'A4') {
      return this.generateA4LabelHTML({
        date: data.date,
        accountNumber: data.accountNumber,
        customerName: data.customerName,
        route: data.route,
        stop: data.stop,
        xOfY: data.xOfY,
        barcodeUrl: data.barcodeUrl,
        boxId: data.boxId,
        boxItems: data.boxItems || [],
        customerAddress: data.customerAddress,
        city: data.city,
        state: data.state,
        zip: data.zip,
        custNumber: data.custNumber,
        deliveryDate: data.deliveryDate,
        itemCount: data.itemCount,
      });
    }
    
    // Size-specific layouts
    switch (data.size) {
      case '4x3':
        return this.generate4x3LabelHTML(data);
      case '4x6':
        return this.generate4x6LabelHTML(data);
      case '3x6':
        return this.generate3x6LabelHTML(data);
      case '3x2':
        return this.generate3x2LabelHTML(data);
      case '4x4':
        return this.generate4x4LabelHTML(data);
      case '2x2':
        return this.generate2x2LabelHTML(data);
      case '2x3':
        return this.generate2x3LabelHTML(data);
      default:
        // Fallback to enhanced layout for unknown sizes
        return this.generateEnhancedLabelHTML(data);
    }
  }

  /**
   * Generate 4x3 label HTML - Compact layout optimized for 4x3 inch labels
   */
  private generate4x3LabelHTML(data: {
    size: string;
    route: string;
    stop: string;
    barcodeUrl: string;
    boxId: number;
    customerName: string;
    customerAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    custNumber?: string;
    accountNumber: string;
    deliveryDate?: string;
    itemCount?: number;
    xOfY: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 4in 3in;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 4in;
      height: 3in;
      font-family: Arial, sans-serif;
      padding: 0.1in;
      position: relative;
    }
    
    .label-container {
      width: 100%;
      height: 100%;
      border: 2px solid black;
      padding: 0.08in;
      display: flex;
      flex-direction: column;
    }
    
    .header-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.06in;
    }
    
    .route-stop {
      font-size: 16pt;
      font-weight: bold;
      display: flex;
      gap: 0.15in;
    }
    
    .route-box, .stop-box {
      border: 2px solid black;
      padding: 0.03in 0.1in;
    }
    
    .barcode-section {
      text-align: center;
      margin: 0.06in 0;
    }
    
    .barcode-section img {
      max-width: 85%;
      height: auto;
      max-height: 0.5in;
    }
    
    .customer-section {
      border: 2px solid black;
      padding: 0.05in;
      margin-bottom: 0.05in;
      font-size: 9pt;
    }
    
    .customer-name {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 0.03in;
    }
    
    .address-line {
      font-size: 8pt;
      margin-bottom: 0.01in;
    }
    
    .cust-number {
      text-align: right;
      font-size: 8pt;
      margin-top: 0.03in;
    }
    
    .bottom-section {
      margin-top: auto;
      padding-top: 0.05in;
    }
    
    .info-row {
      font-size: 8pt;
      margin-bottom: 0.02in;
    }
    
    .delivery-date {
      font-size: 9pt;
      font-weight: bold;
      margin-bottom: 0.02in;
    }
    
    .item-count {
      font-size: 8pt;
    }
    
    .box-indicator {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin-top: 0.05in;
    }
  </style>
</head>
<body>
  <div class="label-container">
    <!-- Header with Route/Stop -->
    <div class="header-section">
      <div class="route-stop">
        <div class="route-box">ROUTE: ${data.route}</div>
        <div class="stop-box">STOP: ${data.stop}</div>
      </div>
    </div>
    
    <!-- Main Barcode -->
    <div class="barcode-section">
      <img src="${data.barcodeUrl}" alt="Barcode ${data.boxId}" />
    </div>
    
    <!-- Customer Info Box -->
    <div class="customer-section">
      <div class="customer-name">${data.customerName}</div>
      ${data.customerAddress ? `<div class="address-line">${data.customerAddress}</div>` : ''}
      ${data.city || data.state || data.zip ? `
        <div class="address-line">
          ${data.city || ''}${data.city && data.state ? ', ' : ''}${data.state || ''} ${data.zip || ''}
        </div>
      ` : ''}
      ${data.custNumber ? `<div class="cust-number">Cust #${data.custNumber}</div>` : ''}
    </div>
    
    <!-- Bottom Section -->
    <div class="bottom-section">
      <div class="info-row">${data.accountNumber}</div>
      ${data.deliveryDate ? `<div class="delivery-date">Delivery: ${data.deliveryDate}</div>` : ''}
      ${data.itemCount !== undefined ? `<div class="item-count">Items: ${data.itemCount}</div>` : ''}
    </div>
    
    <!-- Box Indicator -->
    <div class="box-indicator">
      ${data.xOfY}
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate 4x6 label HTML - Standard layout for 4x6 inch labels
   */
  private generate4x6LabelHTML(data: {
    size: string;
    route: string;
    stop: string;
    barcodeUrl: string;
    boxId: number;
    customerName: string;
    customerAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    custNumber?: string;
    accountNumber: string;
    deliveryDate?: string;
    itemCount?: number;
    xOfY: string;
  }): string {
    // For now, use enhanced layout - will customize later
    return this.generateEnhancedLabelHTML(data);
  }

  /**
   * Generate 3x6 label HTML - Vertical layout optimized for 3x6 inch labels
   */
  private generate3x6LabelHTML(data: {
    size: string;
    route: string;
    stop: string;
    barcodeUrl: string;
    boxId: number;
    customerName: string;
    customerAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    custNumber?: string;
    accountNumber: string;
    deliveryDate?: string;
    itemCount?: number;
    xOfY: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 3in 6in;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 3in;
      height: 6in;
      font-family: Arial, sans-serif;
      padding: 0.1in;
      position: relative;
    }
    
    .label-container {
      width: 100%;
      height: 100%;
      border: 2px solid black;
      padding: 0.08in;
      display: flex;
      flex-direction: column;
    }
    
    .header-section {
      margin-bottom: 0.1in;
    }
    
    .route-stop {
      font-size: 18pt;
      font-weight: bold;
      display: flex;
      flex-direction: column;
      gap: 0.08in;
    }
    
    .route-box, .stop-box {
      border: 2px solid black;
      padding: 0.04in 0.12in;
      text-align: center;
    }
    
    .barcode-section {
      text-align: center;
      margin: 0.1in 0;
    }
    
    .barcode-section img {
      max-width: 90%;
      height: auto;
      max-height: 0.6in;
    }
    
    .box-id {
      text-align: center;
      font-size: 12pt;
      font-weight: bold;
      margin-top: 0.05in;
    }
    
    .customer-section {
      border: 2px solid black;
      padding: 0.06in;
      margin-bottom: 0.08in;
      font-size: 10pt;
    }
    
    .customer-name {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 0.04in;
    }
    
    .address-line {
      font-size: 9pt;
      margin-bottom: 0.02in;
      line-height: 1.2;
    }
    
    .cust-number {
      text-align: right;
      font-size: 9pt;
      margin-top: 0.04in;
    }
    
    .bottom-section {
      margin-top: auto;
      padding-top: 0.08in;
    }
    
    .info-row {
      font-size: 9pt;
      margin-bottom: 0.03in;
    }
    
    .delivery-date {
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 0.03in;
    }
    
    .item-count {
      font-size: 9pt;
      margin-bottom: 0.05in;
    }
    
    .box-indicator {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin-top: 0.08in;
    }
  </style>
</head>
<body>
  <div class="label-container">
    <!-- Header with Route/Stop (stacked vertically) -->
    <div class="header-section">
      <div class="route-stop">
        <div class="route-box">ROUTE: ${data.route}</div>
        <div class="stop-box">STOP: ${data.stop}</div>
      </div>
    </div>
    
    <!-- Main Barcode -->
    <div class="barcode-section">
      <img src="${data.barcodeUrl}" alt="Barcode ${data.boxId}" />
      <div class="box-id">${data.boxId}</div>
    </div>
    
    <!-- Customer Info Box -->
    <div class="customer-section">
      <div class="customer-name">${data.customerName}</div>
      ${data.customerAddress ? `<div class="address-line">${data.customerAddress}</div>` : ''}
      ${data.city || data.state || data.zip ? `
        <div class="address-line">
          ${data.city || ''}${data.city && data.state ? ', ' : ''}${data.state || ''} ${data.zip || ''}
        </div>
      ` : ''}
      ${data.custNumber ? `<div class="cust-number">Cust #${data.custNumber}</div>` : ''}
    </div>
    
    <!-- Bottom Section -->
    <div class="bottom-section">
      <div class="info-row">Account: ${data.accountNumber}</div>
      ${data.deliveryDate ? `<div class="delivery-date">Delivery Date: ${data.deliveryDate}</div>` : ''}
      ${data.itemCount !== undefined ? `<div class="item-count">Items in Container: ${data.itemCount}</div>` : ''}
    </div>
    
    <!-- Box Indicator -->
    <div class="box-indicator">
      ${data.xOfY}
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate 3x2 label HTML - Very compact layout optimized for 3x2 inch labels
   */
  private generate3x2LabelHTML(data: {
    size: string;
    route: string;
    stop: string;
    barcodeUrl: string;
    boxId: number;
    customerName: string;
    customerAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    custNumber?: string;
    accountNumber: string;
    deliveryDate?: string;
    itemCount?: number;
    xOfY: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 3in 2in;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 3in;
      height: 2in;
      font-family: Arial, sans-serif;
      padding: 0.06in;
      position: relative;
    }
    
    .label-container {
      width: 100%;
      height: 100%;
      border: 2px solid black;
      padding: 0.05in;
      display: flex;
      flex-direction: column;
    }
    
    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.04in;
    }
    
    .route-stop {
      font-size: 12pt;
      font-weight: bold;
      display: flex;
      gap: 0.1in;
    }
    
    .route-box, .stop-box {
      border: 1.5px solid black;
      padding: 0.02in 0.08in;
      font-size: 11pt;
    }
    
    .box-indicator-top {
      font-size: 14pt;
      font-weight: bold;
    }
    
    .barcode-section {
      text-align: center;
      margin: 0.03in 0;
    }
    
    .barcode-section img {
      max-width: 80%;
      height: auto;
      max-height: 0.35in;
    }
    
    .box-id {
      text-align: center;
      font-size: 9pt;
      font-weight: bold;
      margin-top: 0.02in;
    }
    
    .customer-section {
      border: 1.5px solid black;
      padding: 0.03in;
      margin-bottom: 0.03in;
      font-size: 7pt;
    }
    
    .customer-name {
      font-size: 9pt;
      font-weight: bold;
      margin-bottom: 0.02in;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .address-line {
      font-size: 7pt;
      margin-bottom: 0.01in;
      line-height: 1.1;
    }
    
    .bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7pt;
      margin-top: auto;
    }
    
    .left-info {
      flex: 1;
    }
    
    .account-number {
      font-weight: bold;
      margin-bottom: 0.01in;
    }
    
    .delivery-date {
      font-size: 7pt;
      margin-bottom: 0.01in;
    }
    
    .item-count {
      font-size: 7pt;
    }
    
    .cust-number {
      font-size: 7pt;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="label-container">
    <!-- Top Row: Route/Stop and Box Indicator -->
    <div class="top-row">
      <div class="route-stop">
        <div class="route-box">R:${data.route}</div>
        <div class="stop-box">S:${data.stop}</div>
      </div>
      <div class="box-indicator-top">${data.xOfY}</div>
    </div>
    
    <!-- Barcode -->
    <div class="barcode-section">
      <img src="${data.barcodeUrl}" alt="Barcode ${data.boxId}" />
      <div class="box-id">${data.boxId}</div>
    </div>
    
    <!-- Customer Info Box -->
    <div class="customer-section">
      <div class="customer-name">${data.customerName}</div>
      ${data.customerAddress ? `<div class="address-line">${data.customerAddress}</div>` : ''}
      ${data.city || data.state || data.zip ? `
        <div class="address-line">
          ${data.city || ''}${data.city && data.state ? ', ' : ''}${data.state || ''} ${data.zip || ''}
        </div>
      ` : ''}
    </div>
    
    <!-- Bottom Row: Account, Delivery, Items, Cust# -->
    <div class="bottom-row">
      <div class="left-info">
        <div class="account-number">${data.accountNumber}</div>
        ${data.deliveryDate ? `<div class="delivery-date">Del: ${data.deliveryDate}</div>` : ''}
        ${data.itemCount !== undefined ? `<div class="item-count">Items: ${data.itemCount}</div>` : ''}
      </div>
      ${data.custNumber ? `<div class="cust-number">C#${data.custNumber}</div>` : ''}
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate 4x4 label HTML - Square layout optimized for 4x4 inch labels
   */
  private generate4x4LabelHTML(data: {
    size: string;
    route: string;
    stop: string;
    barcodeUrl: string;
    boxId: number;
    customerName: string;
    customerAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    custNumber?: string;
    accountNumber: string;
    deliveryDate?: string;
    itemCount?: number;
    xOfY: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 4in 4in;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 4in;
      height: 4in;
      font-family: Arial, sans-serif;
      padding: 0.12in;
      position: relative;
    }
    
    .label-container {
      width: 100%;
      height: 100%;
      border: 2px solid black;
      padding: 0.1in;
      display: flex;
      flex-direction: column;
    }
    
    .header-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.08in;
    }
    
    .route-stop {
      font-size: 20pt;
      font-weight: bold;
      display: flex;
      gap: 0.18in;
    }
    
    .route-box, .stop-box {
      border: 2px solid black;
      padding: 0.04in 0.12in;
    }
    
    .barcode-section {
      text-align: center;
      margin: 0.08in 0;
    }
    
    .barcode-section img {
      max-width: 88%;
      height: auto;
      max-height: 0.55in;
    }
    
    .box-id {
      text-align: center;
      font-size: 11pt;
      font-weight: bold;
      margin-top: 0.04in;
    }
    
    .customer-section {
      border: 2px solid black;
      padding: 0.06in;
      margin-bottom: 0.06in;
      font-size: 10pt;
    }
    
    .customer-name {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 0.04in;
    }
    
    .address-line {
      font-size: 9pt;
      margin-bottom: 0.02in;
      line-height: 1.2;
    }
    
    .cust-number {
      text-align: right;
      font-size: 9pt;
      margin-top: 0.04in;
    }
    
    .bottom-section {
      margin-top: auto;
      padding-top: 0.06in;
    }
    
    .info-row {
      font-size: 9pt;
      margin-bottom: 0.03in;
    }
    
    .delivery-date {
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 0.03in;
    }
    
    .item-count {
      font-size: 9pt;
      margin-bottom: 0.05in;
    }
    
    .box-indicator {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin-top: 0.06in;
    }
  </style>
</head>
<body>
  <div class="label-container">
    <!-- Header with Route/Stop -->
    <div class="header-section">
      <div class="route-stop">
        <div class="route-box">ROUTE: ${data.route}</div>
        <div class="stop-box">STOP: ${data.stop}</div>
      </div>
    </div>
    
    <!-- Main Barcode -->
    <div class="barcode-section">
      <img src="${data.barcodeUrl}" alt="Barcode ${data.boxId}" />
      <div class="box-id">${data.boxId}</div>
    </div>
    
    <!-- Customer Info Box -->
    <div class="customer-section">
      <div class="customer-name">${data.customerName}</div>
      ${data.customerAddress ? `<div class="address-line">${data.customerAddress}</div>` : ''}
      ${data.city || data.state || data.zip ? `
        <div class="address-line">
          ${data.city || ''}${data.city && data.state ? ', ' : ''}${data.state || ''} ${data.zip || ''}
        </div>
      ` : ''}
      ${data.custNumber ? `<div class="cust-number">Cust #${data.custNumber}</div>` : ''}
    </div>
    
    <!-- Bottom Section -->
    <div class="bottom-section">
      <div class="info-row">${data.accountNumber}</div>
      ${data.deliveryDate ? `<div class="delivery-date">Delivery Date: ${data.deliveryDate}</div>` : ''}
      ${data.itemCount !== undefined ? `<div class="item-count">Number of Items in Container: ${data.itemCount}</div>` : ''}
    </div>
    
    <!-- Box Indicator -->
    <div class="box-indicator">
      ${data.xOfY}
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate 2x2 label HTML - Very compact square layout optimized for 2x2 inch labels
   */
  private generate2x2LabelHTML(data: {
    size: string;
    route: string;
    stop: string;
    barcodeUrl: string;
    boxId: number;
    customerName: string;
    customerAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    custNumber?: string;
    accountNumber: string;
    deliveryDate?: string;
    itemCount?: number;
    xOfY: string;
  }): string {
    // Split customer name into words for better fit
    const nameWords = data.customerName.split(' ');
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 2in 2in;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 2in;
      height: 2in;
      font-family: Arial, sans-serif;
      padding: 0.05in;
      position: relative;
    }
    
    .label-container {
      width: 100%;
      height: 100%;
      border: 2px solid black;
      padding: 0.04in;
      display: flex;
      flex-direction: column;
    }
    
    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.03in;
    }
    
    .route-stop {
      font-size: 10pt;
      font-weight: bold;
      display: flex;
      gap: 0.08in;
    }
    
    .route-box, .stop-box {
      border: 1.5px solid black;
      padding: 0.015in 0.06in;
      font-size: 9pt;
    }
    
    .box-indicator-top {
      font-size: 12pt;
      font-weight: bold;
    }
    
    .barcode-section {
      text-align: center;
      margin: 0.025in 0;
    }
    
    .barcode-section img {
      max-width: 75%;
      height: auto;
      max-height: 0.3in;
    }
    
    .box-id {
      text-align: center;
      font-size: 8pt;
      font-weight: bold;
      margin-top: 0.015in;
    }
    
    .customer-section {
      border: 1.5px solid black;
      padding: 0.025in;
      margin-bottom: 0.025in;
      font-size: 6pt;
    }
    
    .customer-name {
      font-size: 8pt;
      font-weight: bold;
      margin-bottom: 0.015in;
      line-height: 1.1;
    }
    
    .address-line {
      font-size: 6pt;
      margin-bottom: 0.01in;
      line-height: 1.1;
    }
    
    .bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      font-size: 6pt;
      margin-top: auto;
    }
    
    .left-info {
      flex: 1;
    }
    
    .account-number {
      font-weight: bold;
      margin-bottom: 0.01in;
    }
    
    .delivery-date {
      font-size: 6pt;
      margin-bottom: 0.01in;
    }
    
    .item-count {
      font-size: 6pt;
    }
    
    .cust-number {
      font-size: 6pt;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="label-container">
    <!-- Top Row: Route/Stop and Box Indicator -->
    <div class="top-row">
      <div class="route-stop">
        <div class="route-box">R:${data.route}</div>
        <div class="stop-box">S:${data.stop}</div>
      </div>
      <div class="box-indicator-top">${data.xOfY}</div>
    </div>
    
    <!-- Barcode -->
    <div class="barcode-section">
      <img src="${data.barcodeUrl}" alt="Barcode ${data.boxId}" />
      <div class="box-id">${data.boxId}</div>
    </div>
    
    <!-- Customer Info Box -->
    <div class="customer-section">
      <div class="customer-name">${nameWords.map(word => word).join(' ')}</div>
      ${data.customerAddress ? `<div class="address-line">${data.customerAddress}</div>` : ''}
      ${data.city || data.state || data.zip ? `
        <div class="address-line">
          ${data.city || ''}${data.city && data.state ? ', ' : ''}${data.state || ''} ${data.zip || ''}
        </div>
      ` : ''}
    </div>
    
    <!-- Bottom Row: Account, Delivery, Items, Cust# -->
    <div class="bottom-row">
      <div class="left-info">
        <div class="account-number">${data.accountNumber}</div>
        ${data.deliveryDate ? `<div class="delivery-date">Del: ${data.deliveryDate}</div>` : ''}
        ${data.itemCount !== undefined ? `<div class="item-count">Items: ${data.itemCount}</div>` : ''}
      </div>
      ${data.custNumber ? `<div class="cust-number">C#${data.custNumber}</div>` : ''}
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate 2x3 label HTML - Compact vertical layout optimized for 2x3 inch labels
   */
  private generate2x3LabelHTML(data: {
    size: string;
    route: string;
    stop: string;
    barcodeUrl: string;
    boxId: number;
    customerName: string;
    customerAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    custNumber?: string;
    accountNumber: string;
    deliveryDate?: string;
    itemCount?: number;
    xOfY: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 2in 3in;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 2in;
      height: 3in;
      font-family: Arial, sans-serif;
      padding: 0.06in;
      position: relative;
    }
    
    .label-container {
      width: 100%;
      height: 100%;
      border: 2px solid black;
      padding: 0.05in;
      display: flex;
      flex-direction: column;
    }
    
    .header-section {
      margin-bottom: 0.06in;
    }
    
    .route-stop {
      font-size: 12pt;
      font-weight: bold;
      display: flex;
      flex-direction: column;
      gap: 0.05in;
    }
    
    .route-box, .stop-box {
      border: 1.5px solid black;
      padding: 0.025in 0.08in;
      text-align: center;
      font-size: 10pt;
    }
    
    .barcode-section {
      text-align: center;
      margin: 0.05in 0;
    }
    
    .barcode-section img {
      max-width: 85%;
      height: auto;
      max-height: 0.4in;
    }
    
    .box-id {
      text-align: center;
      font-size: 9pt;
      font-weight: bold;
      margin-top: 0.03in;
    }
    
    .customer-section {
      border: 1.5px solid black;
      padding: 0.04in;
      margin-bottom: 0.05in;
      font-size: 7pt;
    }
    
    .customer-name {
      font-size: 9pt;
      font-weight: bold;
      margin-bottom: 0.025in;
      line-height: 1.2;
    }
    
    .address-line {
      font-size: 7pt;
      margin-bottom: 0.015in;
      line-height: 1.1;
    }
    
    .cust-number {
      text-align: right;
      font-size: 7pt;
      margin-top: 0.025in;
    }
    
    .bottom-section {
      margin-top: auto;
      padding-top: 0.05in;
    }
    
    .info-row {
      font-size: 7pt;
      margin-bottom: 0.02in;
    }
    
    .delivery-date {
      font-size: 8pt;
      font-weight: bold;
      margin-bottom: 0.02in;
    }
    
    .item-count {
      font-size: 7pt;
      margin-bottom: 0.04in;
    }
    
    .box-indicator {
      text-align: center;
      font-size: 13pt;
      font-weight: bold;
      margin-top: 0.05in;
    }
  </style>
</head>
<body>
  <div class="label-container">
    <!-- Header with Route/Stop (stacked vertically) -->
    <div class="header-section">
      <div class="route-stop">
        <div class="route-box">ROUTE: ${data.route}</div>
        <div class="stop-box">STOP: ${data.stop}</div>
      </div>
    </div>
    
    <!-- Main Barcode -->
    <div class="barcode-section">
      <img src="${data.barcodeUrl}" alt="Barcode ${data.boxId}" />
      <div class="box-id">${data.boxId}</div>
    </div>
    
    <!-- Customer Info Box -->
    <div class="customer-section">
      <div class="customer-name">${data.customerName}</div>
      ${data.customerAddress ? `<div class="address-line">${data.customerAddress}</div>` : ''}
      ${data.city || data.state || data.zip ? `
        <div class="address-line">
          ${data.city || ''}${data.city && data.state ? ', ' : ''}${data.state || ''} ${data.zip || ''}
        </div>
      ` : ''}
      ${data.custNumber ? `<div class="cust-number">Cust #${data.custNumber}</div>` : ''}
    </div>
    
    <!-- Bottom Section -->
    <div class="bottom-section">
      <div class="info-row">${data.accountNumber}</div>
      ${data.deliveryDate ? `<div class="delivery-date">Delivery Date: ${data.deliveryDate}</div>` : ''}
      ${data.itemCount !== undefined ? `<div class="item-count">Number of Items In Container: ${data.itemCount}</div>` : ''}
    </div>
    
    <!-- Box Indicator -->
    <div class="box-indicator">
      ${data.xOfY}
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate enhanced HTML for label with improved layout
   */
  private generateEnhancedLabelHTML(data: {
    size: string;
    route: string;
    stop: string;
    barcodeUrl: string;
    boxId: number;
    customerName: string;
    customerAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    custNumber?: string;
    accountNumber: string;
    deliveryDate?: string;
    itemCount?: number;
    xOfY: string;
  }): string {
    const dimensions = this.getLabelDimensions(data.size);
    const width = dimensions.width;
    const height = dimensions.height;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: ${width}in ${height}in;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: ${width}in;
      height: ${height}in;
      font-family: Arial, sans-serif;
      padding: 0.15in;
      position: relative;
    }
    
    .label-container {
      width: 100%;
      height: 100%;
      border: 2px solid black;
      padding: 0.1in;
      display: flex;
      flex-direction: column;
    }
    
    .header-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.1in;
    }
    
    .route-stop {
      font-size: 24pt;
      font-weight: bold;
      display: flex;
      gap: 0.2in;
    }
    
    .route-box, .stop-box {
      border: 2px solid black;
      padding: 0.05in 0.15in;
    }
    
    .barcode-section {
      text-align: center;
      margin: 0.1in 0;
    }
    
    .barcode-section img {
      max-width: 90%;
      height: auto;
    }
    
    .customer-section {
      border: 2px solid black;
      padding: 0.08in;
      margin-bottom: 0.08in;
      font-size: 11pt;
      font-weight: bold;
    }
    
    .customer-name {
      font-size: 14pt;
      margin-bottom: 0.05in;
    }
    
    .address-line {
      font-size: 10pt;
      margin-bottom: 0.02in;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.05in;
      font-size: 10pt;
    }
    
    .cust-number {
      text-align: right;
      font-size: 10pt;
      margin-top: 0.05in;
    }
    
    .bottom-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: auto;
      padding-top: 0.1in;
    }
    
    .left-info {
      flex: 1;
    }
    
    .delivery-date {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 0.05in;
    }
    
    .item-count {
      font-size: 10pt;
    }
    
    .box-indicator {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      margin-top: 0.1in;
    }
  </style>
</head>
<body>
  <div class="label-container">
    <!-- Header with Route/Stop -->
    <div class="header-section">
      <div class="route-stop">
        <div class="route-box">ROUTE: ${data.route}</div>
        <div class="stop-box">STOP: ${data.stop}</div>
      </div>
    </div>
    
    <!-- Main Barcode -->
    <div class="barcode-section">
      <img src="${data.barcodeUrl}" alt="Barcode ${data.boxId}" />
    </div>
    
    <!-- Customer Info Box -->
    <div class="customer-section">
      <div class="customer-name">${data.customerName}</div>
      ${data.customerAddress ? `<div class="address-line">${data.customerAddress}</div>` : ''}
      ${data.city || data.state || data.zip ? `
        <div class="address-line">
          ${data.city || ''}${data.city && data.state ? ', ' : ''}${data.state || ''} ${data.zip || ''}
        </div>
      ` : ''}
      ${data.custNumber ? `<div class="cust-number">Cust #${data.custNumber}</div>` : ''}
    </div>
    
    <!-- Bottom Section -->
    <div class="bottom-section">
      <div class="left-info">
        <div class="info-row">
          <span>${data.accountNumber}</span>
        </div>
        ${data.deliveryDate ? `<div class="delivery-date">Delivery Date: ${data.deliveryDate}</div>` : ''}
        ${data.itemCount !== undefined ? `<div class="item-count">Number of Items in Container: ${data.itemCount}</div>` : ''}
      </div>
    </div>
    
    <!-- Box Indicator -->
    <div class="box-indicator">
      ${data.xOfY}
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate HTML for label based on size
   */
  private generateLabelHTML(data: {
    size: string;
    date: string;
    accountNumber: string;
    customerName: string;
    route: string;
    stop: string;
    xOfY: string;
    barcodeUrl: string;
    boxId: number;
    boxItems?: any[];
  }): string {
    const { size, date, accountNumber, customerName, route, stop, xOfY, barcodeUrl, boxId } = data;

    if (size === 'A4') {
      return this.generateA4LabelHTML(data);
    }

    const dimensions = this.getLabelDimensions(size);
    const widthPt = dimensions.width * 72;
    const heightPt = dimensions.height * 72;

    const area = dimensions.width * dimensions.height;
    const isSmall = area <= 4;
    const isMedium = area > 4 && area <= 12;
    const isLarge = area > 12;

    const fonts = {
      header: isSmall ? '10px' : isMedium ? '12px' : '14px',
      date: isSmall ? '9px' : isMedium ? '11px' : '13px',
      accountLabel: isSmall ? '7px' : isMedium ? '8px' : '9px',
      accountValue: isSmall ? '11px' : isMedium ? '14px' : '16px',
      customer: isSmall ? '9px' : isMedium ? '11px' : '13px',
      routeStop: isSmall ? '7px' : isMedium ? '9px' : '11px',
      boxIdLarge: isSmall ? '18px' : isMedium ? '22px' : '28px',
      boxIdMedium: isSmall ? '14px' : isMedium ? '18px' : '22px',
      xOfY: isSmall ? '11px' : isMedium ? '14px' : '16px',
      boxIdLabel: isSmall ? '7px' : isMedium ? '9px' : '11px',
      padding: isSmall ? '8px' : isMedium ? '10px' : '12px',
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            size: ${dimensions.width}in ${dimensions.height}in;
            margin: 0;
          }
          body {
            margin: 0;
            padding: ${fonts.padding};
            width: ${widthPt - (parseFloat(fonts.padding) * 2 * 72 / 96)}pt;
            height: ${heightPt - (parseFloat(fonts.padding) * 2 * 72 / 96)}pt;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
          }
          .top-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: ${isSmall ? '5px' : isMedium ? '7px' : '10px'};
          }
          .date-left {
            font-size: ${fonts.date};
            font-weight: bold;
            line-height: 1.2;
          }
          .account-customer {
            text-align: right;
            flex: 1;
          }
          .account-label {
            font-size: ${fonts.accountLabel};
            display: block;
          }
          .account-value {
            font-size: ${fonts.accountValue};
            font-weight: bold;
            display: block;
            margin-bottom: ${isSmall ? '2px' : '3px'};
          }
          .customer-name {
            font-size: ${fonts.customer};
            display: block;
          }
          .route-stop {
            font-size: ${fonts.routeStop};
            text-align: center;
            margin: ${isSmall ? '3px' : '5px'} 0;
          }
          .barcode-section {
            text-align: center;
            margin: ${isSmall ? '6px' : isMedium ? '8px' : '12px'} 0;
          }
          .barcode-img {
            max-width: 100%;
            height: auto;
            max-height: ${isSmall ? '40px' : isMedium ? '50px' : '60px'};
          }
          .box-id-large {
            text-align: center;
            font-size: ${fonts.boxIdLarge};
            font-weight: bold;
            margin: ${isSmall ? '4px' : '6px'} 0;
            line-height: 1;
          }
          .box-id-medium {
            text-align: center;
            font-size: ${fonts.boxIdMedium};
            font-weight: bold;
            margin: ${isSmall ? '2px' : '4px'} 0;
            line-height: 1;
          }
          .x-of-y {
            text-align: center;
            font-size: ${fonts.xOfY};
            font-weight: bold;
            margin-top: ${isSmall ? '4px' : '6px'};
          }
          .box-id-label {
            text-align: center;
            font-size: ${fonts.boxIdLabel};
            margin-top: ${isSmall ? '2px' : '3px'};
          }
        </style>
      </head>
      <body>
        <div class="top-section">
          <div class="date-left">${date}</div>
          <div class="account-customer">
            <span class="account-label">Account</span>
            <span class="account-value">#: ${accountNumber}</span>
            <span class="customer-name" style="display:inline-block; text-align:left;">${customerName}</span>
          </div>
        </div>
        <div class="route-stop">Route: ${route} | Stop: ${stop}</div>
        <div class="barcode-section">
          <img src="${barcodeUrl}" alt="Barcode" class="barcode-img" />
        </div>
        <div class="x-of-y">${xOfY}</div>
      
      </body>
      </html>
    `;
  }

  private generateA4LabelHTML(data: {
    date: string;
    accountNumber: string;
    customerName: string;
    route: string;
    stop: string;
    xOfY: string;
    barcodeUrl: string;
    boxId: number;
    boxItems?: any[];
    customerAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    custNumber?: string;
    deliveryDate?: string;
    itemCount?: number;
  }): string {
    const { 
      date, 
      accountNumber, 
      customerName, 
      route, 
      stop, 
      xOfY, 
      barcodeUrl, 
      boxId, 
      boxItems = [],
      customerAddress,
      city,
      state,
      zip,
      custNumber,
      deliveryDate,
      itemCount
    } = data;

    const itemsRows = boxItems.map((item: any) => `
      <tr>
        <td style="text-align: center; padding: 8px;">${item.itemNumber || 'N/A'}</td>
        <td style="padding: 8px;">${item.description || 'N/A'}</td>
        <td style="text-align: center; padding: 8px;">${item.qty || 0}</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      padding: 15px;
      margin: 0;
    }
    
    .label-container {
      width: 100%;
      min-height: 100%;
      border: 2px solid black;
      padding: 0.2in;
      display: flex;
      flex-direction: column;
    }
    
    .header-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.15in;
    }
    
    .route-stop {
      font-size: 24pt;
      font-weight: bold;
      display: flex;
      gap: 0.2in;
    }
    
    .route-box, .stop-box {
      border: 2px solid black;
      padding: 0.05in 0.15in;
    }
    
    .barcode-section {
      text-align: center;
      margin: 0.15in 0;
    }
    
    .barcode-img {
      max-width: 400px;
      height: auto;
      margin-bottom: 10px;
    }
    
    .box-id {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin-top: 0.05in;
    }
    
    .customer-section {
      border: 2px solid black;
      padding: 0.1in;
      margin-bottom: 0.15in;
      font-size: 12pt;
    }
    
    .customer-name {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 0.06in;
    }
    
    .address-line {
      font-size: 11pt;
      margin-bottom: 0.03in;
      line-height: 1.3;
    }
    
    .cust-number {
      text-align: right;
      font-size: 11pt;
      margin-top: 0.06in;
    }
    
    .info-section {
      margin-bottom: 0.15in;
      font-size: 11pt;
    }
    
    .info-row {
      margin-bottom: 0.05in;
    }
    
    .delivery-date {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 0.05in;
    }
    
    .item-count {
      font-size: 11pt;
      margin-bottom: 0.1in;
    }
    
    .box-indicator {
      text-align: center;
      font-size: 20pt;
      font-weight: bold;
      margin-bottom: 0.15in;
    }
    
    .items-section {
      margin-top: 0.2in;
    }
    
    .items-title {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 0.1in;
      text-align: center;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.1in;
      font-size: 11pt;
      border: 1px solid black;
    }
    
    th {
      background-color: #f5f5f5;
      font-weight: bold;
      text-align: center;
      padding: 12px 10px;
      border: 1px solid black;
    }
    
    td {
      padding: 10px;
      border: 1px solid black;
    }
    
    .no-items {
      text-align: center;
      padding: 30px;
      color: #666;
      font-style: italic;
      font-size: 12pt;
    }
  </style>
</head>
<body>
  <div class="label-container">
    <!-- Header with Route/Stop -->
    <div class="header-section">
      <div class="route-stop">
        <div class="route-box">ROUTE: ${route}</div>
        <div class="stop-box">STOP: ${stop}</div>
      </div>
    </div>
    
    <!-- Main Barcode -->
    <div class="barcode-section">
      <img src="${barcodeUrl}" alt="Barcode ${boxId}" class="barcode-img" />
      <div class="box-id">${boxId}</div>
    </div>
    
    <!-- Customer Info Box -->
    <div class="customer-section">
      <div class="customer-name">${customerName}</div>
      ${customerAddress ? `<div class="address-line">${customerAddress}</div>` : ''}
      ${city || state || zip ? `
        <div class="address-line">
          ${city || ''}${city && state ? ', ' : ''}${state || ''} ${zip || ''}
        </div>
      ` : ''}
      ${custNumber ? `<div class="cust-number">Cust #${custNumber}</div>` : ''}
    </div>
    
    <!-- Info Section -->
    <div class="info-section">
      <div class="info-row">Account: ${accountNumber}</div>
      ${deliveryDate ? `<div class="delivery-date">Delivery Date: ${deliveryDate}</div>` : ''}
      ${itemCount !== undefined ? `<div class="item-count">Number of Items in Container: ${itemCount}</div>` : ''}
    </div>
    
    <!-- Box Indicator -->
    <div class="box-indicator">
      ${xOfY}
    </div>
    
    <!-- Items Table Section -->
    <div class="items-section">
      <div class="items-title">Box Items</div>
      ${boxItems.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Item Number</th>
              <th>Description</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      ` : `
        <div class="no-items">No items found in this box</div>
      `}
    </div>
  </div>
</body>
</html>
    `;
  }

  private getLabelDimensions(size: string): { width: number; height: number } {
    const dimensions: { [key: string]: { width: number; height: number } } = {
      '4x3': { width: 4, height: 3 },
      '4x6': { width: 4, height: 6 },
      '3x6': { width: 3, height: 6 },
      '3x2': { width: 3, height: 2 },
      '4x4': { width: 4, height: 4 },
      '2x2': { width: 2, height: 2 },
      '2x3': { width: 2, height: 3 },
    };
    return dimensions[size] || { width: 4, height: 6 };
  }
  /**
   * Get label dimensions in inches
   */


  /**
   * Helper function to check if invoice is created
   * Returns true if invoice is NOT created (Invoice_Number = 0)
   */
  private async isInvoiceNotCreated(orderNumber: number): Promise<boolean> {
    const orderHeader = await OrderHeader.findOne({
      where: { Order_Number: orderNumber },
      attributes: ['Invoice_Number'],
    });

    if (!orderHeader) {
      throw new AppError("Order not found", 404);
    }

    const invoiceNumber = (orderHeader as any).Invoice_Number || 0;
    return invoiceNumber === 0;
  }

  /**
   * Update item quantity in a specific box
   * Only allowed if invoice is not created (Invoice_Number = 0)
   */
  async updateItemQty(data: {
    orderNumber: number;
    itemNumber: number;
    boxId: number;
    qty: number;
  }) {
    const { orderNumber, itemNumber, boxId, qty } = data;

    // Validate inputs (allow qty to be 0)
    if (!orderNumber || !itemNumber || !boxId || qty === undefined || qty === null || qty < 0) {
      throw new AppError("Invalid input parameters", 400);
    }

    // Check if invoice is not created
    const invoiceNotCreated = await this.isInvoiceNotCreated(orderNumber);
    if (!invoiceNotCreated) {
      throw new AppError("Cannot update quantity. Invoice has already been created for this order.", 400);
    }

    // Validate box exists
    const box = await OrderPickBox.findByPk(boxId);
    if (!box) {
      throw new AppError("Box not found", 404);
    }

    // Verify box belongs to the order
    if (box.orderNumber !== orderNumber) {
      throw new AppError("Box does not belong to the specified order", 400);
    }

    // Find the specific scan record in this box
    const scan = await OrderPickScan.findOne({
      where: {
        orderNumber: orderNumber,
        itemNumber: itemNumber,
        boxId: boxId
      }
    });

    if (!scan) {
      throw new AppError("Item not found in the specified box", 404);
    }

    // Update the scan quantity
    await scan.update({
      qty: qty
    });

    // Recalculate total Quantity_Shipped for this item across all boxes
    const allScansForItem = await OrderPickScan.findAll({
      where: {
        orderNumber: orderNumber,
        itemNumber: itemNumber
      },
      attributes: ['qty']
    });

    const totalQtyShipped = allScansForItem.reduce((sum, s) => sum + (s.qty || 0), 0);

    // Update OrderDetail.Quantity_Shipped to match total from all scans
    await OrderDetail.update(
      { Quantity_Shipped: totalQtyShipped },
      {
        where: {
          Order_Number: orderNumber,
          Item_Number: itemNumber
        }
      }
    );

    return {
      success: true,
      message: `Successfully updated quantity for item ${itemNumber} in box ${boxId} to ${qty}`,
      orderNumber,
      itemNumber,
      boxId,
      qty,
      totalQtyShipped
    };
  }

  /**
   * Create new container (box/tote/drink) and move items to it
   * Only allowed if invoice is not created (Invoice_Number = 0)
   */
  async createContainerAndMoveItems(data: {
    orderNumber: number;
    containerType: 'box' | 'tote' | 'drink';
    sourceBoxId: number;
    items: Array<{ itemNumber: number; qty: number }>;
  }) {
    const { orderNumber, containerType, sourceBoxId, items } = data;

    // Validate inputs
    if (!orderNumber || !containerType || !sourceBoxId || !items || items.length === 0) {
      throw new AppError("Invalid input parameters", 400);
    }

    if (!['box', 'tote', 'drink'].includes(containerType)) {
      throw new AppError("containerType must be 'box', 'tote', or 'drink'", 400);
    }

    // Check if invoice is not created
    // const invoiceNotCreated = await this.isInvoiceNotCreated(orderNumber);
    // if (!invoiceNotCreated) {
    //   throw new AppError("Cannot create container. Invoice has already been created for this order.", 400);
    // }

    // Validate source box exists and belongs to order
    const sourceBox = await OrderPickBox.findByPk(sourceBoxId);
    if (!sourceBox) {
      throw new AppError("Source box not found", 404);
    }

    if (sourceBox.orderNumber !== orderNumber) {
      throw new AppError("Source box does not belong to the specified order", 400);
    }

    // Validate all items exist in source box and have sufficient quantity
    for (const item of items) {
      if (!item.itemNumber || !item.qty || item.qty <= 0) {
        throw new AppError(`Invalid item data: itemNumber and qty (positive) are required`, 400);
      }

      const sourceScans = await OrderPickScan.findAll({
        where: {
          boxId: sourceBoxId,
          itemNumber: item.itemNumber
        }
      });

      if (!sourceScans || sourceScans.length === 0) {
        throw new AppError(`Item ${item.itemNumber} not found in source box`, 404);
      }

      const totalSourceQty = sourceScans.reduce((sum, scan) => sum + scan.qty, 0);
      if (totalSourceQty < item.qty) {
        throw new AppError(`Insufficient quantity for item ${item.itemNumber}. Available: ${totalSourceQty}, Requested: ${item.qty}`, 400);
      }
    }

    // Create new container
    const newContainer = await OrderPickBox.create({
      orderNumber: orderNumber,
      type: containerType,
      notes: null,
      images: null,
      barcode: null,
      value: null
    });

    const newContainerId = newContainer.id;

    // Move items to new container
    for (const item of items) {
      const sourceScans = await OrderPickScan.findAll({
        where: {
          boxId: sourceBoxId,
          itemNumber: item.itemNumber
        },
        order: [['id', 'ASC']]
      });

      let remainingQty = item.qty;
      const isSubsitute = sourceScans[0]?.isSubsitute || false;

      // Check if destination container already has this item
      let existingDestinationScan = await OrderPickScan.findOne({
        where: {
          boxId: newContainerId,
          itemNumber: item.itemNumber,
          orderNumber: orderNumber
        }
      });

      // Process source scans - reduce quantity
      for (const scan of sourceScans) {
        if (remainingQty <= 0) break;

        if (scan.qty <= remainingQty) {
          // Move entire scan quantity
          const moveQty = scan.qty;
          remainingQty -= moveQty;

          if (existingDestinationScan) {
            // Update existing destination scan using database-level increment to avoid stale values
            await OrderPickScan.update(
              {
                qty: literal(`qty + ${moveQty}`)
              },
              {
                where: {
                  id: existingDestinationScan.id
                }
              }
            );
            // Re-fetch to get updated value for potential subsequent operations
            await existingDestinationScan.reload();
          } else {
            // Create new scan in destination
            existingDestinationScan = await OrderPickScan.create({
              orderNumber: orderNumber,
              itemNumber: item.itemNumber,
              qty: moveQty,
              boxId: newContainerId,
              isSubsitute: isSubsitute
            });
          }

          // Delete source scan if all moved
          await scan.destroy();
        } else {
          // Move partial quantity
          const moveQty = remainingQty;
          remainingQty = 0;

          // Update source scan - reduce quantity
          await scan.update({
            qty: scan.qty - moveQty
          });

          if (existingDestinationScan) {
            // Update existing destination scan using database-level increment to avoid stale values
            await OrderPickScan.update(
              {
                qty: literal(`qty + ${moveQty}`)
              },
              {
                where: {
                  id: existingDestinationScan.id
                }
              }
            );
            // Re-fetch to get updated value for potential subsequent operations
            await existingDestinationScan.reload();
          } else {
            // Create new scan in destination
            existingDestinationScan = await OrderPickScan.create({
              orderNumber: orderNumber,
              itemNumber: item.itemNumber,
              qty: moveQty,
              boxId: newContainerId,
              isSubsitute: isSubsitute
            });
          }
        }
      }
    }

    // Update Bundles or Totes count in Order_Header
    const allBoxes = await OrderPickBox.findAll({
      where: { orderNumber },
      attributes: ['type']
    });

    // Count bundles = number of (box + drink)
    const bundlesCount = allBoxes.filter(
      (box: any) => box.type === 'box' || box.type === 'drink'
    ).length;

    // Count totes = number of (tote)
    const totesCount = allBoxes.filter(
      (box: any) => box.type === 'tote'
    ).length;

    // Update Order_Header
    await OrderHeader.update(
      {
        Bundles: bundlesCount,
        Totes: totesCount
      },
      {
        where: {
          Order_Number: orderNumber
        }
      }
    );

    return {
      success: true,
      message: `Successfully created ${containerType} ${newContainerId} and moved items`,
      orderNumber,
      newContainerId,
      containerType,
      itemsMoved: items
    };
  }

  /**
   * Generate PDF from HTML with custom dimensions
   */
  private async generateLabelPDF(html: string, size: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      
      // Set viewport size to match label dimensions (in pixels)
      // 1 inch = 96 pixels at 96 DPI
      if (size !== 'A4') {
        const dimensions = this.getLabelDimensions(size);
        const widthPx = dimensions.width * 96;
        const heightPx = dimensions.height * 96;
        await page.setViewport({
          width: Math.round(widthPx),
          height: Math.round(heightPx),
          deviceScaleFactor: 1
        });
      } else {
        // A4 size: 8.27 x 11.69 inches = 794 x 1123 pixels
        await page.setViewport({
          width: 794,
          height: 1123,
          deviceScaleFactor: 1
        });
      }

      await page.setContent(html, { waitUntil: 'networkidle0' });

      let pdfOptions: any = {
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      };

      if (size === 'A4') {
        pdfOptions.format = 'A4';
        pdfOptions.preferCSSPageSize = false; // Use format for A4
      } else {
        const dimensions = this.getLabelDimensions(size);
        // Puppeteer expects width/height in inches (as string with "in") or pixels (as number)
        // Using inches format: "2in" instead of "144pt"
        pdfOptions.width = `${dimensions.width}in`;
        pdfOptions.height = `${dimensions.height}in`;
        
        // Use CSS @page size - this ensures the PDF metadata matches
        pdfOptions.preferCSSPageSize = true;
      }

      const pdfBuffer = await page.pdf(pdfOptions);
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate test label for a specific size or all sizes
   * Returns PDF URL(s) for sample label(s)
   * Useful for previewing label layouts
   * @param size - Optional. If provided, generates only that size. If not, generates all sizes.
   */
  async generateTestLabels(size?: '4x3' | '4x6' | '3x6' | '3x2' | '4x4' | '2x2' | '2x3' | 'A4') {
    const allSizes: Array<'4x3' | '4x6' | '3x6' | '3x2' | '4x4' | '2x2' | '2x3' | 'A4'> = [
      '4x3', '4x6', '3x6', '3x2', '4x4', '2x2', '2x3', 'A4'
    ];
    
    // If size is provided, only generate that size
    const sizesToGenerate = size ? [size] : allSizes;

    // Sample data for testing
    const sampleData = {
      date: moment().format('MM/DD/YYYY'),
      accountNumber: '12345',
      customerName: 'Test Customer Name',
      route: '10',
      stop: '5',
      xOfY: '1 of 3',
      boxId: 999,
      boxItems: [
        { itemNumber: 1001, description: 'Sample Item 1', qty: 5 },
        { itemNumber: 1002, description: 'Sample Item 2', qty: 3 },
        { itemNumber: 1003, description: 'Sample Item 3', qty: 2 },
      ]
    };

    const results: any[] = [];

    for (const size of sizesToGenerate) {
      try {
        // Generate barcode for test box
        const barcodeResult = await generateBarcodeAndUpload(sampleData.boxId.toString(), {
          folderName: 'checker/barcodes',
          type: 'code128',
          includeText: true,
          scale: 3,
          height: 12,
        });

        if (!barcodeResult.success || !barcodeResult.url) {
          results.push({
            size,
            success: false,
            error: 'Failed to generate barcode'
          });
          continue;
        }

        // Generate HTML for label using size-specific method
        const html = this.generateLabelHTMLBySize({
          size,
          route: sampleData.route,
          stop: sampleData.stop,
          barcodeUrl: barcodeResult.url,
          boxId: sampleData.boxId,
          customerName: sampleData.customerName,
          customerAddress: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          custNumber: sampleData.accountNumber,
          accountNumber: sampleData.accountNumber,
          deliveryDate: sampleData.date,
          itemCount: sampleData.boxItems.length,
          xOfY: sampleData.xOfY,
          date: sampleData.date,
          boxItems: size === 'A4' ? sampleData.boxItems : undefined,
        });

        // Generate PDF
        const pdfBuffer = await this.generateLabelPDF(html, size);

        // Upload to Azure
        const fileName = `test-label-${size}-${Date.now()}.pdf`;
        const uploadResult = await uploadFileToAzure(
          pdfBuffer,
          fileName,
          'application/pdf',
          'checker/labels'
        );

        if (uploadResult.success && uploadResult.url) {
          results.push({
            size,
            success: true,
            pdfUrl: uploadResult.url,
            dimensions: this.getLabelDimensions(size),
            description: size === 'A4' 
              ? 'A4 paper size with items table'
              : `${this.getLabelDimensions(size).width}" × ${this.getLabelDimensions(size).height}" label`
          });
        } else {
          results.push({
            size,
            success: false,
            error: 'Failed to upload PDF'
          });
        }
      } catch (error: any) {
        results.push({
          size,
          success: false,
          error: error.message || 'Unknown error'
        });
      }
    }

    return {
      success: true,
      message: size ? `Test label generated for size ${size}` : 'Test labels generated for all sizes',
      labels: results,
      totalSizes: sizesToGenerate.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }

  /**
   * Mark order as ready for delivery
   * Changes status from 'completed' to 'ready_for_delivery' in PostgreSQL
   */
  async readyForDelivery(orderNumber: number) {
    // Find the order in OrderPick
    const orderPick = await OrderPick.findOne({
      where: {
        orderNumber: orderNumber
      }
    });

    if (!orderPick) {
      throw new AppError("Order not found", 404);
    }

    // Check if order is in 'completed' status
    if (orderPick.status !== 'completed') {
      throw new AppError(`Order status must be 'completed' to mark as ready for delivery. Current status: ${orderPick.status}`, 400);
    }

    // Update status to 'ready_for_delivery'
    await orderPick.update({
      status: 'ready_for_delivery'
    });

    return {
      success: true,
      message: `Order ${orderNumber} marked as ready for delivery`,
      orderNumber,
      status: 'ready_for_delivery',
      updatedAt: orderPick.updatedAt
    };
  }

  /**
   * Get all photos for an order
   * Returns a flat array of all photos from all containers
   */
  async getOrderPhotos(orderNumber: number) {
    // Validate order exists
    const orderPick = await OrderPick.findOne({
      where: { orderNumber },
      attributes: ['orderNumber', 'images']
    });

    if (!orderPick) {
      throw new AppError("Order not found", 404);
    }

    // Get photos directly from OrderPick.images
    const images = orderPick.images || [];
    const allPhotos: string[] = [];
    
    // Handle both array of strings and array of objects
    images.forEach((img: any) => {
      if (typeof img === 'string') {
        allPhotos.push(img);
      } else if (img && img.url) {
        allPhotos.push(img.url);
      } else if (img && typeof img === 'object' && img !== null) {
        // If it's an object without url, convert to string or keep as is
        allPhotos.push(img);
      }
    });

    return {
      success: true,
      orderNumber,
      photos: allPhotos,
      totalPhotos: allPhotos.length
    };
  }

  /**
   * Update photos for an order
   * Replaces existing photos with new ones
   * Validates: min = 1 image, max = 2 images per order
   */
  async updateBoxPhotos(req: Request, orderNumber: number, boxId: number | null) {
    // Validate order exists
    const orderPick = await OrderPick.findOne({
      where: { orderNumber }
    });

    if (!orderPick) {
      throw new AppError("Order not found", 404);
    }

    // Upload new images
    let uploadedImages: string[] = [];

    if (req.files && (req.files as any).length > 0) {
      // Upload all files in parallel
      const uploadResults = await Promise.all(
        (req.files as any).map((file: any) =>
          uploadFileToAzure(file.buffer, file.originalname, file.mimetype, "checker")
        )
      );

      // Collect only successful uploads
      uploadedImages = uploadResults
        .filter(result => result.success)
        .map(result => result.url || "")
        .filter(url => url && url.trim() !== "");
    }

    // Validate image count (1-2 images per order)
    const minImages = 1;
    const maxImages = 2;

    if (uploadedImages.length < minImages) {
      throw new AppError(
        `Insufficient images. Minimum ${minImages} image required, received ${uploadedImages.length}`,
        400
      );
    }

    if (uploadedImages.length > maxImages) {
      throw new AppError(
        `Too many images. Maximum ${maxImages} images allowed, received ${uploadedImages.length}`,
        400
      );
    }

    // Update order with new images
    await orderPick.update({
      images: uploadedImages,
      notes: req.body.notes || orderPick.notes || " "
    });

    return {
      success: true,
      message: `Successfully updated photos for order ${orderNumber}`,
      orderNumber,
      photos: uploadedImages,
      photoCount: uploadedImages.length,
      notes: req.body.notes || orderPick.notes || " "
    };
  }

  /**
   * Delete a specific photo from an order
   * Removes the photo URL from the order's images array
   */
  async deleteBoxPhoto(orderNumber: number, photoUrl: string) {
    // Validate order exists
    const orderPick = await OrderPick.findOne({
      where: { orderNumber }
    });

    if (!orderPick) {
      throw new AppError("Order not found", 404);
    }

    // Get current images from order
    const currentImages = orderPick.images || [];
    
    if (!currentImages || currentImages.length === 0) {
      throw new AppError("No photos found for this order", 404);
    }

    // Filter out the photo to delete
    const filteredImages: any[] = [];
    let photoFound = false;
    
    currentImages.forEach((img: any) => {
      let imgUrl: string | null = null;
      
      if (typeof img === 'string') {
        imgUrl = img;
      } else if (img && img.url) {
        imgUrl = img.url;
      }
      
      // Only keep images that don't match the photoUrl to delete
      if (imgUrl && imgUrl === photoUrl) {
        photoFound = true;
      } else {
        // Keep images that don't match
        filteredImages.push(img);
      }
    });

    if (!photoFound) {
      throw new AppError("Photo not found in this order", 404);
    }

    // Delete the file from Azure storage
    const deleteResult = await deleteFileFromAzure(photoUrl);
    if (!deleteResult.success) {
      console.error(`Failed to delete file from Azure: ${deleteResult.error}`);
      // Continue with database deletion even if Azure deletion fails
      // This prevents orphaned database references
    }

    // Update order with filtered images
    await orderPick.update({
      images: filteredImages.length > 0 ? filteredImages : []
    });

    return {
      success: true,
      message: `Successfully deleted photo from order ${orderNumber}`,
      orderNumber,
      deletedPhotoUrl: photoUrl,
      remainingPhotos: filteredImages,
      remainingPhotoCount: filteredImages.length,
      azureDeletionSuccess: deleteResult.success,
      azureDeletionError: deleteResult.error || null
    };
  }


  async requestAllStatusOverride(orderNumber: number,query:any){
    const {status} = query; 
    
        const overrideRequests = await OverrideRequest.update({status:status}, {
          where: {
            orderNumber: orderNumber,
           
          },
        });
        return overrideRequests;
      }
}
