import { Op } from "sequelize";
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
import { getInventoryOnHand, generatePDFFromHTML } from "../utils/helper";
import { AppError } from "../utils/AppError";
import { uploadFileToAzure } from "../utils/azureUploader";
import { generateBarcodeAndUpload } from "../utils/barCodeGenerate";
import { getDefaultOrderDetailValues } from "../utils/order";
import puppeteer from 'puppeteer';
import moment from 'moment';

export class CheckerService {

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
      attributes: ['Order_Number', 'Order_Date', 'Invoice_Number', 'Checker_ID'],
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
        ['Order_Number', 'ASC'],
      ],
    });
  
    console.log(completedOrdersList, 'completedOrdersList for checker');
  
    // If no orders, return empty array
    if (completedOrdersList.length === 0) {
      return [];
    }
  
    // Get all order numbers from the completed orders list
    const orderNumbers = completedOrdersList.map((order: any) => order.Order_Number);
    
    // Get unique checker IDs and fetch checker names
    const checkerIds = Array.from(
      new Set(
        completedOrdersList
          .map((order: any) => order.Checker_ID)
          .filter((id: any) => id !== null && id !== undefined)
      )
    );
    
    // Fetch checker names from Users table
    const checkers = await Users.findAll({
      where: {
        UserNumber: { [Op.in]: checkerIds },
      },
      attributes: ['UserNumber', 'UserName'],
      raw: true,
    });
    
    // Create a map of checker ID to checker name
    const checkerMap: any = {};
    checkers.forEach((checker: any) => {
      checkerMap[checker.UserNumber] = checker.UserName;
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
      
      // Get checker name from checker map
      const checkerName = order.Checker_ID ? (checkerMap[order.Checker_ID] || null) : null;
      
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
        checkerName: checkerName
      };
    });
  
    return simplifiedOrders;
  }

  /**
   * Get items in a box by box ID
   * - Returns item details with qty from Quantity_Shipped
   */
  async getBoxItem(boxId: number) {
    // Get all scans for this box
    const scans = await OrderPickScan.findAll({
      where: { boxId },
      attributes: ['orderNumber', 'itemNumber', 'isSubsitute'],
      raw: true,
    });

    if (!scans || scans.length === 0) {
      return [];
    }

    // Get unique order numbers and item numbers
    const orderNumbers = Array.from(new Set(scans.map((s: any) => s.orderNumber)));
    const itemNumbers = Array.from(new Set(scans.map((s: any) => s.itemNumber)));

    // Get OrderDetail records to get Quantity_Shipped
    const orderDetails = await OrderDetail.findAll({
      where: {
        Order_Number: { [Op.in]: orderNumbers },
        Item_Number: { [Op.in]: itemNumbers }
      },
      attributes: ['Order_Number', 'Item_Number', 'Quantity_Shipped', 'Line_Number'],
      raw: true,
    });

    // Create a map of (orderNumber, itemNumber) -> Quantity_Shipped
    const qtyShippedMap: any = {};
    orderDetails.forEach((detail: any) => {
      const key = `${detail.Order_Number}_${detail.Item_Number}`;
      qtyShippedMap[key] = detail.Quantity_Shipped || 0;
    });

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
        const key = `${orderNumber}_${itemNumber}`;
        
        // Get Quantity_Shipped as qty
        const qty = qtyShippedMap[key] || 0;
        
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
          // Update existing destination scan
          await existingDestinationScan.update({
            qty: existingDestinationScan.qty + moveQty
          });
          // Reload to get updated value
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
          // Update existing destination scan
          await existingDestinationScan.update({
            qty: existingDestinationScan.qty + moveQty
          });
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
   * Capture photos and add notes to a box
   * - Uploads images to Azure storage
   * - Updates OrderPickBox with images and notes
   */
  async capturePhotos(req: Request, id: number) {
    let pushImage: string[] = [];

    if (req.files && (req.files as any).length > 0) {
      // Upload all files in parallel
      const uploadResults = await Promise.all(
        (req.files as any).map((file: any) =>
          uploadFileToAzure(file.buffer, file.originalname, file.mimetype, "checker")
        )
      );

      // Collect only successful uploads
      pushImage = uploadResults
        .filter(result => result.success)
        .map(result => result.url || "");
    }

    // ✅ Now update after uploads are done
    await OrderPickBox.update(
      {
        images: pushImage,
        notes: req.body.notes || " ",
      },
      {
        where: { id },
      }
    );

    return {
      success: true,
      message: "Photos captured successfully",
      images: pushImage,
      notes: req.body.notes || " "
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

    // Get order information
    const orderHeader = await OrderHeader.findOne({
      where: { Order_Number: orderNumber },
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
    const orderDate = moment((orderHeader as any).Order_Date).format('MM/DD/YYYY');

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

      // Get box items if A4 size
      let boxItems: any[] = [];
      if (size === 'A4') {
        boxItems = await this.getBoxItem(box.id);
      }

      // Generate HTML for label
      const html = this.generateLabelHTML({
        size,
        date: orderDate,
        accountNumber: accountNumber?.toString() || 'N/A',
        customerName: customerName || 'N/A',
        route: route?.toString() || 'N/A',
        stop: stop?.toString() || 'N/A',
        xOfY,
        barcodeUrl: barcodeResult.url,
        boxId: box.id,
        boxItems: boxItems,
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
  }): string {
    const { date, accountNumber, customerName, route, stop, xOfY, barcodeUrl, boxId, boxItems = [] } = data;

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
          body {
            font-family: Arial, sans-serif;
            padding: 15px;
            margin: 0;
          }
          .top-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            padding-bottom: 10px;
          }
          .date-left {
            font-size: 14px;
            font-weight: bold;
            line-height: 1.5;
          }
          .account-customer {
            text-align: right;
          }
          .account-label {
            font-size: 10px;
            display: block;
          }
          .account-value {
            font-size: 16px;
            font-weight: bold;
            display: block;
            margin-bottom: 5px;
          }
          .customer-name {
            font-size: 14px;
            display: block;
          }
          .route-stop {
            font-size: 12px;
            text-align: center;
            margin: 10px 0;
            padding: 5px 0;
          }
          .barcode-section {
            text-align: center;
            margin: 20px 0;
            padding: 15px 0;
          }
          .barcode-img {
            max-width: 300px;
            height: auto;
            margin-bottom: 10px;
          }
          .box-id-large {
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            margin: 10px 0;
          }
          .box-id-medium {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin: 5px 0;
          }
          .x-of-y {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 15px 0;
            padding: 10px 0;
          }
          .box-id-label {
            text-align: center;
            font-size: 12px;
            margin-bottom: 15px;
          }
          .items-section {
            margin-top: 20px;
          }
          .items-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            text-align: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 11px;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: center;
            padding: 10px 8px;
          }
          td {
            padding: 8px;
          }
          .no-items {
            text-align: center;
            padding: 20px;
            color: #666;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="top-section">
          <div class="date-left">${date}</div>
          <div class="account-customer">
            <span class="account-label">Account</span>
            <span class="account-value">#: ${accountNumber}</span>
            <span class="customer-name" style="margin-left: 8px;">${customerName}</span>
          </div>
        </div>
        <div class="route-stop">Route: ${route} | Stop: ${stop}</div>
        <div class="barcode-section">
          <img src="${barcodeUrl}" alt="Barcode" class="barcode-img" />
        </div>
        <div class="x-of-y">${xOfY}</div>
      
        
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
   * Update item quantity (Quantity_Shipped)
   * Only allowed if invoice is not created (Invoice_Number = 0)
   */
  async updateItemQty(data: {
    orderNumber: number;
    itemNumber: number;
    qty: number;
  }) {
    const { orderNumber, itemNumber, qty } = data;

    // Validate inputs
    if (!orderNumber || !itemNumber || !qty || qty <= 0) {
      throw new AppError("Invalid input parameters", 400);
    }

    // Check if invoice is not created
    const invoiceNotCreated = await this.isInvoiceNotCreated(orderNumber);
    if (!invoiceNotCreated) {
      throw new AppError("Cannot update quantity. Invoice has already been created for this order.", 400);
    }

    // Check if item exists in OrderDetail
    let orderDetail = await OrderDetail.findOne({
      where: {
        Order_Number: orderNumber,
        Item_Number: itemNumber
      }
    });

    // If item doesn't exist in OrderDetail, check if it exists in scans
    // This handles cases where items were scanned but OrderDetail entry is missing
    if (!orderDetail) {
      const scanExists = await OrderPickScan.findOne({
        where: {
          orderNumber: orderNumber,
          itemNumber: itemNumber
        }
      });

      if (!scanExists) {
        throw new AppError("Item not found in order", 404);
      }

      // Item exists in scans but not in OrderDetail - this shouldn't normally happen
      // But we'll allow the update by creating/updating the OrderDetail entry
      // First, try to find if there's a similar item or get default values
      const orderHeader = await OrderHeader.findOne({
        where: { Order_Number: orderNumber },
        attributes: ['Order_Number']
      });

      if (!orderHeader) {
        throw new AppError("Order not found", 404);
      }

      // Get inventory details to create OrderDetail entry
      const inventory = await Inventory.findOne({
        where: { Item_Number: itemNumber }
      });

      if (!inventory) {
        throw new AppError("Item not found in inventory", 404);
      }

      // Get the next Line_Number for this order
      const maxLineNumber = await OrderDetail.max('Line_Number', {
        where: { Order_Number: orderNumber }
      }) || 0;

      // Create OrderDetail entry with default values
      const defaultValues = getDefaultOrderDetailValues();
      await OrderDetail.create({
        ...defaultValues,
        Order_Number: orderNumber,
        Item_Number: itemNumber,
        Line_Number: (maxLineNumber as number) + 1,
        Quantity_Ordered: qty,
        Quantity_Shipped: qty,
        Sales_Category: inventory.Sales_Category || 0,
        OTP_Number: inventory.OTP_Number || 0,
        Pack: inventory.Pack || 0,
        Price: inventory.Price1 || 0,
        Price_Reference: inventory.Price1 || 0,
        Retail: inventory.Retail1 || 0,
        NetCost: inventory.NetCost || 0,
        BaseCost: inventory.BaseCost || 0,
        Invoice_Cost: inventory.Invoice_Cost || 0,
        AvgCost: inventory.AvgCost || 0,
        ItemDescription: inventory.Description || '',
        CaseWeight: inventory.CaseWeight || 0,
        CaseCount: inventory.CaseCount || 0,
        Item_Message: inventory.Item_Message || null,
        DepositAmount: inventory.DepositAmount || 0,
        Price_Subclass: inventory.Price_Subclass || 0,
        EBT: inventory.EBT || false,
        Points: inventory.Points || 0,
        STAMP_Qty: 0,
        OTP_Amount_State: 0,
        OTP_Amount_County: 0,
        OTP_Amount_City: 0
      } as any);

      return {
        success: true,
        message: `Successfully created and updated quantity for item ${itemNumber} to ${qty}`,
        orderNumber,
        itemNumber,
        qty
      };
    }

    // Update Quantity_Shipped for existing OrderDetail entry
    await OrderDetail.update(
      { Quantity_Shipped: qty },
      {
        where: {
          Order_Number: orderNumber,
          Item_Number: itemNumber
        }
      }
    );

    return {
      success: true,
      message: `Successfully updated quantity for item ${itemNumber} to ${qty}`,
      orderNumber,
      itemNumber,
      qty
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
    const invoiceNotCreated = await this.isInvoiceNotCreated(orderNumber);
    if (!invoiceNotCreated) {
      throw new AppError("Cannot create container. Invoice has already been created for this order.", 400);
    }

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
            // Update existing destination scan
            await existingDestinationScan.update({
              qty: existingDestinationScan.qty + moveQty
            });
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
            // Update existing destination scan
            await existingDestinationScan.update({
              qty: existingDestinationScan.qty + moveQty
            });
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
}
