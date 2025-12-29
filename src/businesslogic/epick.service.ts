import { col, fn, literal, Op, QueryTypes, Transaction, where } from "sequelize";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import moment from "moment";
import { OrderPick } from "../models/postgres/epickOrder.model";
import { OrderDetail } from "../models/mmsql/orderDetail.model";
import { Inventory } from "../models/mmsql/inventory.model";
import { Customer } from "../models/mmsql/customer.model";
import { IOrderPick, IOrderPickBox } from "../interfaces/request.body.interface";
import { OrderPickBox } from "../models/postgres/epickOrderBox.model";
import { generateBarcodeAndUpload } from "../utils/barCodeGenerate";
import { checkQtyDiscount, generateBarcode, getDiscount, getFirstValidPrice, getInventoryOnHand, getJurisdiction, getPrepaidTaxRate, getProductLimit, getTaxRateV1, hasDiscountedItem } from "../utils/helper";
import { InventoryUPC } from "../models/mmsql/inventoryUpc.model";
import { AppError } from "../utils/AppError";
import { OrderPickScan } from "../models/postgres/epickOrderScan.model";

import { uploadFileToAzure } from "../utils/azureUploader";
import { CustomerRoute } from "../models/mmsql/customerRoutes.model";
import { ProductImage } from "../models/postgres/product.model";
import e, { Request } from "express";
import { postgresSequelize, sequelize } from "../db";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { InventorySubstitutes } from "../models/mmsql/inventorySubsitute.model";
import SalesCategory from "../models/mmsql/salesCategory.model";
import { PriceClass } from "../models/mmsql/priceClass.model";
import InventoryStatus from "../models/mmsql/inventoryStatus.model";
import Setting from "../models/postgres/setting.model";
import { Distributor } from "../models/mmsql/distributor.model";
import { OptionDefsValues } from "../models/mmsql/optionDefsValue.model";
import { getDefaultOrderDetailValues } from "../utils/order";
import { PassScanItem } from "../models/postgres/passScanItem.model";
import EpickSetting from "../models/postgres/epickSetting.model";
import { WebUsers } from "../models/postgres/users.model";
import { EpickUser } from "../models/postgres/epickUser.model";
import { EpickConfirmation } from "../models/postgres/epickConfirmation.model";
import { OverrideRequest } from "../models/postgres/overrideRequest.model";
import { sendMultiFCMNotification } from "../utils/sentNotification";
import { RetailerDevice } from "../models/postgres/device.model";
import { Notifications } from "../models/postgres/notification.model";
import { RecordLock } from "../models/mmsql/recordLocks.model";
import { ItemLimit } from "../models/postgres/itemLimit.model";


export class EpickService {

  /**
   * Helper function: Get order clause for item sorting
   * @param itemSortBy - Sort type: 'section_location' (Category+Section+Location) | 'alphabetically' | 'item_number' | 'short_number' | 'line_number'
   * @returns Sequelize order clause
   */
  private getOrderItemSortOrder(itemSortBy: string): any[] {
    switch (itemSortBy) {
      case 'section_location':
        // Sort by Sales_Category ASC first, then Section ASC, then Location ASC within each section
        // NULL/empty/0 values for Section and Location appear last
        return [
          [{ model: Inventory, as: 'inventory' }, 'Sales_Category', 'ASC'],
          [
            literal(`CASE 
              WHEN [inventory].[Section] IS NULL OR [inventory].[Section] = '' 
              THEN 'ZZZZZ' 
              ELSE [inventory].[Section] 
            END`),
            'ASC'
          ],
          [
            literal(`CASE 
              WHEN [inventory].[Location] IS NULL OR [inventory].[Location] = 0 
              THEN 999999 
              ELSE [inventory].[Location] 
            END`),
            'ASC'
          ]
        ];
      case 'alphabetically':
        // Sort by Description ASC (numeric prefixes naturally come before alphabetic)
        return [
          [{ model: Inventory, as: 'inventory' }, 'Description', 'ASC']
        ];
      case 'item_number':
        // Sort by Item_Number ASC
        return [['Item_Number', 'ASC']];
      case 'short_number':
        // Sort by Sequence ASC from Inventory table
        return [
          [{ model: Inventory, as: 'inventory' }, 'Sequence', 'ASC']
        ];
      case 'line_number':
      default:
        // Default: Sort by Line_Number ASC
        return [['Line_Number', 'ASC']];
    }
  }

  /**
   * Helper function: Get all unique categories in an order
   * @param orderNumber - Order number
   * @returns Array of unique category numbers
   */
  private async getOrderCategories(orderNumber: number): Promise<number[]> {
    const orderDetails = await OrderDetail.findAll({
      where: {
        Order_Number: orderNumber
      },
      attributes: ['Item_Number'],
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['Sales_Category'],
          required: true
        }
      ],
      raw: false
    });

    const categories = new Set<number>();
    orderDetails.forEach((detail: any) => {
      const inventory = detail.inventory;
      if (inventory && inventory.Sales_Category) {
        categories.add(inventory.Sales_Category);
      }
    });

    return Array.from(categories);
  }

  /**
   * Helper function: Check if all categories in an order are completed
   * @param orderNumber - Order number
   * @returns true if all categories have at least one completed confirmation
   */
  private async areAllCategoriesCompleted(orderNumber: number): Promise<boolean> {
    // Get all categories in the order
    const orderCategories = await this.getOrderCategories(orderNumber);
    
    if (orderCategories.length === 0) {
      return false; // No categories found, can't be completed
    }

    // Get all completed confirmations for this order
    const completedConfirmations = await EpickConfirmation.findAll({
      where: {
        orderNumber: orderNumber,
        status: 'completed'
      },
      attributes: ['category'],
      raw: true
    });

    // Get all completed categories (flatten all category arrays from confirmations)
    const completedCategories = new Set<number>();
    completedConfirmations.forEach((confirmation: any) => {
      const cats = confirmation.category || [];
      cats.forEach((cat: number) => completedCategories.add(cat));
    });

    // Check if every category in the order has at least one completed confirmation
    const allCompleted = orderCategories.every((orderCat: number) => 
      completedCategories.has(orderCat)
    );

    return allCompleted;
  }

  // async  getOrder() {
  //     const start = moment().startOf('day').toDate();
  //     const end   = moment().endOf('day').toDate();

  //     const todayOrder = await OrderHeader.findAll({
  //      where: {
  //        Order_Date: { [Op.gte]: start, [Op.lte]: end },
  //      },
  //      attributes: ['Order_Number', 'Order_Date'],
  //      include: [
  //        {
  //          model: Customer,
  //          as: 'customer',
  //          attributes: ['C_Number', 'C_Name'],
  //          include: [
  //            {
  //              model: CustomerRoute,
  //              as: 'Routes',
  //              attributes: ['Route_Number', 'Stop_Number'],
  //              required: false,
  //            },
  //          ],
  //          required: false,
  //        },
  //        {
  //          model: OrderDetail,
  //          as: 'orderDetails',
  //          attributes: ['Order_Number', 'Line_Number', 'Quantity_Ordered', 'Pack', 'CaseCount'],
  //          required: false,
  //          include: [
  //            {
  //              model: Inventory,
  //              as: 'inventory',
  //              attributes: ['Item_Number', 'Description'],
  //              required: false,
  //            },
  //          ],
  //        },
  //      ],
  //      order: [
  //        ['Order_Number', 'ASC'], // Order orders themselves
  //        [{ model: OrderDetail, as: 'orderDetails' }, 'Line_Number', 'ASC'], // Order orderDetails by Line_Number
  //      ],
  //    });


  //    console.log(todayOrder,'todayOrder');
  //      const acceptedOrders = await OrderPick.findAll({
  //        where: {
  //          createdAt: { [Op.gte]: start, [Op.lte]: end },
  //          status: {
  //             [Op.or]: ['in_progress', 'completed']
  //           }


  //        },
  //        attributes: ['orderNumber'],
  //      });

  //      const acceptedOrderNumbers = acceptedOrders.map((o: any) => String(o.orderNumber));

  //      const notAcceptedOrders = todayOrder.filter(
  //        (order: any) => !acceptedOrderNumbers.includes(String(order.Order_Number))
  //      );

  //      return notAcceptedOrders;
  //    }
       
       async getOrder(userId: number, query: PaginationOptions = {}) {
        // Parse pagination parameters
        let page = Number(query.page) || 1;
        let limit = Number(query.limit) || 10;
        
        // Validate pagination parameters
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;
        if (limit > 100) limit = 100; // Max 100 items per page
        
        const offset = (page - 1) * limit;
        // Step 0: Fetch user preferences (order_type and shortby) and categories from epick_user
        const user = await EpickUser.findOne({
          where: { id: userId },
          attributes: ['order_type', 'shortby', 'category'],
          raw: true,
        });
        
        const orderType = (user as any)?.order_type || 'order_number';
        const shortBy = (user as any)?.shortby || 'Des';
        const userCategories = (user as any)?.category || [];
        
        console.log(`User ${userId} preferences: order_type=${orderType}, shortby=${shortBy}, categories=${userCategories}`);
        console.log('User object:', user);

        // If user has no categories assigned, return empty paginated response
        if (userCategories.length === 0) {
          return {
            data: [],
            pagination: {
              page: page,
              limit: limit,
              total: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false
            }
          };
        }
        
        // Step 1: Get completed confirmations with their categories
        // We need to exclude orders where user's categories (that are IN THE ORDER) are already completed
        const completedConfirmations = await EpickConfirmation.findAll({
          where: {
            status: 'completed'
          },
          attributes: ['orderNumber', 'category'],
          raw: true,
        });
        
        // Create a map: orderNumber -> array of completed categories
        const completedCategoriesByOrder: { [key: number]: number[] } = {};
        completedConfirmations.forEach((conf: any) => {
          const orderNum = conf.orderNumber;
          const categories = conf.category || [];
          if (!completedCategoriesByOrder[orderNum]) {
            completedCategoriesByOrder[orderNum] = [];
          }
          categories.forEach((cat: number) => {
            if (!completedCategoriesByOrder[orderNum].includes(cat)) {
              completedCategoriesByOrder[orderNum].push(cat);
            }
          });
        });
        
        // Find orders where ALL user's categories (that exist in the order) are already completed
        // We check by verifying that all items in the user's categories have Confirmed = 1
        const ordersWithAllUserCategoriesCompleted: number[] = [];
        
        // Get all unique order numbers from completed confirmations
        const completedOrderNumbers = new Set(
          completedConfirmations.map((conf: any) => conf.orderNumber)
        );
        
        // For each order with completed confirmations, check if user's categories in that order are all completed
        for (const orderNum of completedOrderNumbers) {
          // Get all categories that exist in this order
          const orderCategories = await this.getOrderCategories(orderNum);
          
          // Find which of the user's categories are actually in this order
          const userCategoriesInOrder = userCategories.filter((userCat: number) => 
            orderCategories.includes(userCat)
          );
          
          // If user has no categories in this order, skip (user shouldn't see this order anyway)
          if (userCategoriesInOrder.length === 0) {
            continue;
          }
          
          // Check if ALL items in the user's categories (that are in this order) are confirmed
          // Query: Get count of items in user's categories vs count of confirmed items in user's categories
          const categoryCheckResult = await sequelize.query(
            `SELECT 
              COUNT(*) as totalItems,
              SUM(CASE WHEN od.Confirmed = 1 THEN 1 ELSE 0 END) as confirmedItems
            FROM Order_Detail od
            INNER JOIN Inventory inv ON od.Item_Number = inv.Item_Number
            WHERE od.Order_Number = :orderNumber
            AND inv.Sales_Category IN (:userCategoriesInOrder)`,
            {
              replacements: { 
                orderNumber: orderNum,
                userCategoriesInOrder: userCategoriesInOrder 
              },
              type: QueryTypes.SELECT,
              raw: true,
            }
          ) as any[];
          
          if (categoryCheckResult.length > 0) {
            const result = categoryCheckResult[0];
            const totalItems = Number(result.totalItems) || 0;
            const confirmedItems = Number(result.confirmedItems) || 0;
            
            // If all items in user's categories are confirmed, exclude this order
            if (totalItems > 0 && totalItems === confirmedItems) {
              ordersWithAllUserCategoriesCompleted.push(orderNum);
            }
          }
        }
        
        console.log(ordersWithAllUserCategoriesCompleted.length, 'orders where user categories (in order) are already completed');
        
        // Step 1a: Get orders that are locked in RecordLock but NOT in epick_confirmation
        // These should be excluded (locked by ERP only, not started by picker)
        const lockedOrdersInRecordLock = await RecordLock.findAll({
          attributes: ['Lock_Number'],
          raw: true,
        });
        
        const lockedOrderNumbers = lockedOrdersInRecordLock
          .map((lock: any) => lock?.Lock_Number)
          .filter((v: any) => v !== null && v !== undefined)
          .map((v: any) => Number(v));
        
        // Get orders that ARE in epick_confirmation (in_progress OR completed)
        // If an order has ANY confirmation, it means a picker has worked on it, so it should NOT be excluded
        const ordersInEpickConfirmation = await EpickConfirmation.findAll({
          attributes: ['orderNumber'],
          raw: true,
        });
        
        const epickConfirmationOrderNumbers = ordersInEpickConfirmation
          .map((o: any) => o?.orderNumber)
          .filter((v: any) => v !== null && v !== undefined)
          .map((v: any) => Number(v));
        
        // Orders locked ONLY in RecordLock (not in epick_confirmation at all) should be excluded
        // If order has ANY epick_confirmation (in_progress or completed), it means a picker has worked on it, so don't exclude
        const lockedOnlyInRecordLock = lockedOrderNumbers.filter(
          (orderNum: number) => !epickConfirmationOrderNumbers.includes(orderNum)
        );
        
        // Step 1.5: Get orders that have items matching user's categories
        // This ensures users only see orders they can actually work on
        // Only include orders where user's category items are NOT confirmed (still scannable)
        const ordersWithMatchingCategories = await sequelize.query(
          `SELECT DISTINCT od.Order_Number 
           FROM Order_Detail od
           INNER JOIN Inventory inv ON od.Item_Number = inv.Item_Number
           WHERE inv.Sales_Category IN (:userCategories)
           AND (od.Confirmed = 0 OR od.Confirmed IS NULL)`,
          {
            replacements: { userCategories: userCategories },
            type: QueryTypes.SELECT,
            raw: true,
          }
        ) as any[];

        let matchingOrderNumbers = ordersWithMatchingCategories
          .map((row: any) => row.Order_Number)
          .filter((v: any) => v !== null && v !== undefined)
          .map((v: any) => Number(v));

        console.log(`Found ${matchingOrderNumbers.length} orders with unconfirmed items matching user categories ${userCategories}`);

        // Also include orders where user has active (in_progress) confirmation
        // These should always be visible, even if items are confirmed
        const userActiveConfirmations = await EpickConfirmation.findAll({
          where: {
            pickerUserId: userId,
            status: 'in_progress'
          },
          attributes: ['orderNumber'],
          raw: true
        });

        const userActiveOrderNumbers = userActiveConfirmations
          .map((conf: any) => conf.orderNumber)
          .filter((v: any) => v !== null && v !== undefined)
          .map((v: any) => Number(v));

        // Merge both lists (orders with unconfirmed items + user's active orders)
        const allMatchingOrderNumbers = new Set([...matchingOrderNumbers, ...userActiveOrderNumbers]);
        matchingOrderNumbers = Array.from(allMatchingOrderNumbers);

        console.log(`After including user's active orders: ${matchingOrderNumbers.length} total orders`);

        // Pre-filter matchingOrderNumbers to exclude locked and completed orders
        // This simplifies the SQL query by reducing Op.in/Op.notIn complexity
        if (lockedOnlyInRecordLock.length > 0) {
          matchingOrderNumbers = matchingOrderNumbers.filter(
            (orderNum: number) => !lockedOnlyInRecordLock.includes(orderNum)
          );
        }
        
        if (ordersWithAllUserCategoriesCompleted.length > 0) {
          matchingOrderNumbers = matchingOrderNumbers.filter(
            (orderNum: number) => !ordersWithAllUserCategoriesCompleted.includes(orderNum)
          );
        }

        // If no orders have items in user's categories after filtering, return empty paginated response
        if (matchingOrderNumbers.length === 0) {
          return {
            data: [],
            pagination: {
              page: page,
              limit: limit,
              total: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false
            }
          };
        }
        
        // Step 2: Query Order_Header (MSSQL) with simplified filters
        // Filter: Order_Updated = 0 AND Invoice_Number = 0
        // Include only pre-filtered orders (already excludes locked and completed)
        // Note: matchingOrderNumbers already ensures orders have Order_Detail items, so no need for literal clause
        const headerWhere: any = {
          [Op.and]: [
            { Order_Updated: false },
            { Invoice_Number: 0 },
            // Only include pre-filtered orders (simplified - single Op.in condition)
            { Order_Number: { [Op.in]: matchingOrderNumbers } }
          ]
        };
        
        console.log(headerWhere, 'headerWhere');
        
        // Step 2a: Get order numbers that have ANY item with Confirmed != 0 (using SQL subquery - fast)
        const ordersWithConfirmedNotZero = await sequelize.query(
          `SELECT DISTINCT Order_Number 
           FROM Order_Detail 
           WHERE Confirmed = 1`,
          {
            type: QueryTypes.SELECT,
            raw: true,
          }
        ) as any[];
        
        const orderNumbersWithConfirmedNotZero = new Set(
          ordersWithConfirmedNotZero
            .map((row: any) => row.Order_Number)
            .filter((v: any) => v !== null && v !== undefined)
            .map((v: any) => Number(v))
        );
        
        console.log(orderNumbersWithConfirmedNotZero.size, 'orders with Confirmed != 0');
        
        // Step 2b: Determine sorting order based on user preferences
        let orderBy: any[] = [];
        if (orderType === 'order_number') {
          // Sort by Order_Number DESC (latest first) - ignore shortby
          orderBy = [['Order_Number', 'DESC']];
          console.log('Will sort by Order_Number DESC in SQL query');
        } else {
          // For qty_number, we'll sort after fetching and calculating totalQty
          // Don't sort in SQL - we'll sort in JavaScript after calculating totalQty
          orderBy = []; // No SQL sorting - will sort by qty in JavaScript
          console.log('Will sort by totalQty in JavaScript after calculation');
        }
        
        // Step 2c: Get total count of orders (for pagination)
        // Use same simplified where condition (matchingOrderNumbers already pre-filtered)
        const totalCount = await OrderHeader.count({
          where: headerWhere,
        });

        // Step 2d: Fetch orders with pagination (NO Order_Detail include - much faster!)
        const orders = await OrderHeader.findAll({
          where: headerWhere,
          attributes: ['Order_Number', 'Order_Date'],
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
          order: orderBy,
          limit: limit,
          offset: offset,
        });
      
        console.log(orders.length, 'final orders fetched');
        
        // Step 2d: Calculate totalQty for each order (always calculate for response)
        const orderNumbers = orders.map((order: any) => order.Order_Number);
        let totalQtyMap: any = {};
        
        if (orderNumbers.length > 0) {
          // Always calculate totalQty for response
          const totalQtyResults = await sequelize.query(
            `SELECT Order_Number, SUM(CAST(Quantity_Ordered AS FLOAT)) as totalQty
             FROM Order_Detail
             WHERE Order_Number IN (:orderNumbers)
             GROUP BY Order_Number`,
            {
              replacements: { orderNumbers: orderNumbers },
              type: QueryTypes.SELECT,
              raw: true,
            }
          ) as any[];
          
          totalQtyResults.forEach((row: any) => {
            totalQtyMap[row.Order_Number] = parseFloat(row.totalQty) || 0;
          });
          
          console.log(`Calculated totalQty for ${totalQtyResults.length} orders`);
          console.log('Sample totalQty values:', Object.entries(totalQtyMap).slice(0, 5));
        }
      
        // Step 2e: Get ALL epick_confirmation data (both in_progress and completed) for orders
        const orderNumbersForConfirmation = orders.map((order: any) => order.Order_Number);
        const allEpickConfirmations = await EpickConfirmation.findAll({
          where: {
            orderNumber: { [Op.in]: orderNumbersForConfirmation }
          },
          include: [
            {
              model: EpickUser,
              as: 'picker',
              attributes: ['id', 'firstName', 'lastName', 'email'],
              required: false
            }
          ],
          raw: false,
        });
        
        // Separate confirmations by status
        const inProgressConfirmations = allEpickConfirmations.filter((c: any) => c.status === 'in_progress');
        const completedConfirmationsForResponse = allEpickConfirmations.filter((c: any) => c.status === 'completed');
        
        // Get RecordLock for these orders
        const recordLocksForResponse = await RecordLock.findAll({
          where: {
            Lock_Number: { [Op.in]: orderNumbersForConfirmation },
            Lock_Type: 0
          },
          attributes: ['Lock_Number'],
          raw: true
        });
        const lockedOrderNumbersSet = new Set(
          recordLocksForResponse.map((lock: any) => Number(lock.Lock_Number))
        );
        
        // Get orders that have ANY confirmation (in_progress or completed)
        const ordersWithConfirmations = new Set(
          allEpickConfirmations.map((c: any) => c.orderNumber)
        );
        
        // Collect all unique category numbers from all confirmations
        const allCategoryNumbers = new Set<number>();
        allEpickConfirmations.forEach((confirmation: any) => {
          const categories = confirmation.category || [];
          categories.forEach((cat: number) => allCategoryNumbers.add(cat));
        });

        // Fetch category names from SalesCategory table
        const categoryMap: { [key: number]: string } = {};
        if (allCategoryNumbers.size > 0) {
          const categoryNumbersArray = Array.from(allCategoryNumbers);
          const salesCategories = await SalesCategory.findAll({
            where: {
              Sales_Category: { [Op.in]: categoryNumbersArray }
            },
            attributes: ['Sales_Category', 'Category_Desc'],
            raw: true
          });

          salesCategories.forEach((cat: any) => {
            categoryMap[cat.Sales_Category] = cat.Category_Desc || `Category ${cat.Sales_Category}`;
          });

          // For any category numbers not found in database, use fallback
          categoryNumbersArray.forEach((catNum: number) => {
            if (!categoryMap[catNum]) {
              categoryMap[catNum] = `Category ${catNum}`;
            }
          });
        }
        
        // Create map of orderNumber to pickers (in_progress only for display)
        const orderPickersMap: any = {};
        inProgressConfirmations.forEach((confirmation: any) => {
          const orderNum = confirmation.orderNumber;
          if (!orderPickersMap[orderNum]) {
            orderPickersMap[orderNum] = [];
          }
          const picker = confirmation.picker;
          if (picker) {
            // Map category numbers to names using database lookup
            const categoryNames = (confirmation.category || []).map((cat: number) => 
              categoryMap[cat] || `Category ${cat}`
            );
            
            orderPickersMap[orderNum].push({
              userId: picker.id,
              userName: `${picker.firstName} ${picker.lastName}`,
              email: picker.email,
              categories: confirmation.category,
              categoryNames: categoryNames,
              status: 'in_progress'
            });
          }
        });
        
        // Create map of completed pickers
        const completedPickersMap: any = {};
        completedConfirmationsForResponse.forEach((confirmation: any) => {
          const orderNum = confirmation.orderNumber;
          if (!completedPickersMap[orderNum]) {
            completedPickersMap[orderNum] = [];
          }
          const picker = confirmation.picker;
          if (picker) {
            const categoryNames = (confirmation.category || []).map((cat: number) => 
              categoryMap[cat] || `Category ${cat}`
            );
            
            completedPickersMap[orderNum].push({
              userId: picker.id,
              userName: `${picker.firstName} ${picker.lastName}`,
              email: picker.email,
              categories: confirmation.category,
              categoryNames: categoryNames,
              status: 'completed'
            });
          }
        });
        
        // Get current user's confirmations
        const userConfirmations = allEpickConfirmations.filter((c: any) => c.pickerUserId === userId);
        const userConfirmationMap: any = {};
        userConfirmations.forEach((conf: any) => {
          userConfirmationMap[conf.orderNumber] = conf;
        });
        
        // Step 3: Format response with proper note logic
        let result = orders.map((order: any) => {
          const orderNum = order.Order_Number;
          const orderData: any = {
            Order_Number: orderNum,
            Order_Date: order.Order_Date,
            totalQty: totalQtyMap[orderNum] || 0,
            customer: order.customer ? {
              C_Number: order.customer.C_Number,
              C_Name: order.customer.C_Name,
              C_Address: order.customer.C_Address || null,
              C_City: order.customer.C_City || null,
              C_State: order.customer.C_State || null,
              C_Zip: order.customer.C_Zip || null,
              Routes: order.customer.Routes || []
            } : null
          };
          
          // Determine note based on RecordLock and confirmations
          const hasRecordLock = lockedOrderNumbersSet.has(orderNum);
          const hasAnyConfirmation = ordersWithConfirmations.has(orderNum);
          const userConfirmation = userConfirmationMap[orderNum];
          
          // Logic: "pending from erp" only if RecordLock exists but NO confirmation exists
          if (hasRecordLock && !hasAnyConfirmation) {
            orderData.note = 'pending from erp';
          } else if (userConfirmation) {
            // User has a confirmation
            if (userConfirmation.status === 'completed') {
              orderData.note = 'completed by this user';
            }
            // If in_progress, no special note needed
          } else if (completedPickersMap[orderNum] && completedPickersMap[orderNum].length > 0) {
            // Other pickers completed, but user hasn't started
            const completedPickerNames = completedPickersMap[orderNum]
              .map((p: any) => p.userName)
              .join(', ');
            orderData.note = `completed by ${completedPickerNames}`;
          }
          
          // Add picker information (in_progress pickers)
          if (orderPickersMap[orderNum] && orderPickersMap[orderNum].length > 0) {
            orderData.isBeingPicked = true;
            orderData.pickers = orderPickersMap[orderNum];
          } else {
            orderData.isBeingPicked = false;
            orderData.pickers = [];
          }
          
          // Add completed pickers info
          if (completedPickersMap[orderNum] && completedPickersMap[orderNum].length > 0) {
            if (!orderData.pickers) {
              orderData.pickers = [];
            }
            orderData.pickers = [...orderData.pickers, ...completedPickersMap[orderNum]];
          }
          
          return orderData;
        });
        
        // Step 4: Sort by totalQty if order_type is 'qty_number'
        if (orderType === 'qty_number') {
          console.log(`Sorting by totalQty with shortby=${shortBy}`);
          
          // Normalize shortby to handle case variations
          const normalizedShortBy = shortBy?.toLowerCase();
          
          if (normalizedShortBy === 'des') {
            // Sort DESC: highest totalQty first
            result.sort((a: any, b: any) => {
              const qtyA = a.totalQty || 0;
              const qtyB = b.totalQty || 0;
              return qtyB - qtyA; // DESC: b - a
            });
            console.log('Sorted by totalQty DESC (highest quantity first)');
          } else if (normalizedShortBy === 'asc') {
            // Sort ASC: lowest totalQty first
            result.sort((a: any, b: any) => {
              const qtyA = a.totalQty || 0;
              const qtyB = b.totalQty || 0;
              return qtyA - qtyB; // ASC: a - b
            });
            console.log('Sorted by totalQty ASC (lowest quantity first)');
          } else {
            // Default to DESC if shortby is invalid
            console.log(`Unknown shortby value: ${shortBy}, defaulting to DESC`);
            result.sort((a: any, b: any) => {
              const qtyA = a.totalQty || 0;
              const qtyB = b.totalQty || 0;
              return qtyB - qtyA;
            });
          }
          
          // Log first few orders after sorting for debugging
          console.log('First 5 orders after sorting by qty:', result.slice(0, 5).map((o: any) => ({
            Order_Number: o.Order_Number,
            totalQty: o.totalQty
          })));
        } else {
          console.log(`order_type is '${orderType}', keeping SQL sort order (Order_Number DESC)`);
        }
      
        console.log(result.length, 'final orders to return');
        
        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;

        return {
          data: result,
          pagination: {
            page: page,
            limit: limit,
            total: totalCount,
            totalPages: totalPages,
            hasNextPage: hasNextPage,
            hasPreviousPage: hasPreviousPage
          }
        };
      }

  async getOrderHistory(id: number) {
    const data = await OrderPick.findAll({
      where: {
        pickerUserId: id
      }
    })
    return data;
  }

  async acceptOrder(body: IOrderPick, id: number) {

    // Get epick user with categories
    const isUserExist = await EpickUser.findOne({
      where: { id: id, status: true, isActive: true, },
      attributes: { exclude: ['password'] } // Exclude password for security
    })
    if (!isUserExist) {
      throw new AppError('User not found', 404);
    }

    // Get user's categories
    const userCategories = isUserExist.category || [];
    
    // Check if order is already locked in RecordLock
    const existingLock = await RecordLock.findOne({
      where: {
        Lock_Number: body.orderNumber,
        Lock_Type: 0
      }
    });

    // Get all epick_confirmation records for this order (both in_progress and completed)
    const allConfirmations = await EpickConfirmation.findAll({
      where: {
        orderNumber: body.orderNumber
      }
    });

    // Separate confirmations by status
    const inProgressConfirmations = allConfirmations.filter(conf => conf.status === 'in_progress');
    const completedConfirmations = allConfirmations.filter(conf => conf.status === 'completed');

    // If locked in RecordLock but NOT in epick_confirmation at all, it's locked by ERP only - block it
    // If order has ANY confirmation (in_progress or completed), it means a picker has worked on it via our system
    if (existingLock && allConfirmations.length === 0) {
      throw new AppError('Order is locked by ERP system', 400);
    }

    // Check if user's categories are already completed for this order
    if (completedConfirmations.length > 0) {
      // Get all completed categories for this order
      const completedCategories = new Set<number>();
      completedConfirmations.forEach((conf: any) => {
        const cats = conf.category || [];
        cats.forEach((cat: number) => completedCategories.add(cat));
      });

      // Check if any of user's categories are already completed
      const userCategoriesCompleted = userCategories.some((userCat: number) => 
        completedCategories.has(userCat)
      );

      if (userCategoriesCompleted) {
        throw new AppError(
          'This order is already completed for your assigned categories',
          400
        );
      }
    }

    // Check category overlap with existing epick_confirmation records (in_progress)
    const existingConfirmations = inProgressConfirmations;
    
    // Check if any existing confirmation has overlapping categories
    for (const confirmation of existingConfirmations) {
      const existingCategories = confirmation.category || [];
      
      // Check for overlap (any common category)
      const hasOverlap = userCategories.some((cat: number) => existingCategories.includes(cat));
      
      if (hasOverlap) {
        // Get picker info for error message
        const picker = await EpickUser.findByPk(confirmation.pickerUserNumber, {
          attributes: ['firstName', 'lastName']
        });
        const pickerName = picker ? `${picker.firstName} ${picker.lastName}` : 'another picker';
        
        // Map categories to names
        const categoryNames = existingCategories.map((cat: number) => {
          if (cat === 12) return 'CIG';
          if (cat === 10) return 'General';
          if (cat === 20) return 'Kratoms';
          return `Category ${cat}`;
        });
        
        throw new AppError(
          `This order is already being picked by ${pickerName} (${categoryNames.join(', ')}) in your category`,
          400
        );
      }
    }

    // Check if OrderPick already exists (first picker already created it)
    let existingOrderPick = await OrderPick.findOne({
      where: {
        orderNumber: body.orderNumber
      }
    });

    let data;
    
    // Only create OrderPick if it doesn't exist (first picker)
    if (!existingOrderPick) {
      let outOfStock = 0

      const orderItem = await OrderDetail.findAll({
        where: {
          Order_Number: body.orderNumber
        },
        attributes: ['Item_Number']
      })
      for (const item of orderItem) {
        const inventoryOnHand = await getInventoryOnHand(item.Item_Number)
        if (inventoryOnHand <= 0) {
          console.log(item.Item_Number, 'item.Item_Number')
          outOfStock++
        }
      }
      console.log(outOfStock, 'outOfStock');

      // Create OrderPick (only first picker creates this)
      data = await OrderPick.create({
        orderNumber: body.orderNumber,
        customerNumber: body.customerNumber,
        notes: body.notes,
        totalLines: body.totalLines,
        startedAt: moment().toDate(),
        totalQty: body.totalQty,
        scannedLines: body.scannedLines,
        OutOfStockItem: outOfStock,
        scannedQty: body.scannedQty,
        pickerUserNumber: Number(isUserExist.userNumber ?? 0),
        pickerUserId: id,
      });
      
      // Create RecordLock in MSSQL (only first picker creates this)
      if (!existingLock) {
        await RecordLock.create({
          Lock_Type: 0,
          Lock_Number: Number(body.orderNumber),
          Lock_User: Number(isUserExist.userNumber ?? 0),
          Lock_Workstation: 0
        });
      }
      
      // Update OrderDetail Quantity_Shipped to 0 (only first picker does this)
      await OrderDetail.update(
        { Quantity_Shipped: 0 },
        {
          where: {
            Order_Number: body.orderNumber,
            Confirmed: 0
          },
        }
      );
    } else {
      // Subsequent pickers use existing OrderPick
      data = existingOrderPick;
    }
    
    // Always create epick_confirmation record (every picker creates this)
    await EpickConfirmation.create({
      orderNumber: body.orderNumber,
      pickerUserNumber: id, // Use user's id, not userNumber (foreign key references epick_user.id)
      pickerUserId: id,
      category: userCategories,
      status: 'in_progress',
      startedAt: moment().toDate(),
    });
    

        // Get pin and allowSingleScan from EpickSetting
        const epickSetting :any = await EpickSetting.findOne({
          order: [['createdAt', 'DESC']] // Get the latest setting
        });

        // Get allowSingleScan value - default to true if not found or null
        const allowSingleScanValue = epickSetting?.allowSingleScan ?? epickSetting?.dataValues?.allowSingleScan ?? true;

        return {
          data: data,
          isUserExist: isUserExist,
          pin: (epickSetting as any)?.pin || null,
          allowSingleScan: allowSingleScanValue
        };
    }

  async addOrderBox(body: IOrderPickBox) {
    const barcode = await generateBarcode(body.orderNumber);
    const res = await generateBarcodeAndUpload(barcode, {
      folderName: 'barcodes/orders',
      type: 'code128',
      includeText: true,
      scale: 4,
      height: 14,
    });

    if (res.success) {
      const data = await OrderPickBox.create({
        orderNumber: body.orderNumber,
        type: body.type,
        value: barcode,
        barcode: res.url || '',
      })
      return data;
    }
    else {
      throw new AppError("Failed to generate barcode", 400);
    }


  }

  async getOrderBox(orderNumber: number) {
    const data = await OrderPickBox.findAll({
      where: {
        orderNumber: orderNumber,
      },
    });
    return data;
  }

    async getOrderItem(orderNumber: number, userId: number) {
      // Get user's categories and item_sort_by preference
      const user = await EpickUser.findOne({
        where: { id: userId },
        attributes: ['category', 'item_sort_by'],
        raw: true,
      });
      
      const userCategories = (user as any)?.category || [];
      const itemSortBy = (user as any)?.item_sort_by || 'line_number';

      // Get customer number from order header
      const orderHeader = await OrderHeader.findOne({
        where: {
          Order_Number: orderNumber
        },
        attributes: ['C_Number']
      });

      const customerNumber = (orderHeader as any)?.C_Number || null;

      const data = await OrderDetail.findAll({
        where: {
          Order_Number: orderNumber,
          [Op.and]: [
            // Ensure Quantity_Ordered is greater than Quantity_Shipped
            { Quantity_Ordered: { [Op.gt]: sequelize.col("Quantity_Shipped") } },
            // Only show items where Confirmed = 0 (pending from ERP)
            {
              [Op.or]: [
                { Confirmed: false },
                { Confirmed: 0 },
                { Confirmed: null }
              ]
            }
          ],
        },
        attributes: [
          "Order_Number",
          "Line_Number",
          "Quantity_Ordered",
          "Pack",
          "CaseCount",
          "Quantity_Shipped",
          "Item_Number",
          "Confirmed",
        ],
        include: [
          {
            model: Inventory,
            as: "inventory",
            attributes: ["Item_Number", "Description", "Section", "Location", "Sales_Category", "Sequence"],
            where: userCategories.length > 0 ? {
              Sales_Category: { [Op.in]: userCategories }
            } : undefined,
            required: userCategories.length > 0,
            include: [
              {
                model: InventoryUPC,
                as: "UPCList",
                attributes: ["UPC_Number"],
                required: false, // optional relation, it will work even if there are no matching records
              },
              {
                model: SalesCategory,
                as: "SalesCategory",
                attributes: ["Category_Desc"],
                required: false,
              },
            ],
          },
        ],
        order: this.getOrderItemSortOrder(itemSortBy),
      });
      
      // Get all unique item numbers from order items
      const itemNumbers = Array.from(new Set(data.map((item: any) => {
        const itemData = item.dataValues || item;
        return itemData.Item_Number;
      })));

      // Query ItemLimits table for all items (batch query for efficiency)
      const itemLimits = await ItemLimit.findAll({
        where: {
          Item_Number: { [Op.in]: itemNumbers },
          isActive: true
        },
        attributes: ['Item_Number', 'markAsBundle'],
        raw: true
      });

      // Create a map: itemNumber -> markAsBundle
      const itemLimitMap: { [key: number]: boolean } = {};
      itemLimits.forEach((limit: any) => {
        itemLimitMap[limit.Item_Number] = limit.markAsBundle || false;
      });

        const finalData = await Promise.all(data.map(async (e: any) => {
            let item = e.dataValues || null;

            const productImage = await ProductImage.findOne({
                where: {
                    product_number: item.Item_Number.toString(),
                    isAllow: true
                },
            });

            const inventoryOnHand = await getInventoryOnHand(item.Item_Number)

            // Check if item has a substitute product
            let substituteProduct = null;
            const substitute = await InventorySubstitutes.findOne({
              where: { Item_Number: item.Item_Number },
              attributes: ['Item_Number_Substitute', 'Item_Number', 'Substitute_Rule', 'Substitute_Text'],
              logging: false,
            });

            if (substitute && customerNumber) {
              try {
                const subItemNumber = substitute.get('Item_Number_Substitute') as number;
                
                // Get user jurisdiction
                const userJurisdiction = await getJurisdiction(customerNumber);
                
                // Get warehouse settings
                let wareHouseSetting: any = await Setting.findOne({});
                wareHouseSetting = wareHouseSetting?.dataValues || null;
                
                // Get substitute product details
                const subProduct = await Inventory.findOne({
                  attributes: [
                    'Pack', 'Description', 'Item_Number', 'CaseCount', 'UOM',
                    'Price1', 'Price2', 'BaseCost', 'Invoice_Cost', 'AvgCost',
                    'NetCost', 'eCommerce', 'I_Inactive', 'Date_Created',
                    'OTP_Number', 'Price_Subclass', 'UnitOunces'
                  ],
                  where: {
                    I_Inactive: false,
                    ShortOrderForm: true,
                    Item_Number: subItemNumber,
                  },
                  include: [
                    {
                      model: SalesCategory,
                      as: 'SalesCategory',
                      attributes: ['Category_Desc','Sales_Category'],
                      required: false,
                    },
                    {
                      model: PriceClass,
                      as: 'PriceClass',
                      attributes: ['Class_Desc'],
                      required: false,
                    },
                    {
                      model: InventoryStatus,
                      as: 'inventoryStatus',
                      attributes: ['Inventory_OnHand'],
                      required: false,
                    },
                    {
                      model: InventoryUPC,
                      as: 'UPCList',
                      attributes: ['UPC_Number'],
                      where: { Status: 0 },
                      required: false,
                    },
                  ],
                  logging: false,
                });

                if (subProduct) {
                  const e = subProduct as any;
                  
                  // Get pricing
                  let price = await getDiscount(subItemNumber, customerNumber);
                  if (!price) {
                    price = await getFirstValidPrice(e);
                  }
                  
                  const subInventoryOnHand = (await getInventoryOnHand(subItemNumber)) || 0;
                  
                  let taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
                  taxRate = Math.ceil(taxRate * 100) / 100;
                  
                  const productImages = await ProductImage.findAll({
                    where: {
                      product_number: e.Item_Number.toString(),
                      isAllow: true,
                    },
                    logging: false,
                  });
                  
                  const productImage = productImages?.[0] ?? null;
                  
                  const isDiscounted = await hasDiscountedItem(e.Item_Number, e.Price_Subclass);
                  const productLimit = await getProductLimit(e.Item_Number);
                  
                  let allowToOrder = true;
                  if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && subInventoryOnHand <= 0) {
                    allowToOrder = false;
                  }
                  let prepaidTaxRate = 0
                  if(userJurisdiction !=null && e.salesCategory){
                    prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, e?.salesCategory?.Sales_Category);
                  }
                  substituteProduct = {
                    Pack: e.Pack,
                    Description: e.Description,
                    Item_Number: e.Item_Number,
                    CaseCount: e.CaseCount,
                    UOM: e.UOM,
                    isDiscounted,
                    Price1: e.Price1,
                    Tax_Rate: taxRate,
                    OTP_Number: e.OTP_Number,
                    price: Math.ceil(price * 100) / 100,
                    priceWithTax: Math.ceil((price + taxRate) * 100) / 100,
                    BaseCost: e.BaseCost,
                    Invoice_Cost: e.Invoice_Cost,
                    AvgCost: e.AvgCost,
                    NetCost: e.NetCost,
                    hasProductLimit: !!productLimit,
                    productLimit,
                    UPCList: e.UPCList,
                    hasPrepaidTaxRate: prepaidTaxRate ? true : false,
                    prepaidTaxRate: prepaidTaxRate,
                    Inventory_OnHand: subInventoryOnHand,
                    UnitOunces: e.UnitOunces,
                    allowToOrder,
                    showTheInventoryStock: wareHouseSetting?.retailer?.showStock || false,
                    showLowStock: wareHouseSetting?.retailer?.showStock
                      ? false
                      : subInventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                    showWithOutPrice: wareHouseSetting?.retailer?.showWithOutPrice || false,
                    SalesCategory: e.SalesCategory?.Category_Desc || null,
                    PriceClass: e.PriceClass?.Class_Desc || null,
                    showDistributorImage: productImage?.isAllow ?? false,
                    distributorImage: productImage?.img_url || null,
                    masterImage: `${process.env.AZUREIMAGESERVER}${e.UPCList?.[0]?.UPC_Number ?? ''}.jpg`,
                    SubstituteFrom: substitute.get('Item_Number'),
                    SubstituteTo: subItemNumber,
                    Substitute_Rule: substitute.get('Substitute_Rule') ?? null,
                    Substitute_Text: substitute.get('Substitute_Text') ?? null,
                  };
                }
              } catch (error) {
                // If substitute product fetch fails, just continue without it
                console.error('Error fetching substitute product:', error);
              }
            }

            // Get markAsBundle from ItemLimits (default to false if not found)
            const markAsBundle = itemLimitMap[item.Item_Number] || false;

            return {
                ...item,
                inventoryOnHand: inventoryOnHand,
                masterImage: `${process.env.AZUREIMAGESERVER}${item?.inventory?.UPCList?.[0]?.UPC_Number || ''}.jpg`,
                isDistributorImageShow: productImage?.isAllow ?? false,
                distributorImage: productImage?.img_url || null,
                substituteProduct: substituteProduct,
                SalesCategory: item?.inventory?.SalesCategory?.Category_Desc || null,
                markAsBundle: markAsBundle
            }

        }))
        return finalData;
    }

    async getOrderItemFirst(orderNumber: number, userId: number) {
      // Get user's categories
      const user = await EpickUser.findOne({
        where: { id: userId },
        attributes: ['category'],
        raw: true,
      });
      
      const userCategories = (user as any)?.category || [];

      // If user has no categories assigned, return empty array
      if (userCategories.length === 0) {
        return [];
      }

      // Get customer number from order header
      const orderHeader = await OrderHeader.findOne({
        where: {
          Order_Number: orderNumber
        },
        attributes: ['C_Number']
      });

      const customerNumber = (orderHeader as any)?.C_Number || null;

      // Get only the first item (lowest Line_Number) filtered by user's sales categories
      const data = await OrderDetail.findAll({
        where: {
          Order_Number: orderNumber,
        },
        attributes: [
          "Order_Number",
          "Line_Number",
          "Quantity_Ordered",
          "Pack",
          "CaseCount",
          "Quantity_Shipped",
          "Item_Number",
          "Confirmed",
        ],
        include: [
          {
            model: Inventory,
            as: "inventory",
            attributes: ["Item_Number", "Description", "Section", "Location", "Sales_Category"],
            where: userCategories.length > 0 ? {
              Sales_Category: { [Op.in]: userCategories }
            } : undefined,
            required: userCategories.length > 0,
            include: [
              {
                model: InventoryUPC,
                as: "UPCList",
                attributes: ["UPC_Number"],
                required: false,
              },
              {
                model: SalesCategory,
                as: "SalesCategory",
                attributes: ["Category_Desc"],
                required: false,
              },
            ],
          },
        ],
        order: [["Line_Number", "ASC"]],
        limit: 1, // Only get the first item
      });

      if (!data || data.length === 0) {
        return [];
      }

      const finalData = await Promise.all(data.map(async (e: any) => {
        let item = e.dataValues || null;

        const productImage = await ProductImage.findOne({
          where: {
            product_number: item.Item_Number.toString(),
            isAllow: true
          },
        });

        const inventoryOnHand = await getInventoryOnHand(item.Item_Number);

        // Check if item has a substitute product
        let substituteProduct = null;
        const substitute = await InventorySubstitutes.findOne({
          where: { Item_Number: item.Item_Number },
          attributes: ['Item_Number_Substitute', 'Item_Number', 'Substitute_Rule', 'Substitute_Text'],
          logging: false,
        });

        if (substitute && customerNumber) {
          try {
            const subItemNumber = substitute.get('Item_Number_Substitute') as number;
            
            // Get user jurisdiction
            const userJurisdiction = await getJurisdiction(customerNumber);
            
            // Get warehouse settings
            let wareHouseSetting: any = await Setting.findOne({});
            wareHouseSetting = wareHouseSetting?.dataValues || null;
            
            // Get substitute product details
            const subProduct = await Inventory.findOne({
              attributes: [
                'Pack', 'Description', 'Item_Number', 'CaseCount', 'UOM',
                'Price1', 'Price2', 'BaseCost', 'Invoice_Cost', 'AvgCost',
                'NetCost', 'eCommerce', 'I_Inactive', 'Date_Created',
                'OTP_Number', 'Price_Subclass', 'UnitOunces'
              ],
              where: {
                I_Inactive: false,
                ShortOrderForm: true,
                Item_Number: subItemNumber,
              },
              include: [
                {
                  model: SalesCategory,
                  as: 'SalesCategory',
                  attributes: ['Category_Desc','Sales_Category'],
                  required: false,
                },
                {
                  model: PriceClass,
                  as: 'PriceClass',
                  attributes: ['Class_Desc'],
                  required: false,
                },
                {
                  model: InventoryStatus,
                  as: 'inventoryStatus',
                  attributes: ['Inventory_OnHand'],
                  required: false,
                },
                {
                  model: InventoryUPC,
                  as: 'UPCList',
                  attributes: ['UPC_Number'],
                  where: { Status: 0 },
                  required: false,
                },
              ],
              logging: false,
            });

            if (subProduct) {
              const e = subProduct as any;
              
              // Get pricing
              let price = await getDiscount(subItemNumber, customerNumber);
              if (!price) {
                price = await getFirstValidPrice(e);
              }
              
              const subInventoryOnHand = (await getInventoryOnHand(subItemNumber)) || 0;
              
              let taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
              taxRate = Math.ceil(taxRate * 100) / 100;
              
              const productImages = await ProductImage.findAll({
                where: {
                  product_number: e.Item_Number.toString(),
                  isAllow: true,
                },
                logging: false,
              });
              
              const productImage = productImages?.[0] ?? null;
              
              const isDiscounted = await hasDiscountedItem(e.Item_Number, e.Price_Subclass);
              const productLimit = await getProductLimit(e.Item_Number);
              
              let allowToOrder = true;
              if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && subInventoryOnHand <= 0) {
                allowToOrder = false;
              }
              let prepaidTaxRate = 0
              if(userJurisdiction !=null && e.salesCategory){
                prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, e?.salesCategory?.Sales_Category);
              }
              substituteProduct = {
                Pack: e.Pack,
                Description: e.Description,
                Item_Number: e.Item_Number,
                CaseCount: e.CaseCount,
                UOM: e.UOM,
                isDiscounted,
                Price1: e.Price1,
                Tax_Rate: taxRate,
                OTP_Number: e.OTP_Number,
                price: Math.ceil(price * 100) / 100,
                priceWithTax: Math.ceil((price + taxRate) * 100) / 100,
                BaseCost: e.BaseCost,
                Invoice_Cost: e.Invoice_Cost,
                AvgCost: e.AvgCost,
                NetCost: e.NetCost,
                hasProductLimit: !!productLimit,
                productLimit,
                UPCList: e.UPCList,
                hasPrepaidTaxRate: prepaidTaxRate ? true : false,
                prepaidTaxRate: prepaidTaxRate,
                Inventory_OnHand: subInventoryOnHand,
                UnitOunces: e.UnitOunces,
                allowToOrder,
                showTheInventoryStock: wareHouseSetting?.retailer?.showStock || false,
                showLowStock: wareHouseSetting?.retailer?.showStock
                  ? false
                  : subInventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                showWithOutPrice: wareHouseSetting?.retailer?.showWithOutPrice || false,
                SalesCategory: e.SalesCategory?.Category_Desc || null,
                PriceClass: e.PriceClass?.Class_Desc || null,
                showDistributorImage: productImage?.isAllow ?? false,
                distributorImage: productImage?.img_url || null,
                masterImage: `${process.env.AZUREIMAGESERVER}${e.UPCList?.[0]?.UPC_Number ?? ''}.jpg`,
                SubstituteFrom: substitute.get('Item_Number'),
                SubstituteTo: subItemNumber,
                Substitute_Rule: substitute.get('Substitute_Rule') ?? null,
                Substitute_Text: substitute.get('Substitute_Text') ?? null,
              };
            }
          } catch (error) {
            // If substitute product fetch fails, just continue without it
            console.error('Error fetching substitute product:', error);
          }
        }

        return {
          ...item,
          inventoryOnHand: inventoryOnHand,
          masterImage: `${process.env.AZUREIMAGESERVER}${item?.inventory?.UPCList?.[0]?.UPC_Number || ''}.jpg`,
          isDistributorImageShow: productImage?.isAllow ?? false,
          distributorImage: productImage?.img_url || null,
          substituteProduct: substituteProduct,
          SalesCategory: item?.inventory?.SalesCategory?.Category_Desc || null
        };
      }));

      return finalData;
    }

  async addProductInBox(data: any) {

    const product = await InventoryUPC.findOne({
      where: {
        UPC_Number: data.UPC_Number
      }
    })
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const isProductInOrder = await OrderDetail.findOne({
      where: {
        Order_Number: data.orderNumber,
        Item_Number: product.Item_Number
      }
    })
    if (!isProductInOrder) {
      throw new AppError("Product not found in order", 404);
    }
    const findProductInBox = await OrderPickScan.findOne({
      where: {
        orderNumber: data.orderNumber,
        itemNumber: product.Item_Number,
        boxId: data.boxId
      }
    })

    console.log(findProductInBox, 'findProductInBox');

    if (findProductInBox) {
      await findProductInBox.update({
        qty: Number(findProductInBox.qty) + Number(data.qty)
      })

      await OrderPick.update(
        {
          scannedQty: literal(`"scannedQty" + ${Number(data.qty)}`)
        },
        {
          where: {
            orderNumber: data.orderNumber
          }
        }
      );

      // Update Quantity_Shipped - ensure item is not confirmed
      // Use MSSQL syntax [column] instead of PostgreSQL "column"
      const updateResult1 = await OrderDetail.update(
        {
          Quantity_Shipped: literal(`[Quantity_Shipped] + ${Number(data.qty)}`)
        },
        {
          where: {
            Order_Number: data.orderNumber,
            Item_Number: product.Item_Number,
            Confirmed: 0
          }
        }
      );

      if (updateResult1[0] === 0) {
        console.warn(`Warning: Quantity_Shipped update affected 0 rows for Order ${data.orderNumber}, Item ${product.Item_Number}. Item may be confirmed.`);
      }

    } else {

      console.log(data, 'data--->');
      await OrderPickScan.create({
        orderNumber: Number(data.orderNumber),
        itemNumber: Number(product.Item_Number),
        qty: Number(data.qty),
        boxId: data.boxId,
        isSubsitute: data.isSubsitute || false
      })

      // Update Quantity_Shipped - ensure item is not confirmed
      // Use MSSQL syntax [column] instead of PostgreSQL "column"
      const updateResult2 = await OrderDetail.update(
        {
          Quantity_Shipped: literal(`[Quantity_Shipped] + ${Number(data.qty)}`)
        },
        {
          where: {
            Order_Number: data.orderNumber,
            Item_Number: product.Item_Number,
            Confirmed: 0
          }
        }
      );

      if (updateResult2[0] === 0) {
        console.warn(`Warning: Quantity_Shipped update affected 0 rows for Order ${data.orderNumber}, Item ${product.Item_Number}. Item may be confirmed.`);
      }
      await OrderPick.update(
        {
          scannedLines: literal(`"scannedLines" + 1`),
          scannedQty: literal(`"scannedQty" + ${Number(data.qty)}`)
        },
        {
          where: {
            orderNumber: data.orderNumber
          }
        }
      );
    }







    return true;
  }

    async addProductsInBoxBatch(data: { 
        products: Array<{ UPC_Number: string; qty: number; boxId: number; isSubsitute?: boolean }>, 
        orderNumber: number,
        passItems?: Array<{ itemNumber: number; note?: string }> // Items to pass (skip) with optional manager note
    }, userId: number) {
        const { products = [], orderNumber, passItems = [] } = data;

        // Validate order exists
        const orderPick = await OrderPick.findOne({
            where: { orderNumber }
        });
        if (!orderPick) {
            throw new AppError("Order not found", 404);
        }

        // Step 1: Get all UPCs and map to Item_Numbers (only if products are provided)
        const upcNumbers = products && products.length > 0 ? products.map(p => p.UPC_Number) : [];
        const upcToItemMap = new Map<string, number>(); // Map<UPC_Number, Item_Number>
        
        if (upcNumbers.length > 0) {
            const inventoryUPCs = await InventoryUPC.findAll({
                where: {
                    UPC_Number: { [Op.in]: upcNumbers }
                }
            });

            for (const upc of inventoryUPCs) {
                upcToItemMap.set(upc.UPC_Number, upc.Item_Number);
            }

            // Validate all UPCs exist
            const foundUPCs = new Set(inventoryUPCs.map(u => u.UPC_Number));
            const missingUPCs = upcNumbers.filter(upc => !foundUPCs.has(upc));
            if (missingUPCs.length > 0) {
                throw new AppError(`Products not found for UPCs: ${missingUPCs.join(', ')}`, 404);
            }
        }

        // Step 2: Separate substitute and regular items, validate items are in the order (only if products exist)
        const itemNumbers = products && products.length > 0 ? Array.from(upcToItemMap.values()) : [];
        const originalItemNumbers = new Set<number>(); // Items scanned with isSubsitute=true (these are the ORIGINAL items)
        const originalToSubstituteMap = new Map<number, number>(); // Map<originalItemNumber, substituteItemNumber>
        
        // Check which products are marked as substitutes
        // When isSubsitute = true, the scanned item is the ORIGINAL, and we need to find its SUBSTITUTE from the database
        if (products && products.length > 0) {
            for (const product of products) {
                if (product.isSubsitute) {
                    const originalItemNumber = upcToItemMap.get(product.UPC_Number);
                    if (originalItemNumber) {
                        originalItemNumbers.add(originalItemNumber);
                    }
                }
            }
        }

        // Find all substitute items for the scanned original items
        // Query: WHERE Item_Number IN (scanned original items) to get their substitutes
        if (originalItemNumbers.size > 0) {
            const substitutes = await InventorySubstitutes.findAll({
                where: {
                    Item_Number: { [Op.in]: Array.from(originalItemNumbers) }
                }
            });

            // Map original items to their substitute items
            for (const substitute of substitutes) {
                const originalItem = Number(substitute.Item_Number);
                const substituteItem = Number(substitute.Item_Number_Substitute);
                originalToSubstituteMap.set(originalItem, substituteItem);
            }

            // Validate all scanned original items have substitute mappings
            const missingMappings = Array.from(originalItemNumbers).filter(
                origItem => !originalToSubstituteMap.has(origItem)
            );
            if (missingMappings.length > 0) {
                // Log the query that was attempted for debugging
                console.log(`[DEBUG] Attempted to find substitutes for items: ${Array.from(originalItemNumbers).join(', ')}`);
                console.log(`[DEBUG] Found substitutes for: ${Array.from(originalToSubstituteMap.keys()).join(', ')}`);
                console.log(`[DEBUG] Missing mappings for: ${missingMappings.join(', ')}`);
                throw new AppError(`Original items ${missingMappings.join(', ')} do not have valid substitute mappings in Inventory_Substitutes table. Please check that records exist where Item_Number = ${missingMappings.join(' OR Item_Number = ')}`, 404);
            }
        }

        // Get order items - include both regular items and original items (for substitutes, we validate the original is in the order)
        // Only validate if we have products to check
        if (itemNumbers.length > 0) {
            const itemsToCheck = itemNumbers.filter(itemNum => !originalItemNumbers.has(itemNum));
            if (itemsToCheck.length > 0) {
                const orderItems = await OrderDetail.findAll({
                    where: {
                        Order_Number: orderNumber,
                        Item_Number: { [Op.in]: itemsToCheck }
                    }
                });

                const orderItemNumbers = new Set(orderItems.map(oi => oi.Item_Number));
                const missingItems = itemsToCheck.filter(itemNum => !orderItemNumbers.has(itemNum));
                if (missingItems.length > 0) {
                    throw new AppError(`Products not found in order: Item Numbers ${missingItems.join(', ')}`, 404);
                }
            }
        }

        // Validate that all original items (that have substitutes) are in the order
        if (originalItemNumbers.size > 0) {
            for (const originalItem of originalItemNumbers) {
                const originalInOrder = await OrderDetail.findOne({
                    where: {
                        Order_Number: orderNumber,
                        Item_Number: originalItem
                    }
                });
                if (!originalInOrder) {
                    const substituteItem = originalToSubstituteMap.get(originalItem);
                    throw new AppError(`Original item ${originalItem} (substitute: ${substituteItem}) not found in order`, 404);
                }
            }
        }

        // Step 3: Group products by (orderNumber, itemNumber, boxId) to handle duplicates
        // For substitutes: use the substitute item number (not the original scanned item)
        const scanMap = new Map<string, { itemNumber: number; qty: number; isSubsitute: boolean }>();
        // Key format: `${itemNumber}_${boxId}`

        if (products && products.length > 0) {
            for (const product of products) {
            const scannedItemNumber = upcToItemMap.get(product.UPC_Number);
            if (!scannedItemNumber) continue;
            
            // If this is a substitute, use the substitute item number from the map
            // Otherwise, use the scanned item number
            let itemNumberToUse = scannedItemNumber;
            if (product.isSubsitute) {
                const substituteItem = originalToSubstituteMap.get(scannedItemNumber);
                if (substituteItem) {
                    itemNumberToUse = substituteItem;
                } else {
                    // This shouldn't happen if validation passed, but handle it gracefully
                    throw new AppError(`No substitute found for original item ${scannedItemNumber}`, 404);
                }
            }
            
            const key = `${itemNumberToUse}_${product.boxId}`;
            
            if (scanMap.has(key)) {
                const existing = scanMap.get(key)!;
                existing.qty += Number(product.qty);
            } else {
                scanMap.set(key, {
                    itemNumber: itemNumberToUse,
                    qty: Number(product.qty),
                    isSubsitute: product.isSubsitute || false
                });
            }
        }

        // Step 4: Process all scans - check existing and create/update (only if we have products)
        const existingScans = scanMap.size > 0 ? await OrderPickScan.findAll({
            where: {
                orderNumber,
                [Op.or]: Array.from(scanMap.entries()).map(([key, value]) => ({
                    itemNumber: value.itemNumber,
                    boxId: Number(key.split('_')[1])
                }))
            }
        }) : [];

        const existingScanMap = new Map<string, OrderPickScan>();
        for (const scan of existingScans) {
            const key = `${scan.itemNumber}_${scan.boxId}`;
            existingScanMap.set(key, scan);
        }

        const scansToCreate: Array<{ orderNumber: number; itemNumber: number; qty: number; boxId: number; isSubsitute: boolean }> = [];
        const scansToUpdate: Array<{ scan: OrderPickScan; qty: number }> = [];
        const itemQtyMap = new Map<number, number>(); // Track total qty per item for OrderDetail update

        for (const [key, scanData] of scanMap.entries()) {
            const boxId = Number(key.split('_')[1]);
            const existingScan = existingScanMap.get(key);

            if (existingScan) {
                // Update existing scan
                scansToUpdate.push({
                    scan: existingScan,
                    qty: scanData.qty
                });
            } else {
                // Create new scan
                scansToCreate.push({
                    orderNumber: Number(orderNumber),
                    itemNumber: scanData.itemNumber,
                    qty: scanData.qty,
                    boxId: boxId,
                    isSubsitute: scanData.isSubsitute
                });
            }

            // Accumulate qty per item
            const currentQty = itemQtyMap.get(scanData.itemNumber) || 0;
            itemQtyMap.set(scanData.itemNumber, currentQty + scanData.qty);
        }

        // Step 5: Handle PassScanItem for substitute items and passed items (before processing scans)
        const passScanItemsToCreate: Array<{ orderNumber: number; itemNumber: number; userId: number; note?: string | null }> = [];
        const originalItemsToReset = new Set<number>();
        const passedItemsToReset = new Set<number>();

        // Create reverse map: substitute -> original (for looking up original from substitute)
        const substituteToOriginalMap = new Map<number, number>();
        for (const [original, substitute] of originalToSubstituteMap.entries()) {
            substituteToOriginalMap.set(substitute, original);
        }

        // Collect all original item numbers that need PassScanItem (from substitutes)
        // scanData.itemNumber is now the substitute item, so we need to find the original
        for (const [key, scanData] of scanMap.entries()) {
            if (scanData.isSubsitute) {
                const originalItemNumber = substituteToOriginalMap.get(scanData.itemNumber);
                if (originalItemNumber) {
                    originalItemsToReset.add(originalItemNumber);
                }
            }
        }

        // Collect items to be passed (skipped) with their notes
        const passItemsMap = new Map<number, string | null>(); // Map<itemNumber, note>
        for (const passItem of passItems) {
            passedItemsToReset.add(passItem.itemNumber);
            passItemsMap.set(passItem.itemNumber, passItem.note || null);
        }

        // Combine all items that need PassScanItem (substitutes + passed items)
        const allItemsForPassScan = new Set([...originalItemsToReset, ...passedItemsToReset]);

        // Fetch existing PassScanItems in one query
        const existingPassScanItems = allItemsForPassScan.size > 0 
            ? await PassScanItem.findAll({
                where: {
                    orderNumber,
                    itemNumber: { [Op.in]: Array.from(allItemsForPassScan) },
                    userId
                }
            })
            : [];

        const existingPassScanMap = new Map(existingPassScanItems.map(psi => [psi.itemNumber, psi]));

        // Create PassScanItem entries for original items (substitutes) that don't have one yet
        for (const originalItemNumber of originalItemsToReset) {
            if (!existingPassScanMap.has(originalItemNumber)) {
                passScanItemsToCreate.push({
                    orderNumber: Number(orderNumber),
                    itemNumber: originalItemNumber,
                    userId: Number(userId),
                    note: null // No note for substitute items (auto-created)
                });
            }
        }

        // Validate passed items exist in the order
        if (passedItemsToReset.size > 0) {
            const passedItemsInOrder = await OrderDetail.findAll({
                where: {
                    Order_Number: orderNumber,
                    Item_Number: { [Op.in]: Array.from(passedItemsToReset) }
                }
            });
            const passedItemsInOrderSet = new Set(passedItemsInOrder.map(oi => oi.Item_Number));
            const invalidPassedItems = Array.from(passedItemsToReset).filter(
                itemNum => !passedItemsInOrderSet.has(itemNum)
            );
            if (invalidPassedItems.length > 0) {
                throw new AppError(`Passed items not found in order: Item Numbers ${invalidPassedItems.join(', ')}`, 404);
            }
        }

        // Create PassScanItem entries for passed items (with manager notes if provided)
        const passScanItemsToUpdate: Array<{ passScanItem: PassScanItem; note: string }> = [];
        for (const passedItemNumber of passedItemsToReset) {
            const existingPassScan = existingPassScanMap.get(passedItemNumber);
            const note = passItemsMap.get(passedItemNumber) || null;
            
            if (existingPassScan) {
                // Update existing PassScanItem with manager note if provided
                if (note && !existingPassScan.note) {
                    passScanItemsToUpdate.push({ passScanItem: existingPassScan, note });
                }
            } else {
                // Create new PassScanItem with note
                passScanItemsToCreate.push({
                    orderNumber: Number(orderNumber),
                    itemNumber: passedItemNumber,
                    userId: Number(userId),
                    note: note
                });
            }
        }

        // Step 6: Create OrderDetail records for substitute items (like addSubsituteProduct does)
        const substituteOrderDetailsToCreate: any[] = [];
        const substituteOrderDetailsToUpdate: Array<{ orderDetail: OrderDetail; data: any }> = [];
        const substituteItemQtyMap = new Map<number, number>(); // Map<substituteItemNumber, totalQty>
        
        // Collect substitute items and their quantities
        for (const [key, scanData] of scanMap.entries()) {
            if (scanData.isSubsitute) {
                const currentQty = substituteItemQtyMap.get(scanData.itemNumber) || 0;
                substituteItemQtyMap.set(scanData.itemNumber, currentQty + scanData.qty);
            }
        }
        
        // Get Inventory details for all substitute items
        if (substituteItemQtyMap.size > 0) {
            const substituteItemNumbers = Array.from(substituteItemQtyMap.keys());
            const substituteProducts = await Inventory.findAll({
                where: {
                    Item_Number: { [Op.in]: substituteItemNumbers }
                }
            });
            
            const productMap = new Map(substituteProducts.map(p => [p.Item_Number, p]));
            
            // Get OptionDefsValues for STAMP_Qty
            const optionDefsValues = await OptionDefsValues.findOne({
                where: { ID_Number: 4003 }
            });
            
            // Get original order details to get line numbers and pricing
            const originalOrderDetails = await OrderDetail.findAll({
                where: {
                    Order_Number: orderNumber,
                    Item_Number: { [Op.in]: Array.from(originalItemsToReset) }
                }
            });
            
            const originalDetailMap = new Map(originalOrderDetails.map(od => [od.Item_Number, od]));
            
            // Check if substitute items already have OrderDetail records
            const existingSubstituteOrderDetails = await OrderDetail.findAll({
                where: {
                    Order_Number: orderNumber,
                    Item_Number: { [Op.in]: substituteItemNumbers }
                }
            });
            
            const existingSubstituteDetailMap = new Map(existingSubstituteOrderDetails.map(od => [od.Item_Number, od]));
            
            // Get max Line_Number for this order to assign new line numbers if needed
            // Use raw SQL query to avoid GROUP BY issues with aggregate functions
            const [maxLineNumberResult] = await sequelize.query(
                `SELECT MAX(Line_Number) AS maxLine FROM Order_Detail WHERE Order_Number = :orderNumber`,
                {
                    replacements: { orderNumber },
                    type: QueryTypes.SELECT
                }
            ) as any[];
            const maxLineNumber = maxLineNumberResult?.maxLine || 0;
            let nextLineNumber = maxLineNumber + 1;
            
            // Create or update OrderDetail records for each substitute item
            for (const [substituteItemNumber, totalQty] of substituteItemQtyMap.entries()) {
                const product = productMap.get(substituteItemNumber);
                if (!product) {
                    throw new AppError(`Substitute product ${substituteItemNumber} not found in Inventory`, 404);
                }
                
                // Find the original item this substitute replaces
                const originalItemNumber = substituteToOriginalMap.get(substituteItemNumber);
                if (!originalItemNumber) {
                    throw new AppError(`Original item not found for substitute ${substituteItemNumber}`, 404);
                }
                
                // Get original order detail for pricing reference
                const originalDetail = originalDetailMap.get(originalItemNumber);
                if (!originalDetail) {
                    throw new AppError(`Original item ${originalItemNumber} not found in order details`, 404);
                }
                
                // Get pricing - use original price or calculate from product
                const price = originalDetail.Price || product.Price1 || 0;
                const taxRate = originalDetail.OTP_Amount_State || 0;
                
                // Check if OrderDetail already exists for this substitute item
                const existingSubstituteDetail = existingSubstituteDetailMap.get(substituteItemNumber);
                
                const orderDetailData = {
                    Sales_Category: product.Sales_Category,
                    OTP_Number: product.OTP_Number,
                    Quantity_Ordered: Number(totalQty),
                    Quantity_Shipped: Number(totalQty),
                    Pack: product.Pack,
                    UOM: product.UOM,
                    Price: Number(price),
                    Price_Reference: Number(price),
                    Retail: product.Retail1,
                    NetCost: product.NetCost,
                    BaseCost: product.BaseCost,
                    Invoice_Cost: product.Invoice_Cost,
                    AvgCost: product.AvgCost,
                    OTP_Amount_State: Number(taxRate ?? 0),
                    OTP_Amount_County: 0,
                    OTP_Amount_City: 0,
                    Item_Message: null,
                    DepositAmount: product.DepositAmount,
                    Price_Subclass: product.Price_Subclass,
                    OffInvoice_Amount: 0,
                    OffInvoice_OffCost: 0,
                    OffInvoice_Special: false,
                    EBT: product.EBT,
                    Points: product.Points,
                    STAMP_Qty: optionDefsValues?.Option_Value || 0,
                    ItemDescription: product.Description,
                    CaseWeight: product.CaseWeight,
                    CaseCount: product.CaseCount,
                };
                
                if (existingSubstituteDetail) {
                    // Update existing OrderDetail record
                    substituteOrderDetailsToUpdate.push({
                        orderDetail: existingSubstituteDetail,
                        data: orderDetailData
                    });
                } else {
                    // Create new OrderDetail record with next available Line_Number
                    const orderDetail = {
                        Order_Number: orderNumber,
                        Item_Number: substituteItemNumber,
                        Line_Number: nextLineNumber++,
                        ...orderDetailData
                    };
                    
                    const finalObject = {
                        ...getDefaultOrderDetailValues(),
                        ...orderDetail
                    };
                    
                    substituteOrderDetailsToCreate.push(finalObject);
                }
            }
        }
        
        // Step 7: Execute all updates in parallel
        const substituteItemNumbersSet = new Set(Array.from(substituteToOriginalMap.keys()));
        
        // Disable triggers before creating OrderDetail records for substitutes
        if (substituteOrderDetailsToCreate.length > 0) {
            await sequelize.query('DISABLE TRIGGER ALL ON Order_Detail');
        }
        
        try {
            await Promise.all([
            // Create PassScanItem entries for substitute original items and passed items
            passScanItemsToCreate.length > 0 ? PassScanItem.bulkCreate(passScanItemsToCreate) : Promise.resolve(),
            // Update existing PassScanItem entries with manager notes
            ...passScanItemsToUpdate.map(({ passScanItem, note }) =>
                passScanItem.update({ note })
            ),
            // Reset Quantity_Shipped to 0 for original items that have substitutes
            ...Array.from(originalItemsToReset).map(originalItemNumber =>
                OrderDetail.update(
                    {
                        Quantity_Shipped: 0
                    },
                    {
                        where: {
                            Order_Number: orderNumber,
                            Item_Number: originalItemNumber
                        }
                    }
                )
            ),
            // Reset Quantity_Shipped to 0 for passed items (manager override)
            ...Array.from(passedItemsToReset).map(passedItemNumber =>
                OrderDetail.update(
                    {
                        Quantity_Shipped: 0
                    },
                    {
                        where: {
                            Order_Number: orderNumber,
                            Item_Number: passedItemNumber
                        }
                    }
                )
            ),
            // Create new scans
            scansToCreate.length > 0 ? OrderPickScan.bulkCreate(scansToCreate) : Promise.resolve(),
            // Update existing scans
            ...scansToUpdate.map(({ scan, qty }) => 
                scan.update({ qty: literal(`"qty" + ${qty}`) })
            ),
            // Create OrderDetail records for substitute items
            substituteOrderDetailsToCreate.length > 0 
                ? OrderDetail.bulkCreate(substituteOrderDetailsToCreate, { returning: false })
                : Promise.resolve(),
            // Update existing OrderDetail records for substitute items
            ...substituteOrderDetailsToUpdate.map(({ orderDetail, data }) =>
                orderDetail.update(data)
            ),
            // Update OrderDetail for each item (skip substitute items - they already have OrderDetail records created above)
            // Only update items that are not confirmed
            // Use MSSQL syntax [column] instead of PostgreSQL "column"
            ...Array.from(itemQtyMap.entries())
                .filter(([itemNumber]) => !substituteItemNumbersSet.has(itemNumber))
                .map(([itemNumber, qty]) =>
                    OrderDetail.update(
                        {
                            Quantity_Shipped: literal(`[Quantity_Shipped] + ${qty}`)
                        },
                        {
                            where: {
                                Order_Number: orderNumber,
                                Item_Number: itemNumber,
                                Confirmed: 0
                            }
                        }
                    )
                ),
            // Update OrderPick
            OrderPick.update(
                {
                    scannedLines: literal(`"scannedLines" + ${scansToCreate.length + substituteOrderDetailsToCreate.length}`),
                    scannedQty: literal(`"scannedQty" + ${Array.from(itemQtyMap.values()).reduce((sum, qty) => sum + qty, 0)}`)
                },
                {
                    where: {
                        orderNumber: orderNumber
                    }
                }
            )
        ]);
        } finally {
            // Re-enable triggers after creating OrderDetail records for substitutes
            if (substituteOrderDetailsToCreate.length > 0) {
                await sequelize.query('ENABLE TRIGGER ALL ON Order_Detail');
            }
        }

        // Step 8: Check if order is complete
        const remainingItems = await OrderDetail.findAll({
            where: {
                Order_Number: orderNumber,
                [Op.and]: [
                    { Quantity_Ordered: { [Op.gt]: sequelize.col("Quantity_Shipped") } }
                ]
            },
            attributes: ['Item_Number']
        });

        const isComplete = remainingItems.length === 0;

        return {
            success: true,
            processedCount: products.length,
            isComplete
        };
    }
  }
  async addImagesNotes(req: Request, id: number) {
    let pushImage: string[] = [];

    if (req.files && (req.files as any).length > 0) {
      // Upload all files in parallel
      const uploadResults = await Promise.all(
        (req.files as any).map((file: any) =>
          uploadFileToAzure(file.buffer, file.originalname, file.mimetype, "epick")
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
  }


  async OrderCompleted(orderNumber: number, pickerUserId: number) {
    // Check if OrderPick exists
    const orderPick = await OrderPick.findOne({
      where: {
        orderNumber: orderNumber
      }
    })
    if (!orderPick) {
      throw new AppError("Order not found", 404);
    }
    
    // Find the current picker user in EpickUser table to get userNumber and categories
    const pickerUser = await EpickUser.findOne({
      where: {
        id: pickerUserId
      },
      attributes: ['userNumber', 'category']
    });

    if (!pickerUser) {
      throw new AppError("Picker user not found", 404);
    }

    const pickerUserNumber = pickerUser.userNumber;
    const pickerCategories = pickerUser.category || [];
    
    if (!pickerUserNumber) {
      throw new AppError("Picker user number not found", 404);
    }

    // Find the current picker's epick_confirmation
    const currentConfirmation = await EpickConfirmation.findOne({
      where: {
        orderNumber: orderNumber,
        pickerUserNumber: pickerUserId,
        status: 'in_progress'
      }
    });

    if (!currentConfirmation) {
      throw new AppError("No active confirmation found for this picker and order", 404);
    }
    
    // Count bundles (box + drink) and totes from OrderPickBox for THIS picker only
    // We need to track which boxes belong to which picker - for now, count all boxes for the order
    // Note: This is a limitation - we're counting all boxes, not just this picker's boxes
    // If you need per-picker box tracking, you'd need to add pickerUserNumber to OrderPickBox
    const orderBoxes = await OrderPickBox.findAll({
      where: {
        orderNumber: orderNumber
      },
      attributes: ['type']
    });

    // Count bundles = number of (box + drink) for this picker
    // For now, we'll count all boxes (limitation: can't distinguish per picker)
    const bundlesCount = orderBoxes.filter(
      (box: any) => box.type === 'box' || box.type === 'drink'
    ).length;

    // Count totes = number of (tote) for this picker
    const totesCount = orderBoxes.filter(
      (box: any) => box.type === 'tote'
    ).length;

    // Get current Order_Header values to add to them (additive)
    const currentOrderHeader = await OrderHeader.findOne({
      where: {
        Order_Number: orderNumber
      },
      attributes: ['Bundles', 'Totes']
    }) as any;

    const currentBundles = currentOrderHeader?.Bundles || 0;
    const currentTotes = currentOrderHeader?.Totes || 0;

    // Calculate new totals (additive)
    const newBundles = currentBundles + bundlesCount;
    const newTotes = currentTotes + totesCount;

    // Update Order_Header with Picker_ID (last picker), Bundles, and Totes (additive)
    await OrderHeader.update(
      {
        Picker_ID: pickerUserNumber, // Last picker's userNumber
        Bundles: newBundles,
        Totes: newTotes
      },
      {
        where: {
          Order_Number: orderNumber
        }
      }
    );

    // Update Order_Detail.Confirmed to 1 (true) ONLY for items in picker's categories
    // Get all OrderDetail items for this order
    const orderDetails = await OrderDetail.findAll({
      where: {
        Order_Number: orderNumber
      },
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['Sales_Category'],
          required: true
        }
      ],
      raw: false
    });

    // Filter items that belong to picker's categories
    const itemsToConfirm = orderDetails.filter((detail: any) => {
      const inventory = detail.inventory;
      if (!inventory || !inventory.Sales_Category) return false;
      return pickerCategories.includes(inventory.Sales_Category);
    });

    // Update Confirmed for items in picker's categories
    if (itemsToConfirm.length > 0) {
      const itemNumbers = itemsToConfirm.map((detail: any) => detail.Item_Number);
      await OrderDetail.update(
        {
          Confirmed: true
        },
        {
          where: {
            Order_Number: orderNumber,
            Item_Number: { [Op.in]: itemNumbers }
          }
        }
      );
    }

    // Update ONLY current picker's epick_confirmation status to completed (PostgreSQL)
    await EpickConfirmation.update(
      {
        status: 'completed',
        completedAt: moment().toDate()
      },
      {
        where: {
          orderNumber: orderNumber,
          pickerUserNumber: pickerUserId,
          status: 'in_progress'
        }
      }
    );

    // Check if all categories in the order are completed
    const allCategoriesCompleted = await this.areAllCategoriesCompleted(orderNumber);

    // Only mark OrderPick as completed if all categories are completed
    if (allCategoriesCompleted) {
      await orderPick.update({
        status: 'completed',
        completedAt: moment().toDate()
      });
    }

    // Only destroy lock record when ALL categories are completed (MSSQL)
    // This prevents ERP from interfering with other pickers who are still working
    if (allCategoriesCompleted) {
      await RecordLock.destroy({
        where: {
          Lock_Number: orderNumber
        }
      });
      console.log(`RecordLock deleted for order ${orderNumber} - all categories completed`);
    } else {
      console.log(`RecordLock kept for order ${orderNumber} - other pickers still working`);
    }

    console.log(`Order ${orderNumber}: Picker ${pickerUserId} completed. All categories completed: ${allCategoriesCompleted}`);
    console.log(`Bundles added: ${bundlesCount}, Total: ${newBundles}, Totes added: ${totesCount}, Total: ${newTotes}`);

    return orderPick;
  }

  async getUserHistory(id: number) {
    // Get user's completed confirmations
    const completedConfirmations = await EpickConfirmation.findAll({
      where: {
        pickerUserId: id,
        status: 'completed'
      },
      attributes: ['orderNumber'],
      raw: true
    });

    const completedOrderNumbers = completedConfirmations
      .map((conf: any) => conf.orderNumber)
      .filter((v: any) => v !== null && v !== undefined);

    if (completedOrderNumbers.length === 0) {
      return [];
    }

    // Get OrderPick records for these orders
    const data = await OrderPick.findAll({
      where: {
        orderNumber: { [Op.in]: completedOrderNumbers }
      },
      include: [
        {
          model: OrderPickBox,
          as: 'boxes'
        },
        {
          model: OrderPickScan,
          as: 'scans'
        }
      ]
    })
    return data;
  }

  async getOrderDetailByOrderNumber(orderNumber: number) {

    const orderSummarny = await OrderPick.findOne({
      where: {
        orderNumber: orderNumber,

      },
      attributes: ['orderNumber', 'totalLines', 'scannedLines', 'OutOfStockItem', 'status']
    })
    return orderSummarny;

  }



  async getUserCurrentOrder(id: number) {
    // First check if user has an active EpickConfirmation (source of truth)
    // This ensures deleted orders won't appear even if OrderPick still exists
    const userConfirmation = await EpickConfirmation.findOne({
      where: {
        pickerUserId: id,
        status: 'in_progress'
      }
    });
    
    // If no confirmation exists, user has no active order (even if OrderPick exists)
    if (!userConfirmation) {
      return null;
    }
    
    // Get the order from OrderPick using the orderNumber from confirmation
    const data = await OrderPick.findOne({
      where: {
        orderNumber: userConfirmation.orderNumber,
        status: 'in_progress'
      }
    });
    
    // If OrderPick doesn't exist, return null
    if (!data) {
      return null;
    }
    
    // Verify RecordLock still exists (order wasn't deleted from locks)
    const lockExists = await RecordLock.findOne({
      where: {
        Lock_Number: data.orderNumber
      }
    });
    
    // If order exists in PG but not in Record_Locks, return null (order was deleted)
    if (!lockExists) {
      return null;
    }
    
    return data;
  }

  async getItemAsPerBox(boxId: number) {
    const data = await OrderPickScan.findAll({
      where: { boxId },
      attributes: ['orderNumber', 'itemNumber', 'qty', 'isSubsitute']
    });

    if (!data || data.length === 0) {
      return [];
    }

    const finalData = await Promise.all(
      data.map(async (e: any) => {
        const scanItem = e.dataValues;

        // Distributor image
        const productImage = await ProductImage.findOne({
          where: {
            product_number: scanItem.itemNumber.toString(),
            isAllow: true
          },
          attributes: ['img_url', 'isAllow']
        });

        // Inventory on hand
        const inventoryOnHand = await getInventoryOnHand(scanItem.itemNumber);

        // Inventory details
        const inventory = await Inventory.findOne({
          where: { Item_Number: scanItem.itemNumber },
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

        // Convert Sequelize instance → plain object
        const inventoryPlain = inventory ? inventory.get({ plain: true }) : null;

        // Build master image if UPC exists
        const masterImage = inventoryPlain?.UPCList?.[0]?.UPC_Number
          ? `${process.env.AZUREIMAGESERVER}${inventoryPlain.UPCList[0].UPC_Number}.jpg`
          : null;

        return {
          ...scanItem,
          ...inventoryPlain,
          inventoryOnHand,
          masterImage,
          isDistributorImageShow: productImage?.isAllow ?? false,
          distributorImage: productImage?.img_url ?? null
        };
      })
    );

    return finalData;
  }

  async getOrderSummary(orderNumber: number) {
    const data = await OrderPick.findOne({
      where: { orderNumber },
      include: [
        {
          model: OrderPickBox,
          as: "boxes",
          attributes: {
            include: [
              [fn("COUNT", col("boxes->scans.id")), "scanCount"]
            ]
          },
          include: [
            {
              model: OrderPickScan,
              as: "scans",
              attributes: [] // don’t return scan details, just count
            }
          ]
        }
      ],
      group: ["OrderPick.id", "boxes.id"] // required for aggregate
    });

    return data;
  }


  async getReportDate(id: number, query: PaginationOptions) {

    let { page, limit } = query;
    page = Number(query.page || (query as any)['page ']) || 1;
    limit = Number(query.limit || (query as any)['limit ']) || 10;
    const offset = (page - 1) * limit;

    // Query epick_confirmation for this user's completed orders
    const { rows: confirmations, count: totalCount } = await EpickConfirmation.findAndCountAll({
      where: {
        pickerUserId: id,
        status: 'completed'
      },
      order: [['completedAt', 'DESC']],
      limit,
      offset
    });

    // Get order numbers
    const orderNumbers = confirmations.map((conf: any) => conf.orderNumber);

    // Get OrderPick data for customer info
    const orderPicks = await OrderPick.findAll({
      where: {
        orderNumber: { [Op.in]: orderNumbers }
      }
    });

    const orderPickMap: { [key: number]: any } = {};
    orderPicks.forEach((op: any) => {
      orderPickMap[op.orderNumber] = op;
    });

    // Get customer info
    const customerNumbers = orderPicks.map((op: any) => op.customerNumber).filter(Boolean);
    const customers = customerNumbers.length > 0 ? await Customer.findAll({
      where: { C_Number: { [Op.in]: customerNumbers } },
      attributes: ['C_Number', 'C_Name'],
      include: [
        {
          model: CustomerRoute,
          as: 'Routes',
          attributes: ['Route_Number', 'Stop_Number']
        }
      ]
    }) : [];

    const customerMap: { [key: number]: any } = {};
    customers.forEach((cust: any) => {
      customerMap[cust.C_Number] = cust;
    });

    const finalData = confirmations.map((conf: any) => {
      const orderPick = orderPickMap[conf.orderNumber];
      const customer = orderPick ? customerMap[orderPick.customerNumber] : null;

      // Calculate duration
      let duration = null;
      let durationSeconds = null;
      if (conf.startedAt && conf.completedAt) {
        const start = moment(conf.startedAt);
        const end = moment(conf.completedAt);
        durationSeconds = end.diff(start, 'seconds');
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        duration = minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`;
      }

      return {
        orderNumber: conf.orderNumber,
        customerNumber: orderPick?.customerNumber || null,
        categories: conf.category || [],
        startedAt: conf.startedAt,
        completedAt: conf.completedAt,
        duration: duration,
        durationSeconds: durationSeconds,
        status: conf.status,
        customer: customer
      };
    });

    return {
      data: finalData,
      totalCount: totalCount,
      page: page,
      limit: limit
    };

  }


  async getReportById(id: number, userId: number) {
    // Get current user with categories from EpickUser
    const currentUser = await EpickUser.findOne({
      where: { id: userId },
      attributes: ['id', 'firstName', 'lastName', 'userNumber', 'category']
    });

    if (!currentUser) {
      throw new AppError('User not found', 404);
    }

    const userCategories = currentUser.category || [];

    // Get user's confirmation for this order to get time info
    const userConfirmation = await EpickConfirmation.findOne({
      where: {
        orderNumber: id,
        pickerUserId: userId
      }
    });

    // Get OrderPick data for this order
    const orderPick = await OrderPick.findOne({
      where: {
        orderNumber: id
      }
    });

    if (!orderPick) {
      throw new AppError('Order not found', 404);
    }

    // Get only items in user's categories
    const product = await OrderDetail.findAll({
      where: {
        Order_Number: id
      },
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['Item_Number', 'Description', 'Section', 'Location', 'Sales_Category', 'UOM'],
          where: userCategories.length > 0 ? {
            Sales_Category: { [Op.in]: userCategories }
          } : undefined,
          required: userCategories.length > 0,
          include: [
            {
              model: InventoryUPC,
              as: 'UPCList',
              attributes: ['UPC_Number'],
              required: false
            },
            {
              model: SalesCategory,
              as: 'SalesCategory',
              attributes: ['Category_Desc'],
              required: false
            }
          ]
        }
      ]
    });

    // Calculate total quantity shipped from filtered items
    const totalQtyShipped = product.reduce((sum: number, item: any) => {
      return sum + (Number(item.Quantity_Shipped) || 0);
    }, 0);

    // Get category names
    let categoryNameMap: { [key: number]: string } = {};
    if (userCategories.length > 0) {
      const categories = await SalesCategory.findAll({
        where: {
          Sales_Category: { [Op.in]: userCategories }
        },
        attributes: ['Sales_Category', 'Category_Desc'],
        raw: true
      });
      categories.forEach((cat: any) => {
        categoryNameMap[cat.Sales_Category] = cat.Category_Desc;
      });
    }

    // Calculate duration from user's confirmation (not OrderPick)
    let duration = null;
    let durationSeconds = null;
    const confData = userConfirmation as any;
    if (confData?.startedAt && confData?.completedAt) {
      const start = moment(confData.startedAt);
      const end = moment(confData.completedAt);
      durationSeconds = end.diff(start, 'seconds');
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      duration = minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`;
    } else if (confData?.startedAt && !confData?.completedAt) {
      duration = 'in progress';
    }

    // Map category IDs to names
    const categoryNames = userCategories.map((catId: number) => 
      categoryNameMap[catId] || `Category ${catId}`
    );

    // Build picker info for current user
    const pickerInfo = {
      pickerId: userId,
      pickerName: currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : null,
      pickerUserNumber: currentUser?.userNumber || null,
      categories: userCategories,
      categoryNames: categoryNames,
      startedAt: confData?.startedAt || null,
      completedAt: confData?.completedAt || null,
      duration: duration,
      durationSeconds: durationSeconds,
      itemsCount: product.length,
      status: confData?.status || null
    };

    // Build response with numbered items (like original format)
    const itemsObject: any = {};
    product.forEach((item: any, index: number) => {
      // Convert Sequelize instance to plain object if needed, and add Size field from inventory UOM
      const itemData = item.get ? item.get({ plain: true }) : (item.toJSON ? item.toJSON() : item);
      const itemWithSize = {
        ...itemData,
        Size: item.inventory?.UOM || null
      };
      itemsObject[index.toString()] = itemWithSize;
    });

    const opData = orderPick as any;

    return [{
      ...itemsObject,
      id: orderPick.id,
      orderNumber: orderPick.orderNumber,
      pickerUserNumber: userId,
      customerNumber: opData.customerNumber,
      status: confData?.status || opData.status,
      startedAt: confData?.startedAt || opData.startedAt,
      completedAt: confData?.completedAt || opData.completedAt,
      notes: opData.notes,
      images: opData.images,
      totalLines: product.length,
      totalQty: product.reduce((sum: number, item: any) => sum + (Number(item.Quantity_Ordered) || 0), 0),
      OutOfStockItem: opData.OutOfStockItem,
      scannedLines: opData.scannedLines,
      scannedQty: opData.scannedQty,
      createdAt: orderPick.createdAt,
      updatedAt: orderPick.updatedAt,
      totalQtyShipped: totalQtyShipped,
      picker: pickerInfo
    }];
  }

  /**
   * Get epick user report with date range filter
   * Returns all completed orders for a user within date range with override request details, order items, and picking times
   * 
   * @param userId - User ID to filter by (optional, if not provided returns all users)
   * @param fromDate - Start date (ISO string or Date)
   * @param toDate - End date (ISO string or Date)
   */
  async getUserReportWithDateRange(
    userId: number | null,
    fromDate: string | Date | null,
    toDate: string | Date | null
  ) {
    // Build where condition
    const whereCondition: any = {
      status: 'completed'
    };

    // Filter by user if provided
    if (userId) {
      whereCondition.pickerUserId = userId;
    }

    // Filter by date range if provided
    if (fromDate || toDate) {
      whereCondition.completedAt = {};
      if (fromDate) {
        const startDate = moment(fromDate).startOf('day').toDate();
        whereCondition.completedAt[Op.gte] = startDate;
      }
      if (toDate) {
        const endDate = moment(toDate).endOf('day').toDate();
        whereCondition.completedAt[Op.lte] = endDate;
      }
    }

    // Get all completed orders (no pagination)
    const orders = await OrderPick.findAll({
      where: whereCondition,
      attributes: [
        'id',
        'orderNumber',
        'customerNumber',
        'pickerUserNumber',
        'status',
        'startedAt',
        'completedAt',
        'totalLines',
        'totalQty',
        'scannedLines',
        'scannedQty',
        'OutOfStockItem',
        'notes'
      ],
      order: [['completedAt', 'DESC']]
    });

    // Get all order numbers
    const orderNumbers = orders.map((o: any) => o.orderNumber);

    // Get all override requests with full details
    const overrideRequests = await OverrideRequest.findAll({
      where: {
        orderNumber: { [Op.in]: orderNumbers }
      },
      attributes: [
        'id',
        'orderNumber',
        'itemNumber',
        'pickerUserNumber',
        'status',
        'note',
        'requestType',
        'qty',
        'rejectionReason',
        'createdAt',
        'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    // Group override requests by order number
    const overrideRequestsMap: { [key: number]: any[] } = {};
    const overrideCountMap: { [key: number]: number } = {};
    overrideRequests.forEach((req: any) => {
      const orderNum = req.orderNumber;
      if (!overrideRequestsMap[orderNum]) {
        overrideRequestsMap[orderNum] = [];
        overrideCountMap[orderNum] = 0;
      }
      overrideRequestsMap[orderNum].push(req.get({ plain: true }));
      overrideCountMap[orderNum]++;
    });

    // Get all order items for all orders
    const allOrderItems = await OrderDetail.findAll({
      where: {
        Order_Number: { [Op.in]: orderNumbers }
      },
      attributes: [
        'Order_Number',
        'Line_Number',
        'Item_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Pack',
        'CaseCount',
        'Confirmed'
      ],
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['Item_Number', 'Description', 'Section', 'Location'],
          required: false,
          include: [
            {
              model: SalesCategory,
              as: 'SalesCategory',
              attributes: ['Category_Desc', 'Sales_Category'],
              required: false
            }
          ]
        }
      ],
      order: [['Order_Number', 'ASC'], ['Line_Number', 'ASC']]
    });

    // Group order items by order number
    const orderItemsMap: { [key: number]: any[] } = {};
    allOrderItems.forEach((item: any) => {
      const orderNum = item.Order_Number;
      if (!orderItemsMap[orderNum]) {
        orderItemsMap[orderNum] = [];
      }
      orderItemsMap[orderNum].push(item.get({ plain: true }));
    });

    // Get unique user IDs and customer numbers
    const userIds = Array.from(new Set(orders.map((o: any) => o.pickerUserNumber).filter((id: any) => id)));
    const customerNumbers = Array.from(new Set(orders.map((o: any) => o.customerNumber).filter((num: any) => num)));

    // Fetch user information
    const users = await WebUsers.findAll({
      where: {
        id: { [Op.in]: userIds }
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'userNumber'],
      raw: true
    });

    const userMap: any = {};
    users.forEach((user: any) => {
      userMap[user.id] = user;
    });

    // Fetch customer information
    const customers = await Customer.findAll({
      where: {
        C_Number: { [Op.in]: customerNumbers }
      },
      attributes: ['C_Number', 'C_Name'],
      include: [
        {
          model: CustomerRoute,
          as: 'Routes',
          attributes: ['Route_Number', 'Stop_Number'],
          required: false
        }
      ]
    });

    const customerMap: any = {};
    customers.forEach((customer: any) => {
      customerMap[customer.C_Number] = customer.get({ plain: true });
    });

    // Get distributor information
    const distributor = await Distributor.findOne({
      attributes: ['D_Name', 'D_Addr1', 'D_Addr2', 'D_City', 'D_State', 'D_Zip', 'D_Phone', 'D_Email'],
    });

    // Get warehouse logo
    const getProfileImage: any = await Setting.findOne({});

    // Calculate picking times and totals
    let totalPickingTimeSeconds = 0;
    const orderPickingTimes: { [key: number]: number } = {};

    // Build final response with picking time calculations, override requests, and order items
    const finalData = orders.map((order: any) => {
      const orderData = order.get({ plain: true });
      
      // Calculate picking time for this order in seconds
      let pickingTimeSeconds = 0;
      if (orderData.startedAt && orderData.completedAt) {
        const startTime = moment(orderData.startedAt);
        const endTime = moment(orderData.completedAt);
        pickingTimeSeconds = endTime.diff(startTime, 'seconds');
        orderPickingTimes[orderData.orderNumber] = pickingTimeSeconds;
        totalPickingTimeSeconds += pickingTimeSeconds;
      }

      // Format picking time as HH:MM:SS
      const hours = Math.floor(pickingTimeSeconds / 3600);
      const minutes = Math.floor((pickingTimeSeconds % 3600) / 60);
      const seconds = pickingTimeSeconds % 60;
      const pickingTimeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      return {
        ...orderData,
        picker: userMap[orderData.pickerUserNumber] || null,
        customer: customerMap[orderData.customerNumber] || null,
        overrideRequestCount: overrideCountMap[orderData.orderNumber] || 0,
        overrideRequests: overrideRequestsMap[orderData.orderNumber] || [],
        orderItems: orderItemsMap[orderData.orderNumber] || [],
        pickingTimeSeconds: pickingTimeSeconds,
        pickingTimeFormatted: pickingTimeFormatted
      };
    });

    // Format total picking time
    const totalHours = Math.floor(totalPickingTimeSeconds / 3600);
    const totalMinutes = Math.floor((totalPickingTimeSeconds % 3600) / 60);
    const totalSeconds = totalPickingTimeSeconds % 60;
    const totalPickingTimeFormatted = `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')}:${String(totalSeconds).padStart(2, '0')}`;

    return {
      data: finalData,
      totalCount: finalData.length,
      summary: {
        totalOrders: finalData.length,
        totalPickingTimeSeconds: totalPickingTimeSeconds,
        totalPickingTimeFormatted: totalPickingTimeFormatted,
        averagePickingTimeSeconds: finalData.length > 0 ? Math.round(totalPickingTimeSeconds / finalData.length) : 0
      },
      distributor: distributor ? distributor.get({ plain: true }) : null,
      logo: getProfileImage?.dataValues ? getProfileImage.dataValues.warehouseImage : null
    };
  }

  /**
   * Get order details by order number
   * Returns complete order details with override requests, order items, and picking time
   * 
   * @param orderNumber - Order number to get details for
   */
  async getOrderDetailsByOrderNumber(orderNumber: number) {
    // Validate order exists and is completed
    const order = await OrderPick.findOne({
      where: {
        orderNumber: orderNumber,
        status: 'completed'
      },
      attributes: [
        'id',
        'orderNumber',
        'customerNumber',
        'pickerUserNumber',
        'status',
        'startedAt',
        'completedAt',
        'totalLines',
        'totalQty',
        'scannedLines',
        'scannedQty',
        'OutOfStockItem',
        'notes'
      ]
    });

    if (!order) {
      throw new AppError('Order not found or not completed', 404);
    }

    const orderData = order.get({ plain: true });

    // Get all override requests for this order
    const overrideRequests = await OverrideRequest.findAll({
      where: {
        orderNumber: orderNumber
      },
      attributes: [
        'id',
        'orderNumber',
        'itemNumber',
        'pickerUserNumber',
        'status',
        'note',
        'rejectionReason',
        'createdAt',
        'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get all order items for this order
    const allOrderItems = await OrderDetail.findAll({
      where: {
        Order_Number: orderNumber
      },
      attributes: [
        'Order_Number',
        'Line_Number',
        'Item_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Pack',
        'CaseCount',
        'Confirmed'
      ],
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['Item_Number', 'Description', 'Section', 'Location'],
          required: false,
          include: [
            {
              model: SalesCategory,
              as: 'SalesCategory',
              attributes: ['Category_Desc', 'Sales_Category'],
              required: false
            }
          ]
        }
      ],
      order: [['Line_Number', 'ASC']]
    });

    // Get picker user information
    const picker = await WebUsers.findOne({
      where: {
        id: orderData.pickerUserNumber
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'userNumber'],
      raw: true
    });

    // Get customer information
    const customer = await Customer.findOne({
      where: {
        C_Number: orderData.customerNumber
      },
      attributes: ['C_Number', 'C_Name'],
      include: [
        {
          model: CustomerRoute,
          as: 'Routes',
          attributes: ['Route_Number', 'Stop_Number'],
          required: false
        }
      ]
    });

    // Calculate picking time for this order in seconds
    let pickingTimeSeconds = 0;
    if (orderData.startedAt && orderData.completedAt) {
      const startTime = moment(orderData.startedAt);
      const endTime = moment(orderData.completedAt);
      pickingTimeSeconds = endTime.diff(startTime, 'seconds');
    }

    // Format picking time as HH:MM:SS
    const hours = Math.floor(pickingTimeSeconds / 3600);
    const minutes = Math.floor((pickingTimeSeconds % 3600) / 60);
    const seconds = pickingTimeSeconds % 60;
    const pickingTimeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Format order items
    const orderItems = allOrderItems.map((item: any) => item.get({ plain: true }));

    // Format override requests
    const formattedOverrideRequests = overrideRequests.map((req: any) => req.get({ plain: true }));

    // Get distributor information
    const distributor = await Distributor.findOne({
      attributes: ['D_Name', 'D_Addr1', 'D_Addr2', 'D_City', 'D_State', 'D_Zip', 'D_Phone', 'D_Email'],
    });

    // Get warehouse logo
    const getProfileImage: any = await Setting.findOne({});

    return {
      ...orderData,
      picker: picker || null,
      customer: customer ? customer.get({ plain: true }) : null,
      overrideRequestCount: overrideRequests.length,
      overrideRequests: formattedOverrideRequests,
      orderItems: orderItems,
      pickingTimeSeconds: pickingTimeSeconds,
      pickingTimeFormatted: pickingTimeFormatted,
      distributor: distributor ? distributor.get({ plain: true }) : null,
      logo: getProfileImage?.dataValues ? getProfileImage.dataValues.warehouseImage : null
    };
  }

  async getSubsituteProduct(data: any) {
    const { itemNumber, customerNumber } = data;

    // 1) User jurisdiction
    const userJurisdiction = await getJurisdiction(customerNumber);

    // 2) Warehouse / retailer settings (for allowToOrder & flags)
    let wareHouseSetting: any = await Setting.findOne({});
    wareHouseSetting = wareHouseSetting?.dataValues || null;

    // 3) Find substitute row
    const sub = await InventorySubstitutes.findOne({
      where: { Item_Number: itemNumber },
      attributes: ['Item_Number_Substitute', 'Item_Number', 'Substitute_Rule', 'Substitute_Text'],
      logging: false,
    });

    if (!sub) {
      throw new AppError('No substitute product found', 404);
    }

    const subItemNumber = sub.get('Item_Number_Substitute') as number;

    // 4) Build where for the final product
    const whereClause: any = {
      I_Inactive: false,
      ShortOrderForm: true,
      Item_Number: subItemNumber,
    };

    // 5) UPC include (for masterImage)
    const includeUPC = {
      model: InventoryUPC,
      as: 'UPCList',
      attributes: ['UPC_Number'],
      where: { Status: 0 },
      required: false,
    };

    // 6) Pull the product with joins
    const product = await Inventory.findOne({
      attributes: [
        'Pack', 'Description', 'Item_Number', 'CaseCount', 'UOM',
        'Price1', 'Price2', 'BaseCost', 'Invoice_Cost', 'AvgCost',
        'NetCost', 'eCommerce', 'I_Inactive', 'Date_Created',
        'OTP_Number', 'Price_Subclass', 'UnitOunces'
      ],
      where: whereClause,
      include: [
        {
          model: SalesCategory,
          as: 'SalesCategory',
          attributes: ['Category_Desc','Sales_Category'],
          required: false,
        },
        {
          model: PriceClass,
          as: 'PriceClass',
          attributes: ['Class_Desc'],
          required: false,
        },
        {
          model: InventoryStatus,
          as: 'inventoryStatus',
          attributes: ['Inventory_OnHand'],
          required: false,
        },
        includeUPC,
      ],
      logging: false,
    });

    if (!product) {
      throw new AppError('Substitute product is inactive or not orderable', 404);
    }

    // 7) Pricing, inventory, tax, images
    const e = product as any; // ease of access to dataValues-like props

    let price = await getDiscount(subItemNumber, customerNumber);
    if (!price) {
      price = await getFirstValidPrice(e);
    }

    const inventoryOnHand = (await getInventoryOnHand(subItemNumber)) || 0;

    let taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
    taxRate = Math.ceil(taxRate * 100) / 100;

    const productImages = await ProductImage.findAll({
      where: {
        product_number: e.Item_Number.toString(),
        isAllow: true,
      },
      logging: false,
    });

    // choose the first allowed image if any
    const productImage = productImages?.[0] ?? null;

    // discount flags, product limit, qty discount
    const isDiscounted = await hasDiscountedItem(e.Item_Number, e.Price_Subclass);
    const productLimit = await getProductLimit(e.Item_Number);

    // allowToOrder gate based on settings & stock
    let allowToOrder = true;
    if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
      allowToOrder = false;
    }

    let prepaidTaxRate = 0
    if(userJurisdiction !=null && e.salesCategory){
      prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, e?.salesCategory?.Sales_Category);
    }

    // Optional: mark new items if you have a similar helper as in list API
    // const topLatestItems = await getTopLatestItems();
    // const isNewItem = topLatestItems.some((it: any) => it.Item_Number === e.Item_Number);
    const isNewItem = false;

    // 8) Build response mirroring list API fields
    const resp = {
      Pack: e.Pack,
      Description: e.Description,
      Item_Number: e.Item_Number,
      CaseCount: e.CaseCount,
      UOM: e.UOM,
      isDiscounted,
      Price1: e.Price1,
      Tax_Rate: taxRate,
      OTP_Number: e.OTP_Number,
      price: Math.ceil(price * 100) / 100,
      isNewItem,
      priceWithTax: Math.ceil((price + taxRate) * 100) / 100,
      BaseCost: e.BaseCost,
      Invoice_Cost: e.Invoice_Cost,
      AvgCost: e.AvgCost,
      NetCost: e.NetCost,
      hasPrepaidTaxRate: prepaidTaxRate ? true : false,
      prepaidTaxRate: prepaidTaxRate,
      hasProductLimit: !!productLimit,
      productLimit,
      UPCList: e.UPCList, // comes from includeUPC
      Inventory_OnHand: inventoryOnHand,
      UnitOunces: e.UnitOunces,
      allowToOrder,
      showTheInventoryStock: wareHouseSetting?.retailer?.showStock || false,
      showLowStock: wareHouseSetting?.retailer?.showStock
        ? false
        : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
      showWithOutPrice: wareHouseSetting?.retailer?.showWithOutPrice || false,
      SalesCategory: e.SalesCategory?.Category_Desc || null,
      PriceClass: e.PriceClass?.Class_Desc || null,
      showDistributorImage: productImage?.isAllow ?? false,
      distributorImage: productImage?.img_url || null,
      masterImage: `${process.env.AZUREIMAGESERVER}${e.UPCList?.[0]?.UPC_Number ?? ''}.jpg`,

      // extra context about the substitution (optional to expose)
      SubstituteFrom: sub.get('Item_Number'),
      SubstituteTo: subItemNumber,
      Substitute_Rule: sub.get('Substitute_Rule') ?? null,
      Substitute_Text: sub.get('Substitute_Text') ?? null,
    };

    return resp;
  }

  async addSubsituteProduct(data: any, userId: number) {
    const { itemNumber, qty, orderNumber, lineNumber, price, taxRate, oldItemNumber } = data


    const product = await Inventory.findOne({
      where: { Item_Number: itemNumber },
    })

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const optionDefsValues = await OptionDefsValues.findOne({
      where: { ID_Number: 4003 },
    })

    const orderDetail = {
      Order_Number: orderNumber,
      Item_Number: itemNumber,
      Line_Number: lineNumber,
      Sales_Category: product.Sales_Category,
      OTP_Number: product.OTP_Number,
      Quantity_Ordered: Number(qty),
      Quantity_Shipped: Number(qty),
      Pack: product.Pack,
      UOM: product.UOM,
      Price: Number(price),
      Price_Reference: Number(price),
      Retail: product.Retail1,
      NetCost: product.NetCost,
      BaseCost: product.BaseCost,
      Invoice_Cost: product.Invoice_Cost,
      AvgCost: product.AvgCost,
      OTP_Amount_State: Number(taxRate ?? 0),
      OTP_Amount_County: 0,
      OTP_Amount_City: 0,
      Item_Message: null,
      DepositAmount: product.DepositAmount,
      Price_Subclass: product.Price_Subclass,
      OffInvoice_Amount: 0,
      OffInvoice_OffCost: 0,
      OffInvoice_Special: false,
      EBT: product.EBT,
      Points: product.Points,
      STAMP_Qty: optionDefsValues?.Option_Value || 0,
      ItemDescription: product.Description,
      CaseWeight: product.CaseWeight,
      CaseCount: product.CaseCount,
      // CasesPerPallet: product.CasesPerPallet,
    };

    let finalObject = {
      ...getDefaultOrderDetailValues(),
      ...orderDetail
    }

    try {

      await sequelize.query('DISABLE TRIGGER ALL ON Order_Detail');


      await OrderDetail.bulkCreate([finalObject], { returning: false });

      const updatedData = await OrderPick.update(
        {
          scannedQty: literal(`"scannedQty" + ${Number(qty)}`),
          scannedLines: literal(`"scannedLines" + 1`),
          totalLines: lineNumber
        },
        {
          where: {
            orderNumber: orderNumber
          }
        }
      );

      await PassScanItem.create({
        itemNumber: oldItemNumber,
        orderNumber: orderNumber,
        userId: Number(userId)
      })
      await OrderDetail.update(
        {
          Quantity_Shipped: 0,
        },
        {
          where: {
            Order_Number: orderNumber,
            Item_Number: oldItemNumber
          }
        }
      );

      return updatedData
    } catch (e: any) {



      console.error('🔥 Sequelize Error:', e?.errors || e);
      console.error('Stack Trace:', e?.stack);
      throw new AppError(`Failed to create order detail: ${e?.message}`, 500);
    } finally {
      // 🟠 Always re-enable triggers even if error occurs
      await sequelize.query('ENABLE TRIGGER ALL ON Order_Detail');
    }


  }

  async putPassScanItem(body: any) {
    const { orderNumber, itemNumber } = body

    await OrderDetail.update(
      {
        Quantity_Shipped: 0,
      },
      {
        where: {
          Order_Number: orderNumber,
          Item_Number: itemNumber
        }
      }
    );
    const passScanItem = await PassScanItem.create(body);
    return passScanItem;

  }

  async checkPin(pin: string) {

    const epickSetting = await EpickSetting.findOne({
      where: {
        pin: pin
      }
    });

    if (!epickSetting) {
      throw new AppError('Pin is incorrect', 404);
    }
    return epickSetting;

  }

  /**
   * Create a new override request
   */
  async createOverrideRequest(data: {
    orderNumber: number;
    itemNumber: number;
    qty?: number;
    note?: string;
  }, userId: number) {
    const { orderNumber, itemNumber, qty, note } = data;

    // Get user info
    const user = await EpickUser.findOne({ where: { id: userId } });
    const userNumber = user?.userNumber ? Number(user.userNumber) : 0;

    // Validate order exists and item is in order
    const orderDetail = await OrderDetail.findOne({
      where: {
        Order_Number: orderNumber,
        Item_Number: itemNumber,
      },
    });

    if (!orderDetail) {
      throw new AppError(`Item ${itemNumber} not found in order ${orderNumber}`, 404);
    }

    // Check if there's already a pending 'pass' type request for this item
    const existingRequest = await OverrideRequest.findOne({
      where: {
        orderNumber,
        itemNumber,
        pickerUserId: userId,
        status: 'pending',
        requestType: 'pass', // Only check for 'pass' type
      },
    });

    if (existingRequest) {
      throw new AppError('A pending pass override request already exists for this item', 400);
    }

    // Create the request (default to 'pass' type)
    // qty defaults to 0 if not provided (for backward compatibility)
    const overrideRequest = await OverrideRequest.create({
      orderNumber,
      itemNumber,
      pickerUserNumber: userNumber,
      pickerUserId: userId,
      status: 'pending',
      requestType: 'pass',
      qty: qty !== undefined && qty !== null ? qty : 0,
      note: note || null, 
    });

    // Send notification to all distributors
    await this.sendNotificationToDistributors(overrideRequest);

    return {
      requestId: overrideRequest.id,
      status: overrideRequest.status,
      orderNumber: overrideRequest.orderNumber,
      itemNumber: overrideRequest.itemNumber,
      requestType: overrideRequest.requestType,
      qty: overrideRequest.qty,
      note: overrideRequest.note,
      createdAt: overrideRequest.createdAt,
    };
  }

  /**
   * Create a new scan override request (with quantity)
   */
  async createScanOverrideRequest(data: {
    orderNumber: number;
    itemNumber: number;
    qty: number;
    note?: string;
  }, userId: number) {
    const { orderNumber, itemNumber, qty, note } = data;

    // Get user info
    const user = await EpickUser.findOne({ where: { id: userId } });
    const userNumber = user?.userNumber ? Number(user.userNumber) : 0;

    // Validate qty is positive
    if (!qty || qty <= 0) {
      throw new AppError('Quantity must be greater than 0', 400);
    }

    // Validate order exists and item is in order
    const orderDetail = await OrderDetail.findOne({
      where: {
        Order_Number: orderNumber,
        Item_Number: itemNumber,
      },
    });

    if (!orderDetail) {
      throw new AppError(`Item ${itemNumber} not found in order ${orderNumber}`, 404);
    }

    // Check if there's already a pending 'scan' type request for this item
    const existingRequest = await OverrideRequest.findOne({
      where: {
        orderNumber,
        itemNumber,
        pickerUserId: userId,
        status: 'pending',
        requestType: 'scan', // Only check for 'scan' type
      },
    });

    if (existingRequest) {
      throw new AppError('A pending scan override request already exists for this item', 400);
    }

    // Create the scan request
    const overrideRequest = await OverrideRequest.create({
      orderNumber,
      itemNumber,
      pickerUserNumber: userNumber,
      pickerUserId: userId,
      status: 'pending',
      requestType: 'scan',
      qty: qty,
      note: note || null, 
    });

    // Send notification to all distributors
    await this.sendNotificationToDistributors(overrideRequest);

    return {
      requestId: overrideRequest.id,
      status: overrideRequest.status,
      orderNumber: overrideRequest.orderNumber,
      itemNumber: overrideRequest.itemNumber,
      requestType: overrideRequest.requestType,
      qty: overrideRequest.qty,
      note: overrideRequest.note,
      createdAt: overrideRequest.createdAt,
    };
  }


  async requestAllStatusOverride(orderNumber: number,query:any){
    const {status, pickerId} = query; 

    const whereCondition: any = {
      orderNumber: orderNumber,
      status: 'pending'
    };

    // If pickerId provided, filter by that picker
    if (pickerId) {
      whereCondition.pickerUserId = Number(pickerId);
    }

    const overrideRequests = await OverrideRequest.update({status:status}, {
      where: whereCondition,
    });
    return overrideRequests;
  }

  
  /**
   * Check override request status (for polling)
   */
  async checkOverrideRequest(requestId: number, userId: number) {
    const overrideRequest = await OverrideRequest.findOne({
      where: {
        id: requestId,
        pickerUserId: userId, // Ensure user can only check their own requests
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!overrideRequest) {
      throw new AppError('Override request not found', 404);
    }

    // Get item description
    const inventory = await Inventory.findOne({
      where: { Item_Number: overrideRequest.itemNumber },
      attributes: ['Description'],
    });

    return {
      requestId: overrideRequest.id,
      status: overrideRequest.status,
      orderNumber: overrideRequest.orderNumber,
      itemNumber: overrideRequest.itemNumber,
      requestType: overrideRequest.requestType,
      qty: overrideRequest.qty,
      itemDescription: inventory?.Description || null,
      note: overrideRequest.note,
      rejectionReason: overrideRequest.rejectionReason,
      createdAt: overrideRequest.createdAt,
      updatedAt: overrideRequest.updatedAt,
    };
  }

  /**
   * Check scan override request status (for polling) - Specific endpoint for scan type
   */
  async checkScanOverrideRequest(requestId: number, userId: number) {
    const overrideRequest = await OverrideRequest.findOne({
      where: {
        id: requestId,
        pickerUserId: userId, // Ensure user can only check their own requests
        requestType: 'scan', // Only check scan type requests
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!overrideRequest) {
      throw new AppError('Scan override request not found', 404);
    }

    // Get item description
    const inventory = await Inventory.findOne({
      where: { Item_Number: overrideRequest.itemNumber },
      attributes: ['Description'],
    });

    return {
      requestId: overrideRequest.id,
      status: overrideRequest.status,
      orderNumber: overrideRequest.orderNumber,
      itemNumber: overrideRequest.itemNumber,
      requestType: overrideRequest.requestType,
      qty: overrideRequest.qty,
      itemDescription: inventory?.Description || null,
      note: overrideRequest.note,
      rejectionReason: overrideRequest.rejectionReason,
      createdAt: overrideRequest.createdAt,
      updatedAt: overrideRequest.updatedAt,
    };
  }

  /**
   * Cancel override request (Epick user)
   */
  async cancelOverrideRequest(requestId: number, userId: number) {
    const overrideRequest = await OverrideRequest.findOne({
      where: {
        id: requestId,
        pickerUserId: userId, // Ensure user can only cancel their own requests
      },
    });

    if (!overrideRequest) {
      throw new AppError('Override request not found', 404);
    }

    // Only allow cancellation if status is pending
    if (overrideRequest.status !== 'pending') {
      throw new AppError(`Cannot cancel request with status: ${overrideRequest.status}. Only pending requests can be cancelled.`, 400);
    }

    // Update status to cancelled
    overrideRequest.status = 'cancelled';
    await overrideRequest.save();

    return {
      requestId: overrideRequest.id,
      status: overrideRequest.status,
      orderNumber: overrideRequest.orderNumber,
      itemNumber: overrideRequest.itemNumber,
      updatedAt: overrideRequest.updatedAt,
    };
  }

  /**
   * Get all pending override requests (for distributor)
   */
  async getPendingOverrideRequests() {
    const pendingRequests = await OverrideRequest.findAll({
      where: {
        status: 'pending',
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Get item descriptions for all requests
    const itemNumbers = pendingRequests.map(req => req.itemNumber);
    const inventories = await Inventory.findAll({
      where: {
        Item_Number: { [Op.in]: itemNumbers },
      },
      attributes: ['Item_Number', 'Description'],
    });

    const inventoryMap = new Map(inventories.map(inv => [inv.Item_Number, inv.Description]));

    return pendingRequests.map((req: any) => {
      const user = req.user as WebUsers | undefined;
      return {
        requestId: req.id,
        orderNumber: req.orderNumber,
        itemNumber: req.itemNumber,
        itemDescription: inventoryMap.get(req.itemNumber) || null,
        pickerUserNumber: req.pickerUserNumber,
        userName: user ? `${user.firstName} ${user.lastName}` : null,
        userEmail: user?.email || null,
        requestType: req.requestType, // 'pass' or 'scan'
        qty: req.qty,                 // 0 for pass, actual qty for scan
        note: req.note,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      };
    });
  }

  /**
   * Get list of all complete orders ready for checker
   * - Only returns orders that are completed by epick but NOT completed by checker
   * - Returns order information (no details)
   * - Includes override request counts
   */
  async getCompleteOrder() {
    // Get all completed orders from OrderPick (epick completed)
    const completedOrders = await OrderPick.findAll({
      where: {
        status: 'completed' // Only get completed orders (already picked by epick)
      },
      attributes: ['orderNumber', 'startedAt', 'completedAt'],
      raw: false,
    });

    // Get unique order numbers
    const completedOrderNumbers = Array.from(
      new Set(
        completedOrders
          .map((o: any) => o?.orderNumber)
          .filter((v: any) => v !== null && v !== undefined && String(v).trim() !== '')
          .map((v: any) => Number(v))
      )
    );

    if (completedOrderNumbers.length === 0) {
      return [];
    }

    // Query OrderHeader for completed orders with same conditions as checker
    const headerWhere: any = {
      // Exclude orders where Order_Updated = 1
      Order_Updated: { [Op.ne]: true },
      // Only get orders that are completed (already picked)
      Order_Number: { [Op.in]: completedOrderNumbers },
      // Only orders not invoiced (checker not completed)
      Invoice_Number: 0
    };

    const orderHeaders = await OrderHeader.findAll({
      where: headerWhere,
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
      ],
      order: [['Order_Number', 'ASC']],
    });

    if (orderHeaders.length === 0) {
      return [];
    }

    // Get all order numbers from the completed orders list
    const orderNumbers = orderHeaders.map((order: any) => order.Order_Number);

    // Validation: Check that ALL products in OrderDetail have Confirmed = 1
    // Only include orders where every item is confirmed (same as checker)
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

      // Filter orderHeaders to only include orders where all items are confirmed
      validatedOrderNumbers = Array.from(validatedOrderNumbersSet);

      // If no orders pass validation, return empty array
      if (validatedOrderNumbers.length === 0) {
        return [];
      }

      // Filter orderHeaders to only include validated orders
      const filteredOrders = orderHeaders.filter((order: any) =>
        validatedOrderNumbers.includes(order.Order_Number)
      );

      // Update orderHeaders to only include validated orders
      orderHeaders.length = 0;
      orderHeaders.push(...filteredOrders);

      // Update orderNumbers to only include validated orders
      orderNumbers.length = 0;
      orderNumbers.push(...validatedOrderNumbers);
    }

    // Get override request counts for each order
    const overrideRequests = await OverrideRequest.findAll({
      where: {
        orderNumber: { [Op.in]: orderNumbers }
      },
      attributes: ['orderNumber', 'status'],
      raw: true,
    });

    // Count override requests by order and status
    const overrideCounts: any = {};
    overrideRequests.forEach((req: any) => {
      const orderNum = req.orderNumber;
      if (!overrideCounts[orderNum]) {
        overrideCounts[orderNum] = {
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
          total: 0
        };
      }
      overrideCounts[orderNum][req.status] = (overrideCounts[orderNum][req.status] || 0) + 1;
      overrideCounts[orderNum].total += 1;
    });

    // Create map of orderNumber to OrderPick data
    const orderPickMap: any = {};
    completedOrders.forEach((order: any) => {
      if (order.orderNumber) {
        orderPickMap[order.orderNumber] = {
          startedAt: order.startedAt,
          completedAt: order.completedAt
        };
      }
    });

    // Format response
    return orderHeaders.map((order: any) => {
      const orderNum = order.Order_Number;
      const customer = order.customer;
      const customerRoute = customer?.Routes?.[0];
      const orderPickData = orderPickMap[orderNum] || { startedAt: null, completedAt: null };
      const overrideCount = overrideCounts[orderNum] || {
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        total: 0
      };

      return {
        orderNumber: orderNum,
        orderDate: order.Order_Date,
        invoiceNumber: order.Invoice_Number || 0,
        bundles: order.Bundles || 0,
        totes: order.Totes || 0,
        pickerId: order.Picker_ID || null,
        confirmed: order.Confirmed || false,
        invoiceTotal: order.Invoice_Total || null,
        customer: customer ? {
          customerNumber: customer.C_Number,
          customerName: customer.C_Name,
          address: customer.C_Address,
          city: customer.C_City,
          state: customer.C_State,
          zip: customer.C_Zip,
          route: customerRoute?.Route_Number || order.Route_Number || null,
          stop: customerRoute?.Stop_Number || order.Stop_Number || null
        } : null,
        overrideRequests: overrideCount,
        checkerStatus: {
          isReadyForChecker: true,
          status: 'completed',
          startedAt: orderPickData.startedAt,
          completedAt: orderPickData.completedAt
        }
      };
    });
  }

  /**
   * Get complete order information (order info only, no details)
   * - Only returns orders that are completed by epick but NOT completed by checker
   * - Order header information
   * - All override requests for this order (all statuses)
   * - Checker status (should be ready for checker but not completed)
   */
  async getCompleteOrderDetails(orderNumber: number) {
    // Validate order number
    if (!orderNumber || isNaN(orderNumber)) {
      throw new AppError('Invalid order number', 400);
    }

    // Check if order is completed by epick but NOT completed by checker
    const orderPick = await OrderPick.findOne({
      where: { 
        orderNumber: orderNumber,
        status: 'completed' // Epick must be completed
      },
      attributes: ['orderNumber', 'status', 'startedAt', 'completedAt']
    });

    if (!orderPick) {
      throw new AppError('Order not found or epick is not completed yet.', 404);
    }

    // Check if checker has already completed (invoice created or status is ready_for_delivery)
    const orderHeader = await OrderHeader.findOne({
      where: { Order_Number: orderNumber },
      attributes: ['Invoice_Number']
    });

    if (!orderHeader) {
      throw new AppError('Order header not found', 404);
    }

    // If invoice is created (Invoice_Number > 0), checker has completed - don't show
    const invoiceNumber = (orderHeader as any).Invoice_Number || 0;
    if (invoiceNumber > 0) {
      throw new AppError('Order has already been completed by checker (invoiced).', 404);
    }

    // Get order header with customer information
    const fullOrderHeader = await OrderHeader.findOne({
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

    if (!fullOrderHeader) {
      throw new AppError('Order not found', 404);
    }

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
    const itemNumbers = overrideRequests.map(req => req.itemNumber);
    const inventories = await Inventory.findAll({
      where: {
        Item_Number: { [Op.in]: itemNumbers },
      },
      attributes: ['Item_Number', 'Description'],
    });

    const inventoryMap = new Map(inventories.map(inv => [inv.Item_Number, inv.Description]));

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
    const orderHeaderData = fullOrderHeader as any;
    const customer = orderHeaderData.customer;
    const customerRoute = customer?.Routes?.[0];

    return {
      orderInfo: {
        orderNumber: orderHeaderData.Order_Number,
        orderDate: orderHeaderData.Order_Date,
        invoiceNumber: orderHeaderData.Invoice_Number || null,
        bundles: orderHeaderData.Bundles || 0,
        totes: orderHeaderData.Totes || 0,
        pickerId: orderHeaderData.Picker_ID || null,
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
        } : null
      },
      overrideRequests: formattedOverrideRequests,
      checkerStatus: {
        isReadyForChecker: true,
        status: 'completed',
        startedAt: orderPick?.startedAt || null,
        completedAt: orderPick?.completedAt || null
      }
    };
  }

  /**
   * Get pending override requests by order number (for distributor)
   */
  async getPendingOverrideRequestsByOrder(orderNumber: number) {
    // Validate order number
    if (!orderNumber || isNaN(orderNumber)) {
      throw new AppError('Invalid order number', 400);
    }

    // Get ALL pickers who worked on this order (from EpickConfirmation)
    const confirmations = await EpickConfirmation.findAll({
      where: {
        orderNumber: orderNumber
      },
      attributes: ['id', 'orderNumber', 'pickerUserId', 'pickerUserNumber', 'category', 'status'],
      order: [['startedAt', 'DESC']],
      raw: true,
    });

    // Get unique picker user IDs
    const pickerUserIds = [...new Set(confirmations.map((c: any) => c.pickerUserId).filter(Boolean))];

    // Get picker user details from EpickUser
    const pickers = await EpickUser.findAll({
      where: { id: { [Op.in]: pickerUserIds } },
      attributes: ['id', 'firstName', 'lastName', 'email', 'userNumber', 'category']
    });
    const pickerMap: { [key: number]: any } = {};
    pickers.forEach((p: any) => {
      pickerMap[p.id] = p.get({ plain: true });
    });

    // Get all pending override requests for this order
    const pendingRequests = await OverrideRequest.findAll({
      where: {
        status: 'pending',
        orderNumber: orderNumber,
      },
      order: [['createdAt', 'DESC']],
      raw: true,
    });

    // Group override requests by pickerUserId
    const requestsByPicker: { [key: number]: any[] } = {};
    pendingRequests.forEach((req: any) => {
      const pickerId = req.pickerUserId;
      if (pickerId) {
        if (!requestsByPicker[pickerId]) {
          requestsByPicker[pickerId] = [];
        }
        requestsByPicker[pickerId].push(req);
      }
    });

    // Get all order items with inventory info
    const orderItems = await OrderDetail.findAll({
      where: { Order_Number: orderNumber },
      include: [{
        model: Inventory,
        as: 'inventory',
        attributes: ['Item_Number', 'Description', 'Section', 'Location', 'Sales_Category'],
        include: [{
          model: InventoryUPC,
          as: 'UPCList',
          attributes: ['UPC_Number'],
          required: false
        }]
      }]
    });

    // Build response grouped by picker - deduplicate by pickerUserId
    const result: any[] = [];
    const processedPickerIds = new Set<number>();

    // Process confirmations, but only once per unique pickerUserId
    for (const confirmation of confirmations) {
      const pickerId = confirmation.pickerUserId;
      if (!pickerId) continue;
      
      // Skip if we've already processed this picker
      if (processedPickerIds.has(pickerId)) continue;
      processedPickerIds.add(pickerId);

      const picker = pickerMap[pickerId];
      if (!picker) continue;

      // Use categories from confirmation (what they're picking for this order) or from picker profile
      // If multiple confirmations exist for same picker, use the most recent one's categories
      const pickerCategories = confirmation.category || picker.category || [];
      const pickerRequests = requestsByPicker[pickerId] || [];

      // Filter order items by picker's categories
      const pickerItems = orderItems.filter((item: any) => {
        const salesCategory = item.inventory?.Sales_Category;
        return pickerCategories.length === 0 || pickerCategories.includes(salesCategory);
      });

      result.push({
        pickerUserId: pickerId,
        pickerUserNumber: picker.userNumber || confirmation.pickerUserNumber || null,
        userName: picker ? `${picker.firstName || ''} ${picker.lastName || ''}`.trim() : null,
        userEmail: picker?.email || null,
        pickerCategories: pickerCategories,
        overrideRequests: pickerRequests.map((req: any) => ({
          requestId: req.id,
          orderNumber: req.orderNumber,
          itemNumber: req.itemNumber,
          itemDescription: (pickerItems.find((i: any) => i.Item_Number === req.itemNumber) as any)?.inventory?.Description || null,
          requestType: req.requestType,
          qty: req.qty,
          note: req.note,
          createdAt: req.createdAt,
          updatedAt: req.updatedAt,
        })),
        pickerItems: pickerItems.map((item: any) => ({
          itemNumber: item.Item_Number,
          description: item.inventory?.Description,
          section: item.inventory?.Section,
          location: item.inventory?.Location,
          salesCategory: item.inventory?.Sales_Category,
          quantityOrdered: item.Quantity_Ordered,
          quantityShipped: item.Quantity_Shipped,
          confirmed: item.Confirmed
        }))
      });
    }

    return result;
  }

  /**
   * Get all override requests for an order (for Epick user)
   * Returns all override requests grouped by type (pass and scan)
   */
  async getAllOverrideRequests(orderNumber: number, userId?: number) {
    // Validate order number
    if (!orderNumber || isNaN(orderNumber)) {
      throw new AppError('Invalid order number', 400);
    }

    // Build where condition
    const whereCondition: any = {
      orderNumber: orderNumber,
    };

    // If userId provided, filter by pickerUserId
    if (userId) {
      whereCondition.pickerUserId = userId;
    }

    // Get all override requests for this order (all statuses)
    const allRequests = await OverrideRequest.findAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
    });

    // Separate requests by type
    const passOverrides = allRequests
      .filter(req => req.requestType === 'pass')
      .map(req => ({
        requestId: req.id,
        itemNumber: req.itemNumber,
        status: req.status,
        qty: req.qty,
        note: req.note || null,
        rejectionReason: (req.status === 'rejected' || req.status === 'cancelled') 
          ? (req.rejectionReason || null) 
          : null,
      }));

   
      
    const scanOverrides = allRequests
      .filter(req => req.requestType === 'scan')
      .map(req => ({
        requestId: req.id,
        itemNumber: req.itemNumber,
        status: req.status,
        qty: req.qty,
       
        note: req.note || null,
        rejectionReason: (req.status === 'rejected' || req.status === 'cancelled') 
          ? (req.rejectionReason || null) 
          : null,
      }));

    return {
      passOverrides,
      scanOverrides,
    };
  }

  /**
   * Get all override requests for an order filtered by epick user's categories
   * Returns only override requests for items in the user's assigned sales categories
   * Same response structure as getAllOverrideRequests
   */
  async getAllOverrideRequestsForEpick(orderNumber: number, userId: number) {
    // Validate order number
    if (!orderNumber || isNaN(orderNumber)) {
      throw new AppError('Invalid order number', 400);
    }

    // Get epick user's categories
    const epickUser = await EpickUser.findOne({
      where: {
        id: userId
      },
      attributes: ['category']
    });

    if (!epickUser) {
      throw new AppError('Epick user not found', 404);
    }

    const userCategories = epickUser.category || [];

    if (userCategories.length === 0) {
      // If user has no categories, return empty result
      return {
        passOverrides: [],
        scanOverrides: [],
      };
    }

    // Get all override requests for this order
    const allRequests = await OverrideRequest.findAll({
      where: {
        orderNumber: orderNumber,
      },
      order: [['createdAt', 'DESC']],
    });

    if (allRequests.length === 0) {
      return {
        passOverrides: [],
        scanOverrides: [],
      };
    }

    // Get item numbers from override requests
    const itemNumbers = Array.from(new Set(allRequests.map(req => req.itemNumber)));

    // Get Inventory records for these items to check Sales_Category
    const inventoryItems = await Inventory.findAll({
      where: {
        Item_Number: { [Op.in]: itemNumbers }
      },
      attributes: ['Item_Number', 'Sales_Category'],
      raw: true
    });

    // Create a map: itemNumber -> Sales_Category
    const itemCategoryMap: { [key: number]: number } = {};
    inventoryItems.forEach((item: any) => {
      itemCategoryMap[item.Item_Number] = item.Sales_Category;
    });

    // Filter requests: only include items whose Sales_Category is in user's categories
    const filteredRequests = allRequests.filter(req => {
      const itemCategory = itemCategoryMap[req.itemNumber];
      return itemCategory !== undefined && userCategories.includes(itemCategory);
    });

    // Separate filtered requests by type
    const passOverrides = filteredRequests
      .filter(req => req.requestType === 'pass')
      .map(req => ({
        requestId: req.id,
        itemNumber: req.itemNumber,
        status: req.status,
        qty: req.qty,
        note: req.note || null,
        rejectionReason: (req.status === 'rejected' || req.status === 'cancelled') 
          ? (req.rejectionReason || null) 
          : null,
      }));

    const scanOverrides = filteredRequests
      .filter(req => req.requestType === 'scan')
      .map(req => ({
        requestId: req.id,
        itemNumber: req.itemNumber,
        status: req.status,
        qty: req.qty,
        note: req.note || null,
        rejectionReason: (req.status === 'rejected' || req.status === 'cancelled') 
          ? (req.rejectionReason || null) 
          : null,
      }));

    return {
      passOverrides,
      scanOverrides,
    };
  }

  /**
   * Get all approved override requests (for distributor)
   */
  async getApprovedOverrideRequests() {
    const approvedRequests = await OverrideRequest.findAll({
      where: {
        status: 'approved',
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    // Get item descriptions for all requests
    const itemNumbers = approvedRequests.map(req => req.itemNumber);
    const inventories = await Inventory.findAll({
      where: {
        Item_Number: { [Op.in]: itemNumbers },
      },
      attributes: ['Item_Number', 'Description'],
    });

    const inventoryMap = new Map(inventories.map(inv => [inv.Item_Number, inv.Description]));

    return approvedRequests.map((req: any) => {
      const user = req.user as WebUsers | undefined;
      return {
        requestId: req.id,
        orderNumber: req.orderNumber,
        itemNumber: req.itemNumber,
        itemDescription: inventoryMap.get(req.itemNumber) || null,
        pickerUserNumber: req.pickerUserNumber,
        userName: user ? `${user.firstName} ${user.lastName}` : null,
        userEmail: user?.email || null,
        requestType: req.requestType, // 'pass' or 'scan'
        qty: req.qty,                 // 0 for pass, actual qty for scan
        note: req.note,
        status: req.status,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      };
    });
  }

  /**
   * Get all cancelled override requests (for distributor)
   */
  async getCancelledOverrideRequests() {
    const cancelledRequests = await OverrideRequest.findAll({
      where: {
        status: 'cancelled',
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    // Get item descriptions for all requests
    const itemNumbers = cancelledRequests.map(req => req.itemNumber);
    const inventories = await Inventory.findAll({
      where: {
        Item_Number: { [Op.in]: itemNumbers },
      },
      attributes: ['Item_Number', 'Description'],
    });

    const inventoryMap = new Map(inventories.map(inv => [inv.Item_Number, inv.Description]));

    return cancelledRequests.map((req: any) => {
      const user = req.user as WebUsers | undefined;
      return {
        requestId: req.id,
        orderNumber: req.orderNumber,
        itemNumber: req.itemNumber,
        itemDescription: inventoryMap.get(req.itemNumber) || null,
        pickerUserNumber: req.pickerUserNumber,
        userName: user ? `${user.firstName} ${user.lastName}` : null,
        userEmail: user?.email || null,
        requestType: req.requestType, // 'pass' or 'scan'
        qty: req.qty,                 // 0 for pass, actual qty for scan
        note: req.note,
        status: req.status,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      };
    });
  }

  /**
   * Approve override request
   */
  async approveOverrideRequest(requestId: number) {
    const overrideRequest = await OverrideRequest.findOne({
      where: {
        id: requestId,
        status: 'pending',
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!overrideRequest) {
      throw new AppError('Pending override request not found', 404);
    }

    // Update status
    overrideRequest.status = 'approved';
    await overrideRequest.save();

    // If request type is 'scan', update qty_shipped like normal scan
    if (overrideRequest.requestType === 'scan' && overrideRequest.qty > 0) {
      // Get or create a box for this order (use first box or default)
      const orderBox = await OrderPickBox.findOne({
        where: {
          orderNumber: overrideRequest.orderNumber
        },
        order: [['id', 'ASC']]
      });

      const boxId = orderBox?.id || null;

      // Create OrderPickScan record (like normal scan)
      if (boxId) {
        await OrderPickScan.create({
          orderNumber: overrideRequest.orderNumber,
          itemNumber: overrideRequest.itemNumber,
          qty: overrideRequest.qty,
          boxId: boxId,
          isSubsitute: false
        });
      }

      // Update Quantity_Shipped in OrderDetail (like normal scan)
      // Override approval is explicit manager action - update regardless of Confirmed status
      // Use MSSQL syntax [column] instead of PostgreSQL "column"
      await OrderDetail.update(
        {
          Quantity_Shipped: literal(`[Quantity_Shipped] + ${overrideRequest.qty}`)
        },
        {
          where: {
            Order_Number: overrideRequest.orderNumber,
            Item_Number: overrideRequest.itemNumber
          }
        }
      );

      // Update OrderPick scannedLines and scannedQty
      await OrderPick.update(
        {
          scannedLines: literal(`"scannedLines" + 1`),
          scannedQty: literal(`"scannedQty" + ${overrideRequest.qty}`)
        },
        {
          where: {
            orderNumber: overrideRequest.orderNumber
          }
        }
      );
    }

    // Note: Epick user will check status via polling API (checkOverrideRequest) every 5 seconds
    // No push notification needed

    return {
      requestId: overrideRequest.id,
      status: overrideRequest.status,
      orderNumber: overrideRequest.orderNumber,
      itemNumber: overrideRequest.itemNumber,
      requestType: overrideRequest.requestType,
      qty: overrideRequest.qty,
      updatedAt: overrideRequest.updatedAt,
    };
  }

  /**
   * Cancel override request (Distributor)
   */
  async cancelOverrideRequestByDistributor(requestId: number) {
    const overrideRequest = await OverrideRequest.findOne({
      where: {
        id: requestId,
        status: 'pending',
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!overrideRequest) {
      throw new AppError('Pending override request not found', 404);
    }

    // Update status to cancelled
    overrideRequest.status = 'cancelled';
    await overrideRequest.save();

    return {
      requestId: overrideRequest.id,
      status: overrideRequest.status,
      orderNumber: overrideRequest.orderNumber,
      itemNumber: overrideRequest.itemNumber,
      updatedAt: overrideRequest.updatedAt,
    };
  }

  /**
   * Reject override request
   */
  async rejectOverrideRequest(requestId: number, rejectionReason: string) {
    const overrideRequest = await OverrideRequest.findOne({
      where: {
        id: requestId,
        status: 'pending',
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!overrideRequest) {
      throw new AppError('Pending override request not found', 404);
    }

    // Update status
    overrideRequest.status = 'rejected';
    overrideRequest.rejectionReason = rejectionReason;
    await overrideRequest.save();

    // Note: Epick user will check status via polling API (checkOverrideRequest) every 5 seconds
    // No push notification needed

    return {
      requestId: overrideRequest.id,
      status: overrideRequest.status,
      orderNumber: overrideRequest.orderNumber,
      itemNumber: overrideRequest.itemNumber,
      rejectionReason: overrideRequest.rejectionReason,
      updatedAt: overrideRequest.updatedAt,
    };
  }

  /**
   * Send notification to all distributors (same way as web notifications)
   */
  private async sendNotificationToDistributors(overrideRequest: OverrideRequest) {
    try {
      // Get all active distributor users
      const distributors = await WebUsers.findAll({
        where: {
          role: 'distributor',
          isActive: true,
        },
        attributes: ['id'],
      });

      if (distributors.length === 0) {
        console.log('⚠️ No active distributors found for notification');
        return;
      }

      // Get item description
      const inventory = await Inventory.findOne({
        where: { Item_Number: overrideRequest.itemNumber },
        attributes: ['Description'],
      });

      const itemDescription = inventory?.Description || `Item ${overrideRequest.itemNumber}`;
      const title = 'Override Request';
      const description = `Order #${overrideRequest.orderNumber} - ${itemDescription} pass request`;

      // Send notification to each distributor (same pattern as web notifications)
      for (const distributor of distributors) {
        // Step 1: Create notification in database (same as web)
        await Notifications.create({
          userNumber: distributor.id.toString(),
          title: title,
          description: description,
          isActive: true,
        });

        // Step 2: Get device tokens (same as web)
        const findDeviceToken = await RetailerDevice.findAll({
          where: {
            customerNumber: distributor.id,
            isActive: true,
            sessionActive: true,
            isAllow: true,
          },
          attributes: ['deviceToken'],
        });

        const deviceTokens = findDeviceToken
          .map((e: any) => e.deviceToken)
          .filter((token: string) => token && token.trim() !== '');

        // Step 3: Send Firebase notification (same as web)
        if (deviceTokens.length > 0) {
          await sendMultiFCMNotification({
            tokens: deviceTokens,
            title: title,
            body: description,
            data: {
              type: 'override_request',
              requestId: overrideRequest.id.toString(),
              orderNumber: overrideRequest.orderNumber.toString(),
              itemNumber: overrideRequest.itemNumber.toString(),
              pickerUserNumber: overrideRequest.pickerUserNumber.toString(),
            },
          });
          console.log(`✅ Notification sent to distributor ${distributor.id} (${deviceTokens.length} devices)`);
        } else {
          console.log(`⚠️ No device tokens found for distributor ${distributor.id}`);
        }
      }
    } catch (error) {
      console.error('❌ Error sending notification to distributors:', error);
      // Don't throw - notification failure shouldn't break the request creation
    }
  }

  /**
   * Get all ongoing orders (for distributor/admin)
   * Returns orders with status 'in_progress' with user and order details
   * Now returns one entry per picker per order (same order can have multiple entries)
   */
  async getOngoingOrders() {
    // Query epick_confirmation instead of OrderPick to get per-picker entries
    const ongoingConfirmations = await EpickConfirmation.findAll({
      where: {
        status: 'in_progress',
      },
      order: [['startedAt', 'DESC']],
      raw: true,
    });

    if (ongoingConfirmations.length === 0) {
      return {
        total: 0,
        orders: [],
      };
    }

    // Get unique picker user IDs and order numbers
    const pickerUserIds = Array.from(
      new Set(
        ongoingConfirmations
          .map((conf: any) => conf.pickerUserId)
          .filter((id: any) => id !== null && id !== undefined)
      )
    );
    const orderNumbers = Array.from(
      new Set(ongoingConfirmations.map((conf: any) => conf.orderNumber))
    );

    const allRequests = await OverrideRequest.findAll({
      where: {
        orderNumber: { [Op.in]: orderNumbers },
        status: 'pending',
        requestType: 'pass',
      },
    });

    // Create a map of orderNumber -> hasPendingPassRequest
    const orderPassRequestMap: { [key: number]: boolean } = {};
    allRequests.forEach((req: any) => {
      orderPassRequestMap[req.orderNumber] = true;
    });

    // Fetch picker user information from EpickUser table
    const pickers = await EpickUser.findAll({
      where: {
        id: { [Op.in]: pickerUserIds },
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'userNumber', 'category'],
      raw: true,
    });

    // Create picker map keyed by id
    const pickerMap: any = {};
    pickers.forEach((picker: any) => {
      pickerMap[picker.id] = picker;
    });

    // Fetch OrderPick data for additional info (totalLines, scannedLines, etc.)
    const orderPickMap: any = {};
    const orderPicks = await OrderPick.findAll({
      where: {
        orderNumber: { [Op.in]: orderNumbers },
      },
      raw: true,
    });
    orderPicks.forEach((op: any) => {
      orderPickMap[op.orderNumber] = op;
    });

    // Fetch order headers and customer details
    let orderHeaderMap: any = {};

    if (orderNumbers.length > 0) {
      const orderHeaders = await OrderHeader.findAll({
        where: {
          Order_Number: { [Op.in]: orderNumbers },
        },
        attributes: ['Order_Number', 'Order_Date'],
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

      // Create maps for quick lookup
      orderHeaders.forEach((header: any) => {
        orderHeaderMap[header.Order_Number] = {
          orderDate: header.Order_Date,
          customer: header.customer ? {
            customerNumber: header.customer.C_Number,
            customerName: header.customer.C_Name,
            routes: header.customer.Routes || [],
          } : null,
        };
      });
    }

    // Get category names
    const allCategoryIds = new Set<number>();
    ongoingConfirmations.forEach((conf: any) => {
      const cats = conf.category || [];
      cats.forEach((cat: number) => allCategoryIds.add(cat));
    });

    let categoryNameMap: { [key: number]: string } = {};
    if (allCategoryIds.size > 0) {
      const categories = await SalesCategory.findAll({
        where: {
          Sales_Category: { [Op.in]: Array.from(allCategoryIds) }
        },
        attributes: ['Sales_Category', 'Category_Desc'],
        raw: true
      });
      categories.forEach((cat: any) => {
        categoryNameMap[cat.Sales_Category] = cat.Category_Desc;
      });
    }

    // Group confirmations by orderNumber to avoid duplicates
    const confirmationsByOrder: { [key: number]: any[] } = {};
    ongoingConfirmations.forEach((conf: any) => {
      const orderNum = conf.orderNumber;
      if (!confirmationsByOrder[orderNum]) {
        confirmationsByOrder[orderNum] = [];
      }
      confirmationsByOrder[orderNum].push(conf);
    });

    // Format response - one entry per order with array of pickers
    const result = Object.keys(confirmationsByOrder).map((orderNumStr: string) => {
      const orderNum = Number(orderNumStr);
      const orderConfirmations = confirmationsByOrder[orderNum];
      const orderInfo = orderHeaderMap[orderNum] || {};
      const orderPick = orderPickMap[orderNum] || {};
      
      // Build pickers array for this order
      const pickers = orderConfirmations.map((conf: any) => {
        const picker = pickerMap[conf.pickerUserId];
        const categoryNames = (conf.category || []).map((catId: number) => 
          categoryNameMap[catId] || `Category ${catId}`
        );

        return {
          confirmationId: conf.id,
          pickerId: picker?.id || null,
          pickerName: picker ? `${picker.firstName || ''} ${picker.lastName || ''}`.trim() : null,
          pickerEmail: picker?.email || null,
          pickerUserNumber: picker?.userNumber || conf.pickerUserNumber || null,
          categories: conf.category || [],
          categoryNames: categoryNames,
          status: conf.status,
          startedAt: conf.startedAt,
          createdAt: conf.createdAt,
          updatedAt: conf.updatedAt,
        };
      });

      return {
        orderNumber: orderNum,
        
        // Customer info (same for all pickers)
        customerNumber: orderPick.customerNumber || null,
        customerName: orderInfo.customer?.customerName || null,
        routes: orderInfo.customer?.routes || [],
        orderDate: orderInfo.orderDate || null,
        
        // Order progress (shared across all pickers for this order)
        totalLines: orderPick.totalLines || 0,
        totalQty: parseFloat(orderPick.totalQty) || 0,
        scannedLines: orderPick.scannedLines || 0,
        scannedQty: parseFloat(orderPick.scannedQty) || 0,
        outOfStockItems: orderPick.OutOfStockItem || 0,
        notes: orderPick.notes || null,
        
        // Flags
        flagPass: orderPassRequestMap[orderNum] || false,
        
        // Array of pickers working on this order
        pickers: pickers,
      };
    });

    return {
      total: result.length,
      orders: result,
    };
  }

  /**
   * Remove/delete an ongoing order for a specific picker (for distributor/admin)
   * Now accepts optional pickerId to remove only that picker's confirmation
   * If no pickerId provided, removes all pickers from the order
   * 
   * Logic:
   * - If picker specified: Delete only that picker's epick_confirmation
   * - If last picker: Delete OrderPick, RecordLock, and all related data
   * - If other pickers remain: Keep OrderPick and RecordLock
   */
  async removeOngoingOrder(orderNumber: number, pickerId?: number) {
    // Check if order has any in_progress confirmations
    const existingConfirmations = await EpickConfirmation.findAll({
      where: {
        orderNumber: orderNumber,
        status: 'in_progress',
      },
    });

    if (existingConfirmations.length === 0) {
      throw new AppError('No ongoing order found for this order number', 404);
    }

    // If pickerId is provided, remove only that picker's confirmation
    if (pickerId) {
      const pickerConfirmation = existingConfirmations.find(
        (conf: any) => conf.pickerUserId === pickerId
      );

      if (!pickerConfirmation) {
        throw new AppError('Picker is not working on this order', 404);
      }

      // Delete this picker's confirmation
      await EpickConfirmation.destroy({
        where: {
          orderNumber: orderNumber,
          pickerUserId: pickerId,
          status: 'in_progress',
        },
      });

      // Check if any other pickers remain
      const remainingConfirmations = await EpickConfirmation.findAll({
        where: {
          orderNumber: orderNumber,
          status: 'in_progress',
        },
      });

      // If no other pickers remain, clean up everything
      if (remainingConfirmations.length === 0) {
        await this.cleanupOrderData(orderNumber);
      }

      return {
        message: `Picker removed from order successfully`,
        orderNumber: orderNumber,
        pickerId: pickerId,
        remainingPickers: remainingConfirmations.length,
      };
    }

    // If no pickerId provided, remove ALL pickers from this order
    // Delete all in_progress confirmations for this order
    await EpickConfirmation.destroy({
      where: {
        orderNumber: orderNumber,
        status: 'in_progress',
      },
    });

    // Clean up all order data
    await this.cleanupOrderData(orderNumber);

    return {
      message: 'Ongoing order removed successfully (all pickers)',
      orderNumber: orderNumber,
    };
  }

  /**
   * Helper: Clean up all order-related data when no pickers remain
   */
  private async cleanupOrderData(orderNumber: number) {
    // 1. Delete all scans for this order
    await OrderPickScan.destroy({
      where: {
        orderNumber: orderNumber,
      },
    });

    // 2. Delete all boxes for this order
    await OrderPickBox.destroy({
      where: {
        orderNumber: orderNumber,
      },
    });

    // 3. Delete all pass scan items for this order
    await PassScanItem.destroy({
      where: {
        orderNumber: orderNumber,
      },
    });

    // 4. Delete all override requests for this order
    await OverrideRequest.destroy({
      where: {
        orderNumber: orderNumber,
      },
    });

    // 5. Delete the order pick record
    await OrderPick.destroy({
      where: {
        orderNumber: orderNumber,
      },
    });

    // 6. Delete from Record_Locks (MSSQL) - this makes the order visible again in getOrder
    await RecordLock.destroy({
      where: {
        Lock_Type: 0,
        Lock_Number: orderNumber,
      },
    });

    // 7. Reset Quantity_Shipped in Order_Detail (reset to 0)
    // This ensures clean state if order is accepted again
    await OrderDetail.update(
      { Quantity_Shipped: 0 },
      {
        where: {
          Order_Number: orderNumber,
        },
      }
    );

    // 8. Reset Confirmed to 0 in Order_Detail
    // This ensures items can be picked again
    await OrderDetail.update(
      { Confirmed: 0 },
      {
        where: {
          Order_Number: orderNumber,
        },
      }
    );
  }
}



