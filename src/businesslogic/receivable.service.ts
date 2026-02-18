import { POHeader } from "../models/mmsql/poHeader.model";
import { RecordLock } from "../models/mmsql/recordLocks.model";
import { Op } from "sequelize";
import moment from "moment";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { ReceivableUser } from "../models/postgres/receivableUser.model";
import { ReceivablePick } from "../models/postgres/receivablePick.model";
import { RolePermission } from "../models/postgres/rolesPermission.model";
import { comparePassword, generateToken } from "../utils/helper";
import { AppError } from "../utils/AppError";
import { AuthMessage } from "../constants";
import Setting from "../models/postgres/setting.model";
import { Distributor } from "../models/mmsql/distributor.model";
import { PODetail } from "../models/mmsql/poDetail.model";
import { Inventory } from "../models/mmsql/inventory.model";
import { InventoryUPC } from "../models/mmsql/inventoryUpc.model";
import { ProductImage } from "../models/postgres/product.model";
import { Vendor } from "../models/mmsql/vendor.model";
import { Terms } from "../models/mmsql/invoiceTerm.model";

export class ReceivableService {

    /**
     * Get all Purchase Orders (PO_Header) where:
     * - PO_Posted = 0 (not posted)
     * - Confirmed = 0 (not confirmed)
     * Excludes orders that are locked in Record_Locks with Lock_Type = 1
     */
    async getOrders(query: PaginationOptions = {}) {
        // Parse pagination parameters
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const offset = (page - 1) * limit;

        // Step 1: Get all locked order numbers with Lock_Type = 1
        const lockedOrders = await RecordLock.findAll({
            where: {
                Lock_Type: 1
            },
            attributes: ['Lock_Number'],
            raw: true
        });

        const lockedOrderNumbers = lockedOrders.map((lock: any) => lock.Lock_Number);

        // Step 2: Build where condition for PO_Header
        const whereCondition: any = {
            PO_Posted: false,  // PO_Posted = 0
            Confirmed: false,  // Confirmed = 0
            Receiving_Code: 'P'  // Receiving_Code = 'P'
        };

        // Exclude locked orders if any exist
        if (lockedOrderNumbers.length > 0) {
            whereCondition.PO_Number = {
                [Op.notIn]: lockedOrderNumbers
            };
        }

        // Step 3: Get PO_Header records with pagination - Only return essential fields
        const { count: totalCount, rows: orders } = await POHeader.findAndCountAll({
            where: whereCondition,
            attributes: [
                'PO_Number',
                'PO_Date',
                'PO_Source',
                'PO_Posted',
                'PO_Type',
                'Confirmed',
                'Date_Received',
                'Primary_Vendor',
                'Invoice_Number',
                'Invoice_Date',
                'PO_Message',
                'PO_Status',
                'Ship_Date',
                'PO_Total',
                'CreatedBy',
                'PO_Deleted'
            ],
            include: [
                {
                    model: Vendor,
                    as: 'vendor',
                    attributes: ['Primary_Vendor', 'V_Description', 'V_Addr1', 'V_City', 'V_State', 'V_Zip', 'V_Phone'],
                    required: false, // LEFT JOIN - return orders even if vendor doesn't exist
                }
            ],
            order: [['PO_Number', 'DESC']], // Order by PO_Number descending (newest first)
            limit: limit,
            offset: offset,
        });

        // Format the response to include vendor name
        const formattedOrders = orders.map((order: any) => {
            const orderData: any = {
                PO_Number: order.PO_Number,
                PO_Date: order.PO_Date,
                PO_Source: order.PO_Source,
                PO_Posted: order.PO_Posted,
                PO_Type: order.PO_Type,
                Confirmed: order.Confirmed,
                Date_Received: order.Date_Received,
                Primary_Vendor: order.Primary_Vendor,
                Vendor_Name: order.vendor?.V_Description || null,
                Vendor_Address: order.vendor?.V_Addr1 || order.vendor?.V_Addr2 || null,
                Invoice_Number: order.Invoice_Number,
                Invoice_Date: order.Invoice_Date,
                PO_Message: order.PO_Message,
                PO_Status: order.PO_Status,
                Ship_Date: order.Ship_Date,
                PO_Total: order.PO_Total,
                CreatedBy: order.CreatedBy,
                PO_Deleted: order.PO_Deleted
            };
            return orderData;
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / limit);

        return {
            data: formattedOrders,
            pagination: {
                page: page,
                limit: limit,
                total: totalCount,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        };
    }

    /**
     * Get Invoice_Terms - returns only records where TermsType = 1
     */
    async getInvoiceTerms() {
        const terms = await Terms.findAll({
            where: { TermsType: 1 },
            attributes: ['TermsCode', 'Terms', 'DaysUntilDue', 'TermsType'],
            order: [['Terms', 'ASC']],
            raw: true
        });
        return terms;
    }

    /**
     * Get PO orders with date range - same data shape as getOrders (all PO_Header fields + vendor + Invoice_Number).
     * Returns only PO_Header where Confirmed = 1.
     * PO list is determined by completed ReceivablePicks in the given fromDate/toDate (and optional userId).
     * Pagination: page, limit.
     */
    async getUserReportWithDateRange(
        userId: number | null,
        fromDate: string | Date | null,
        toDate: string | Date | null,
        page: number = 1,
        limit: number = 10
    ) {
        const whereCondition: any = { status: 'completed' };
        if (userId) {
            whereCondition.pickerId = userId;
        }
        if (fromDate || toDate) {
            whereCondition.completedAt = {};
            if (fromDate) {
                whereCondition.completedAt[Op.gte] = moment(fromDate).startOf('day').toDate();
            }
            if (toDate) {
                whereCondition.completedAt[Op.lte] = moment(toDate).endOf('day').toDate();
            }
        }

        const completedPicks = await ReceivablePick.findAll({
            where: whereCondition,
            attributes: ['poNumber'],
            order: [['completedAt', 'DESC']],
            raw: true
        });

        const poNumbers = Array.from(new Set(completedPicks.map((p: any) => p.poNumber)));

        if (poNumbers.length === 0) {
            return {
                data: [],
                pagination: {
                    page: 1,
                    limit,
                    total: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false
                }
            };
        }

        // Get PO_Header for these POs where Confirmed = 1, same attributes and shape as getOrders (includes Invoice_Number)
        const orders = await POHeader.findAll({
            where: {
                PO_Number: { [Op.in]: poNumbers },
                Confirmed: true
            },
            attributes: [
                'PO_Number',
                'PO_Date',
                'PO_Source',
                'PO_Posted',
                'PO_Type',
                'Confirmed',
                'Date_Received',
                'Primary_Vendor',
                'Invoice_Number',
                'Invoice_Date',
                'PO_Message',
                'PO_Status',
                'Ship_Date',
                'PO_Total',
                'CreatedBy',
                'PO_Deleted'
            ],
            include: [
                {
                    model: Vendor,
                    as: 'vendor',
                    attributes: ['Primary_Vendor', 'V_Description', 'V_Addr1', 'V_Addr2', 'V_City', 'V_State', 'V_Zip', 'V_Phone'],
                    required: false
                }
            ],
            order: [['PO_Number', 'DESC']]
        });

        const formattedOrders = orders.map((order: any) => ({
            PO_Number: order.PO_Number,
            PO_Date: order.PO_Date,
            PO_Source: order.PO_Source,
            PO_Posted: order.PO_Posted,
            PO_Type: order.PO_Type,
            Confirmed: order.Confirmed,
            Date_Received: order.Date_Received,
            Primary_Vendor: order.Primary_Vendor,
            Vendor_Name: order.vendor?.V_Description || null,
            Vendor_Address: order.vendor?.V_Addr1 || order.vendor?.V_Addr2 || null,
            Invoice_Number: order.Invoice_Number,
            Invoice_Date: order.Invoice_Date,
            PO_Message: order.PO_Message,
            PO_Status: order.PO_Status,
            Ship_Date: order.Ship_Date,
            PO_Total: order.PO_Total,
            CreatedBy: order.CreatedBy,
            PO_Deleted: order.PO_Deleted
        }));

        const totalCount = formattedOrders.length;
        const totalPages = Math.ceil(totalCount / limit) || 0;
        const offset = (page - 1) * limit;
        const dataPage = formattedOrders.slice(offset, offset + limit);

        return {
            data: dataPage,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        };
    }

    /**
     * Login for Receivable users
     * Authenticates user with email and password
     */
    async login(body: { email: string; password: string }) {
        // 1️⃣ Find user in receivable_user table
        const isUserExist = await ReceivableUser.findOne({
            where: {
                email: body.email.toLowerCase(),
            },
        });

        // 2️⃣ Fetch logo from settings
        //    const logo: any = await Setting.findOne({ attributes: ["warehouseImage"] });

        if (!isUserExist) {
            throw new AppError(AuthMessage.USER_NOT_FOUND, 400);
        }

        // 3️⃣ Compare password
        const checkPassword = await comparePassword(body.password, isUserExist.password);
        if (!checkPassword) {
            throw new AppError(AuthMessage.INVALID_PASS_EMAIL, 400);
        }

        // 4️⃣ Generate token
        const token = generateToken({
            id: isUserExist.id,
            role: "receivable",
            userNumber: isUserExist.userNumber,
        });

        // 5️⃣ Get role permissions
        const getUserRolesPermissions = await RolePermission.findAll({
            where: { userId: isUserExist.id },
        });
        const filtered = getUserRolesPermissions.filter(
            (perm: any) => perm.add || perm.edit || perm.view
        );

        // 6️⃣ Get Distributor details
        const wholeStoreDetail = await Distributor.findOne({
            attributes: ["D_Name", "D_Addr1", "D_City", "D_State", "D_Phone", "PM_ID"],
        });

        // 7️⃣ Final Response
        return {
            token: token,
            rolesPermission: filtered,
            //    logo: logo?.warehouseImage || null,
            role: "receivable",
            profile: {
                id: isUserExist.id,
                email: isUserExist.email,
                firstName: isUserExist.firstName,
                lastName: isUserExist.lastName,
                userNumber: isUserExist.userNumber,
            },
            wholeStoreDetail: wholeStoreDetail,
        };
    }

    /**
     * Accept Order - Create a lock in Record_Locks with Lock_Type = 1
     * This locks the order so it won't appear in the getOrders list
     */
    async acceptOrder(poNumber: number, userId: number) {
        // Get user to get userNumber from receivable_user table
        const user = await ReceivableUser.findByPk(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Check if order is already locked with Lock_Type = 1
        const existingLock = await RecordLock.findOne({
            where: {
                Lock_Number: poNumber,
                Lock_Type: 1
            }
        });

        if (existingLock) {
            throw new AppError('Order is already locked', 400);
        }

        // Verify the PO exists and matches criteria (PO_Posted = 0, Confirmed = 0)
        const poHeader = await POHeader.findOne({
            where: {
                PO_Number: poNumber,
                PO_Posted: false,
                Confirmed: false
            }
        });

        if (!poHeader) {
            throw new AppError('Purchase Order not found or does not meet criteria', 404);
        }

        // Create lock entry
        const lock = await RecordLock.create({
            Lock_Type: 1,
            Lock_Number: Number(poNumber),
            Lock_User: Number(user.userNumber ?? 0),
            Lock_Workstation: 0
        });

        // Check if receivable_pick entry already exists for this PO
        const existingPick = await ReceivablePick.findOne({
            where: {
                poNumber: poNumber
            }
        });

        // Create receivable_pick entry if it doesn't exist
        let receivablePick;
        if (!existingPick) {
            receivablePick = await ReceivablePick.create({
                poNumber: poNumber,
                pickerId: userId,
                customerNumber: poHeader.Primary_Vendor || 0, // Use Primary_Vendor as customerNumber
                status: 'in_progress',
                startedAt: new Date()
            });
        } else {
            // Update existing entry if it exists
            receivablePick = await existingPick.update({
                pickerId: userId,
                status: 'in_progress',
                startedAt: new Date()
            });
        }

        // Update PO header: mark as epo created
        await poHeader.update({ epoCreated: true });

        return {
            message: 'Order accepted and locked successfully',
            lock: {
                myKey: lock.myKey,
                Lock_Type: lock.Lock_Type,
                Lock_Number: lock.Lock_Number,
                Lock_User: lock.Lock_User
            },
            receivablePick: {
                id: receivablePick.id,
                poNumber: receivablePick.poNumber,
                pickerId: receivablePick.pickerId,
                customerNumber: receivablePick.customerNumber,
                status: receivablePick.status,
                startedAt: receivablePick.startedAt
            }
        };
    }

    /**
     * Exit Order - Remove lock from Record_Locks and delete entry from ReceivablePick
     * This unlocks the order so it will appear in the getOrders list again
     */
    async exitOrder(poNumber: number, userId: number) {
        // Get user to verify
        const user = await ReceivableUser.findByPk(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Find the lock for this PO
        const lock = await RecordLock.findOne({
            where: {
                Lock_Number: poNumber,
                Lock_Type: 1
            }
        });

        if (!lock) {
            throw new AppError('Order is not locked', 400);
        }

        // Verify the lock belongs to this user (check by userNumber)
        if (Number(lock.Lock_User) !== Number(user.userNumber ?? 0)) {
            throw new AppError('You do not have permission to exit this order', 403);
        }

        // Find the receivable_pick entry
        const receivablePick = await ReceivablePick.findOne({
            where: {
                poNumber: poNumber,
                pickerId: userId
            }
        });

        // Delete the lock
        await lock.destroy();

        // Delete the receivable_pick entry if it exists
        if (receivablePick) {
            await receivablePick.destroy();
        }

        return {
            message: 'Order exited successfully',
            poNumber: poNumber
        };
    }

    /**
     * Complete Order - Update PO_Detail Quantity_Recd per item, set PO_Header Confirmed=1, remove lock, set ReceivablePick completed
     */
    async completeOrder(poNumber: number, userId: number, items: { itemNumber: number; quantity: number }[]) {
        const user = await ReceivableUser.findByPk(userId);
        if (!user) {
            throw new AppError('User not found or not authorized', 404);
        }

        const lock = await RecordLock.findOne({
            where: {
                Lock_Number: poNumber,
                Lock_Type: 1,
                Lock_User: Number(user.userNumber ?? 0)
            }
        });

        if (!lock) {
            throw new AppError('Order is not locked by you. Please accept the order first.', 403);
        }

        // Update Quantity_Recd in PO_Detail for each item
        const updatedItems: { itemNumber: number; quantity: number; updated: boolean }[] = [];
        for (const { itemNumber, quantity } of items) {
            const [affectedCount] = await PODetail.update(
                { Quantity_Recd: quantity },
                { where: { PO_Number: poNumber, Item_Number: itemNumber } }
            );
            updatedItems.push({
                itemNumber,
                quantity,
                updated: (affectedCount as number) > 0
            });
        }

        // Set PO_Header Confirmed = 1, epoApplied = true, epoUser = receivable user id
        await POHeader.update(
            { Confirmed: true, epoApplied: true, epoUser: userId },
            { where: { PO_Number: poNumber } }
        );

        const receivablePick = await ReceivablePick.findOne({
            where: { poNumber, pickerId: userId }
        });

        if (receivablePick) {
            await receivablePick.update({
                status: 'completed',
                completedAt: new Date()
            });
        }

        await lock.destroy();

        return {
            message: 'Order completed successfully',
            poNumber,
            confirmed: true,
            itemsUpdated: updatedItems,
            receivablePick: receivablePick ? {
                id: receivablePick.id,
                poNumber: receivablePick.poNumber,
                status: 'completed',
                completedAt: receivablePick.completedAt
            } : null
        };
    }

    /**
     * Helper function: Sort items array based on item_sort_by preference
     * @param items - Array of formatted items
     * @param itemSortBy - Sort type: 'sales_location' | 'section_location' | 'sales_section_location' | 'alphabetically' | 'item_number' | 'short_number' | 'line_number'
     * @returns Sorted array of items
     */
    private sortOrderItems(items: any[], itemSortBy: string): any[] {
        const sortedItems = [...items]; // Create a copy to avoid mutating original

        switch (itemSortBy) {
            case 'section_location':
                // Sort by Section ASC, then Location ASC within each section
                // NULL/empty/0 values for Section and Location appear last
                sortedItems.sort((a, b) => {
                    const sectionA = a.inventory?.Section || '';
                    const sectionB = b.inventory?.Section || '';
                    const locationA = a.inventory?.Location || 0;
                    const locationB = b.inventory?.Location || 0;

                    // Handle null/empty sections
                    const sectionCompare = (sectionA || 'ZZZZZ').localeCompare(sectionB || 'ZZZZZ');
                    if (sectionCompare !== 0) return sectionCompare;

                    // Handle null/0 locations
                    const locationAVal = locationA || 999999;
                    const locationBVal = locationB || 999999;
                    return locationAVal - locationBVal;
                });
                break;

            case 'sales_section_location':
                // Sort by Sales_Category ASC first, then Section ASC, then Location ASC
                sortedItems.sort((a, b) => {
                    const categoryA = a.inventory?.Sales_Category || 0;
                    const categoryB = b.inventory?.Sales_Category || 0;
                    if (categoryA !== categoryB) return categoryA - categoryB;

                    const sectionA = a.inventory?.Section || '';
                    const sectionB = b.inventory?.Section || '';
                    const sectionCompare = (sectionA || 'ZZZZZ').localeCompare(sectionB || 'ZZZZZ');
                    if (sectionCompare !== 0) return sectionCompare;

                    const locationA = a.inventory?.Location || 0;
                    const locationB = b.inventory?.Location || 0;
                    const locationAVal = locationA || 999999;
                    const locationBVal = locationB || 999999;
                    return locationAVal - locationBVal;
                });
                break;

            case 'alphabetically':
                // Sort by Description ASC
                sortedItems.sort((a, b) => {
                    const descA = a.inventory?.Description || '';
                    const descB = b.inventory?.Description || '';
                    return descA.localeCompare(descB);
                });
                break;

            case 'item_number':
                // Sort by Item_Number ASC
                sortedItems.sort((a, b) => {
                    const itemA = a.Item_Number || 0;
                    const itemB = b.Item_Number || 0;
                    return itemA - itemB;
                });
                break;

            case 'short_number':
                // Sort by Sequence ASC from Inventory table
                sortedItems.sort((a, b) => {
                    const seqA = a.inventory?.Sequence || 0;
                    const seqB = b.inventory?.Sequence || 0;
                    return seqA - seqB;
                });
                break;

            case 'line_number':
            default:
                // Default: Sort by Line_Number ASC
                sortedItems.sort((a, b) => {
                    const lineA = a.Line_Number || 0;
                    const lineB = b.Line_Number || 0;
                    return lineA - lineB;
                });
                break;
        }

        return sortedItems;
    }

    /**
     * Get the first item from a purchase order based on user's item_sort_by preference
     * Similar to epick's getOrderItemFirst but for receivable/Purchase Orders
     */
    async getFirstItem(poNumber: number, userId: number) {
        // Verify the PO exists
        const poHeader = await POHeader.findOne({
            where: {
                PO_Number: poNumber
            }
        });

        if (!poHeader) {
            throw new AppError('Purchase Order not found', 404);
        }

        // Get user's item_sort_by preference from receivable_user table
        const user = await ReceivableUser.findByPk(userId, {
            attributes: ['id', 'item_sort_by']
        });
        const itemSortBy = user?.item_sort_by || 'line_number';

        // Get all PODetail records
        const orderItems = await PODetail.findAll({
            where: {
                PO_Number: poNumber
            },
            attributes: [
                'Line_Number',
                'Item_Number',
                'Quantity_Ordered',
                'Quantity_Recd',
                'Quantity_RecdDamaged',
                'Unit_Code',
                'Pack',
            ],
            raw: false,
        });

        if (!orderItems || orderItems.length === 0) {
            return null;
        }

        // Get all unique Item_Numbers
        const itemNumbers = orderItems
            .map((item: any) => item.Item_Number)
            .filter((itemNum: any) => itemNum !== null && itemNum !== undefined);

        if (itemNumbers.length === 0) {
            return null;
        }

        // Fetch Inventory records
        const inventoryRecords = await Inventory.findAll({
            where: {
                Item_Number: { [Op.in]: itemNumbers }
            },
            attributes: ['Item_Number', 'Description', 'Pack', 'CaseCount', 'UOM', 'Section', 'Location', 'Sales_Category', 'Sequence'],
            include: [
                {
                    model: InventoryUPC,
                    as: 'UPCList',
                    attributes: ['UPC_Number', 'Status'],
                    required: false,
                }
            ]
        });

        // Create maps for quick lookup
        const inventoryMap = new Map(
            inventoryRecords.map((inv: any) => [inv.Item_Number, inv])
        );

        // Get product images (same pattern as home.service.ts)
        const productImages = await ProductImage.findAll({
            where: {
                product_number: { [Op.in]: itemNumbers.map(String) },
                isAllow: true
            }
        });
        const imageMap = new Map(productImages.map((img: any) => [String(img.product_number), img]));

        // Format all items
        const formattedItems = orderItems.map((item: any) => {
            const inventory = item.Item_Number ? inventoryMap.get(item.Item_Number) : null;

            // Transform UPCList to group by Status
            const upcList = inventory?.UPCList || [];
            const groupedUPC: any = {
                primaryUPC: null,
                retailUPC: null,
                caseUPC: null
            };

            upcList.forEach((upc: any) => {
                const upcNumber = upc.UPC_Number || upc.dataValues?.UPC_Number;
                const status = upc.Status !== undefined ? upc.Status : upc.dataValues?.Status;

                if (status === 0) {
                    groupedUPC.primaryUPC = upcNumber;
                } else if (status === 2) {
                    groupedUPC.retailUPC = upcNumber;
                } else if (status === 1 || status === 3) {
                    groupedUPC.caseUPC = upcNumber;
                }
            });

            const itemStr = item.Item_Number != null ? String(item.Item_Number) : '';
            const productImage = imageMap.get(itemStr) || null;

            // Same as home.service.ts: showDistributorImage, distributorImage, masterImage
            const firstUPC = upcList[0] && (upcList[0].UPC_Number ?? upcList[0].dataValues?.UPC_Number);
            const masterImage = `${process.env.AZUREIMAGESERVER || ''}${firstUPC || ''}.jpg`;

            return {
                Line_Number: item.Line_Number,
                Item_Number: item.Item_Number,
                Quantity_Ordered: item.Quantity_Ordered,
                Quantity_Recd: item.Quantity_Recd,
                Quantity_RecdDamaged: item.Quantity_RecdDamaged,
                Unit_Code: item.Unit_Code,
                Pack: item.Pack,
                showDistributorImage: productImage?.isAllow ?? false,
                distributorImage: productImage?.img_url || null,
                masterImage,
                inventory: inventory ? {
                    Item_Number: inventory.Item_Number,
                    Description: inventory.Description,
                    Pack: inventory.Pack,
                    CaseCount: inventory.CaseCount,
                    UOM: inventory.UOM,
                    Section: inventory.Section,
                    Location: inventory.Location,
                    Sales_Category: inventory.Sales_Category,
                    Sequence: inventory.Sequence,
                    UPCList: groupedUPC.primaryUPC || groupedUPC.retailUPC || groupedUPC.caseUPC ? groupedUPC : null
                } : null,
               
            };
        });

        // Sort items based on user's preference
        const sortedItems = this.sortOrderItems(formattedItems, itemSortBy);

        // Return the first item (or null if no items)
        return sortedItems.length > 0 ? sortedItems[0] : null;
    }

    async getOrderItems(poNumber: number, userId: number) {
        const poHeader = await POHeader.findOne({
            where: {
                PO_Number: poNumber
            }
        });

        if (!poHeader) {
            throw new AppError('Purchase Order not found', 404);
        }

        // First, get all PODetail records without any includes to ensure we get all items
        const orderItems = await PODetail.findAll({
            where: {
                PO_Number: poNumber
            },
            attributes: [
                'Line_Number',
                'Item_Number',
                'Quantity_Ordered',
                'Quantity_Recd',
                'Quantity_RecdDamaged',
                'Unit_Code',
                'Pack',
            ],
            raw: false, // Keep as Sequelize instances
        });

        // Get all unique Item_Numbers from the PODetail records
        const itemNumbers = orderItems
            .map((item: any) => item.Item_Number)
            .filter((itemNum: any) => itemNum !== null && itemNum !== undefined);

        // Fetch Inventory records separately for all items
        const inventoryRecords = itemNumbers.length > 0 ? await Inventory.findAll({
            where: {
                Item_Number: { [Op.in]: itemNumbers }
            },
            attributes: ['Item_Number', 'Description', 'Pack', 'CaseCount', 'UOM', 'Section', 'Location', 'Sales_Category', 'Sequence'],
            include: [
                {
                    model: InventoryUPC,
                    as: 'UPCList',
                    attributes: ['UPC_Number', 'Status'],
                    required: false,
                }
            ]
        }) : [];

        // Create maps for quick lookup
        const inventoryMap = new Map(
            inventoryRecords.map((inv: any) => [inv.Item_Number, inv])
        );

        // Get product images (same pattern as getFirstItem / home.service.ts)
        const productImages = itemNumbers.length > 0 ? await ProductImage.findAll({
            where: {
                product_number: { [Op.in]: itemNumbers.map(String) },
                isAllow: true
            }
        }) : [];
        const imageMap = new Map(productImages.map((img: any) => [String(img.product_number), img]));

        // Format the response
        const formattedItems = orderItems.map((item: any) => {
            // Get inventory for this item from the map
            const inventory = item.Item_Number ? inventoryMap.get(item.Item_Number) : null;

            // Transform UPCList to group by Status: 0=primary, 2=retail, 1 or 3=case
            const upcList = inventory?.UPCList || [];
            const groupedUPC: any = {
                primaryUPC: null,
                retailUPC: null,
                caseUPC: null
            };

            upcList.forEach((upc: any) => {
                const upcNumber = upc.UPC_Number || upc.dataValues?.UPC_Number;
                const status = upc.Status !== undefined ? upc.Status : upc.dataValues?.Status;

                if (status === 0) {
                    groupedUPC.primaryUPC = upcNumber;
                } else if (status === 2) {
                    groupedUPC.retailUPC = upcNumber;
                } else if (status === 1 || status === 3) {
                    groupedUPC.caseUPC = upcNumber;
                }
            });

            const itemStr = item.Item_Number != null ? String(item.Item_Number) : '';
            const productImage = imageMap.get(itemStr) || null;
            const firstUPC = upcList[0] && (upcList[0].UPC_Number ?? upcList[0].dataValues?.UPC_Number);
            const masterImage = `${process.env.AZUREIMAGESERVER || ''}${firstUPC || ''}.jpg`;

            return {
                Line_Number: item.Line_Number,
                Item_Number: item.Item_Number,
                Quantity_Ordered: item.Quantity_Ordered,
                Quantity_Recd: item.Quantity_Recd,
                Quantity_RecdDamaged: item.Quantity_RecdDamaged,
                Unit_Code: item.Unit_Code,
                Pack: item.Pack,
                showDistributorImage: productImage?.isAllow ?? false,
                distributorImage: productImage?.img_url || null,
                masterImage,
                inventory: inventory ? {
                    Item_Number: inventory.Item_Number,
                    Description: inventory.Description,
                    Pack: inventory.Pack,
                    CaseCount: inventory.CaseCount,
                    UOM: inventory.UOM,
                    Section: inventory.Section,
                    Location: inventory.Location,
                    Sales_Category: inventory.Sales_Category,
                    UPCList: groupedUPC.primaryUPC || groupedUPC.retailUPC || groupedUPC.caseUPC ? groupedUPC : null
                } : null
            };
        });

        // Get user's item_sort_by preference from receivable_user table
        const user = await ReceivableUser.findByPk(userId, {
            attributes: ['id', 'item_sort_by']
        });
        const itemSortBy = user?.item_sort_by || 'line_number';

        // Sort items based on user's preference
        const sortedItems = this.sortOrderItems(formattedItems, itemSortBy);

        // Calculate total quantity (sum of all Quantity_Ordered)
        const totalQty = sortedItems.reduce((sum: number, item: any) => {
            return sum + (parseFloat(item.Quantity_Ordered) || 0);
        }, 0);

        // Calculate total received quantity (sum of all Quantity_Recd)
        const totalReceivedQty = sortedItems.reduce((sum: number, item: any) => {
            return sum + (parseFloat(item.Quantity_Recd) || 0);
        }, 0);

        // Create order summary
        const orderSummary = {
            totalItems: sortedItems.length,
            totalQty: totalQty,
            totalReceivedQty: totalReceivedQty,
            lineNumbers: sortedItems.length
        };

        // PO Info (dates, invoice, type, charges)
        const poInfo = {
            shipDate: poHeader.Ship_Date,
            invoiceDate: poHeader.Invoice_Date,
            deliveryReqDate: (poHeader as any).Requested_Delivery_Date || (poHeader as any).FTP_REQ_Date || null,
            invoiceNumber: poHeader.Invoice_Number,
            type: poHeader.PO_Type,
            freightDeliveryCharge: (poHeader as any).PO_DeliveryCharge ?? null,
            discounts: (poHeader as any).PO_Discounts ?? null,
            miscChargeDiscount1: (poHeader as any).PO_MiscCharge ?? null,
            miscChargeDiscount2: (poHeader as any).PO_MiscCharge2 ?? null
        };

        // Vendor Terms: Vendor.TermsCode (or V_Terms) -> Invoice_Terms.TermsCode -> Terms string
        let vendorTerms: string | null = null;
        const vendor = await Vendor.findByPk(poHeader.Primary_Vendor ?? 0, {
            attributes: ['Primary_Vendor', 'V_Terms', 'TermsCode']
        });
        if (vendor) {
            const termsCode = vendor.TermsCode ?? (vendor.V_Terms != null && vendor.V_Terms !== '' ? Number(vendor.V_Terms) : null);
            if (termsCode != null && !Number.isNaN(termsCode)) {
                const invoiceTermsRow = await Terms.findByPk(termsCode, { attributes: ['Terms'] });
                vendorTerms = invoiceTermsRow?.Terms ?? null;
            }
        }

        // Shipping Info
        const shippingInfo = {
            comment: poHeader.PO_Message ?? null,
            terms: poHeader.Terms ?? null,
            vendorTerms,
            carrier: (poHeader as any).Delivery_ID ?? null,
            promoCode: poHeader.Promo_Code ?? null,
            trackingNumber: poHeader.Tracking_Number ?? null
        };

        return {
            poHeader: {
                PO_Number: poHeader.PO_Number,
                PO_Date: poHeader.PO_Date,
                PO_Source: poHeader.PO_Source,
                PO_Posted: poHeader.PO_Posted,
                PO_Type: poHeader.PO_Type,
                Confirmed: poHeader.Confirmed,
                Date_Received: poHeader.Date_Received,
                Primary_Vendor: poHeader.Primary_Vendor,
                Invoice_Number: poHeader.Invoice_Number,
                Invoice_Date: poHeader.Invoice_Date,
                PO_Message: poHeader.PO_Message,
                PO_Status: poHeader.PO_Status,
                Ship_Date: poHeader.Ship_Date,
                Requested_Delivery_Date: (poHeader as any).Requested_Delivery_Date || null,
                PO_DeliveryCharge: (poHeader as any).PO_DeliveryCharge || null,
                PO_Discounts: (poHeader as any).PO_Discounts || null,
                PO_MiscCharge: (poHeader as any).PO_MiscCharge || null,
                PO_MiscCharge2: (poHeader as any).PO_MiscCharge2 || null,
                PO_Total: poHeader.PO_Total,
                CreatedBy: poHeader.CreatedBy,
                PO_Deleted: poHeader.PO_Deleted
            },
            poInfo,
            shippingInfo,
            orderSummary: orderSummary,
            items: sortedItems
        };
    }

    /**
     * Get report by PO number - same details as getOrderItems including Quantity_Recd per item
     */
    async getReportById(poNumber: number, userId: number) {
       const poHeader = await POHeader.findOne({
            where: {
                PO_Number: poNumber
            }
        });

        if (!poHeader) {
            throw new AppError('Purchase Order not found', 404);
        }

        // First, get all PODetail records without any includes to ensure we get all items
        const orderItems = await PODetail.findAll({
            where: {
                PO_Number: poNumber
            },
            attributes: [
                'Line_Number',
                'Item_Number',
                'Quantity_Ordered',
                'Quantity_Recd',
                'Quantity_RecdDamaged',
                'Unit_Code',
                'Pack',
            ],
            raw: false, // Keep as Sequelize instances
        });

        // Get all unique Item_Numbers from the PODetail records
        const itemNumbers = orderItems
            .map((item: any) => item.Item_Number)
            .filter((itemNum: any) => itemNum !== null && itemNum !== undefined);

        // Fetch Inventory records separately for all items
        const inventoryRecords = itemNumbers.length > 0 ? await Inventory.findAll({
            where: {
                Item_Number: { [Op.in]: itemNumbers }
            },
            attributes: ['Item_Number', 'Description', 'Pack', 'CaseCount', 'UOM', 'Section', 'Location', 'Sales_Category', 'Sequence'],
            include: [
                {
                    model: InventoryUPC,
                    as: 'UPCList',
                    attributes: ['UPC_Number', 'Status'],
                    required: false,
                }
            ]
        }) : [];

        // Create maps for quick lookup
        const inventoryMap = new Map(
            inventoryRecords.map((inv: any) => [inv.Item_Number, inv])
        );

        // Get product images (same pattern as getFirstItem / home.service.ts)
        const productImages = itemNumbers.length > 0 ? await ProductImage.findAll({
            where: {
                product_number: { [Op.in]: itemNumbers.map(String) },
                isAllow: true
            }
        }) : [];
        const imageMap = new Map(productImages.map((img: any) => [String(img.product_number), img]));

        // Format the response
        const formattedItems = orderItems.map((item: any) => {
            // Get inventory for this item from the map
            const inventory = item.Item_Number ? inventoryMap.get(item.Item_Number) : null;

            // Transform UPCList to group by Status: 0=primary, 2=retail, 1 or 3=case
            const upcList = inventory?.UPCList || [];
            const groupedUPC: any = {
                primaryUPC: null,
                retailUPC: null,
                caseUPC: null
            };

            upcList.forEach((upc: any) => {
                const upcNumber = upc.UPC_Number || upc.dataValues?.UPC_Number;
                const status = upc.Status !== undefined ? upc.Status : upc.dataValues?.Status;

                if (status === 0) {
                    groupedUPC.primaryUPC = upcNumber;
                } else if (status === 2) {
                    groupedUPC.retailUPC = upcNumber;
                } else if (status === 1 || status === 3) {
                    groupedUPC.caseUPC = upcNumber;
                }
            });

            const itemStr = item.Item_Number != null ? String(item.Item_Number) : '';
            const productImage = imageMap.get(itemStr) || null;
            const firstUPC = upcList[0] && (upcList[0].UPC_Number ?? upcList[0].dataValues?.UPC_Number);
            const masterImage = `${process.env.AZUREIMAGESERVER || ''}${firstUPC || ''}.jpg`;

            return {
                Line_Number: item.Line_Number,
                Item_Number: item.Item_Number,
                Quantity_Ordered: item.Quantity_Ordered,
                Quantity_Recd: item.Quantity_Recd,
                Quantity_RecdDamaged: item.Quantity_RecdDamaged,
                Unit_Code: item.Unit_Code,
                Pack: item.Pack,
                showDistributorImage: productImage?.isAllow ?? false,
                distributorImage: productImage?.img_url || null,
                masterImage,
                inventory: inventory ? {
                    Item_Number: inventory.Item_Number,
                    Description: inventory.Description,
                    Pack: inventory.Pack,
                    CaseCount: inventory.CaseCount,
                    UOM: inventory.UOM,
                    Section: inventory.Section,
                    Location: inventory.Location,
                    Sales_Category: inventory.Sales_Category,
                    UPCList: groupedUPC.primaryUPC || groupedUPC.retailUPC || groupedUPC.caseUPC ? groupedUPC : null
                } : null
            };
        });

        // Get user's item_sort_by preference from receivable_user table
        const user = await ReceivableUser.findByPk(userId, {
            attributes: ['id', 'item_sort_by']
        });
        const itemSortBy = user?.item_sort_by || 'line_number';

        // Sort items based on user's preference
        const sortedItems = this.sortOrderItems(formattedItems, itemSortBy);

        // Calculate total quantity (sum of all Quantity_Ordered)
        const totalQty = sortedItems.reduce((sum: number, item: any) => {
            return sum + (parseFloat(item.Quantity_Ordered) || 0);
        }, 0);

        // Calculate total received quantity (sum of all Quantity_Recd)
        const totalReceivedQty = sortedItems.reduce((sum: number, item: any) => {
            return sum + (parseFloat(item.Quantity_Recd) || 0);
        }, 0);

        // Create order summary
        const orderSummary = {
            totalItems: sortedItems.length,
            totalQty: totalQty,
            totalReceivedQty: totalReceivedQty,
            lineNumbers: sortedItems.length
        };

        // PO Info (dates, invoice, type, charges)
        const poInfo = {
            shipDate: poHeader.Ship_Date,
            invoiceDate: poHeader.Invoice_Date,
            deliveryReqDate: (poHeader as any).Requested_Delivery_Date || (poHeader as any).FTP_REQ_Date || null,
            invoiceNumber: poHeader.Invoice_Number,
            type: poHeader.PO_Type,
            freightDeliveryCharge: (poHeader as any).PO_DeliveryCharge ?? null,
            discounts: (poHeader as any).PO_Discounts ?? null,
            miscChargeDiscount1: (poHeader as any).PO_MiscCharge ?? null,
            miscChargeDiscount2: (poHeader as any).PO_MiscCharge2 ?? null
        };

        // Vendor Terms: Vendor.TermsCode (or V_Terms) -> Invoice_Terms.TermsCode -> Terms string
        let vendorTerms: string | null = null;
        const vendor = await Vendor.findByPk(poHeader.Primary_Vendor ?? 0, {
            attributes: ['Primary_Vendor', 'V_Terms', 'TermsCode']
        });
        if (vendor) {
            const termsCode = vendor.TermsCode ?? (vendor.V_Terms != null && vendor.V_Terms !== '' ? Number(vendor.V_Terms) : null);
            if (termsCode != null && !Number.isNaN(termsCode)) {
                const invoiceTermsRow = await Terms.findByPk(termsCode, { attributes: ['Terms'] });
                vendorTerms = invoiceTermsRow?.Terms ?? null;
            }
        }

        // Shipping Info
        const shippingInfo = {
            comment: poHeader.PO_Message ?? null,
            terms: poHeader.Terms ?? null,
            vendorTerms,
            carrier: (poHeader as any).Delivery_ID ?? null,
            promoCode: poHeader.Promo_Code ?? null,
            trackingNumber: poHeader.Tracking_Number ?? null
        };

        return {
            poHeader: {
                PO_Number: poHeader.PO_Number,
                PO_Date: poHeader.PO_Date,
                PO_Source: poHeader.PO_Source,
                PO_Posted: poHeader.PO_Posted,
                PO_Type: poHeader.PO_Type,
                Confirmed: poHeader.Confirmed,
                Date_Received: poHeader.Date_Received,
                Primary_Vendor: poHeader.Primary_Vendor,
                Invoice_Number: poHeader.Invoice_Number,
                Invoice_Date: poHeader.Invoice_Date,
                PO_Message: poHeader.PO_Message,
                PO_Status: poHeader.PO_Status,
                Ship_Date: poHeader.Ship_Date,
                Requested_Delivery_Date: (poHeader as any).Requested_Delivery_Date || null,
                PO_DeliveryCharge: (poHeader as any).PO_DeliveryCharge || null,
                PO_Discounts: (poHeader as any).PO_Discounts || null,
                PO_MiscCharge: (poHeader as any).PO_MiscCharge || null,
                PO_MiscCharge2: (poHeader as any).PO_MiscCharge2 || null,
                PO_Total: poHeader.PO_Total,
                CreatedBy: poHeader.CreatedBy,
                PO_Deleted: poHeader.PO_Deleted
            },
            poInfo,
            shippingInfo,
            orderSummary: orderSummary,
            items: sortedItems
        };
    }

    /**
     * Get user's current order (if any)
     * Returns the PO_Header for the order that the user has locked (accepted)
     * Similar to Epick's getUserCurrentOrder
     */
    async getUserCurrentOrder(userId: number) {
        // Get user to get userNumber from receivable_user table
        const user = await ReceivableUser.findByPk(userId, {
            attributes: ['id', 'userNumber']
        });

        if (!user) {
            return null;
        }

        // Find RecordLock where Lock_Type = 1 (Receivable lock) and Lock_User = user.userNumber
        const lock = await RecordLock.findOne({
            where: {
                Lock_Type: 1,
                Lock_User: Number(user.userNumber ?? 0)
            }
        });

        // If no lock exists, user has no active order
        if (!lock) {
            return null;
        }

        // Get the PO_Number from the lock
        const poNumber = lock.Lock_Number;

        // Verify the PO still exists and matches criteria
        const poHeader = await POHeader.findOne({
            where: {
                PO_Number: poNumber,
                PO_Posted: false,
                Confirmed: false,
                Receiving_Code: 'P'
            },
            include: [
                {
                    model: Vendor,
                    as: 'vendor',
                    attributes: ['Primary_Vendor', 'V_Description', 'V_Addr1', 'V_Addr2', 'V_City', 'V_State', 'V_Zip', 'V_Phone'],
                    required: false, // LEFT JOIN - return order even if vendor doesn't exist
                }
            ]
        });

        // If PO doesn't exist or doesn't meet criteria, return null (order was deleted or completed)
        if (!poHeader) {
            return null;
        }

        // Format the response to include vendor information
        const formattedOrder: any = {
            PO_Number: poHeader.PO_Number,
            PO_Date: poHeader.PO_Date,
            PO_Source: poHeader.PO_Source,
            PO_Posted: poHeader.PO_Posted,
            PO_Type: poHeader.PO_Type,
            Confirmed: poHeader.Confirmed,
            Date_Received: poHeader.Date_Received,
            Primary_Vendor: poHeader.Primary_Vendor,
            Vendor_Name: (poHeader as any).vendor?.V_Description || null,
            Vendor_Address: (poHeader as any).vendor?.V_Addr1 || (poHeader as any).vendor?.V_Addr2 || null,
            Vendor_City: (poHeader as any).vendor?.V_City || null,
            Vendor_State: (poHeader as any).vendor?.V_State || null,
            Vendor_Zip: (poHeader as any).vendor?.V_Zip || null,
            Vendor_Phone: (poHeader as any).vendor?.V_Phone || null,
            Invoice_Number: poHeader.Invoice_Number,
            Invoice_Date: poHeader.Invoice_Date,
            PO_Message: poHeader.PO_Message,
            PO_Status: poHeader.PO_Status,
            Ship_Date: poHeader.Ship_Date,
            Requested_Delivery_Date: (poHeader as any).Requested_Delivery_Date || null,
            PO_DeliveryCharge: (poHeader as any).PO_DeliveryCharge || null,
            PO_Discounts: (poHeader as any).PO_Discounts || null,
            PO_MiscCharge: (poHeader as any).PO_MiscCharge || null,
            PO_MiscCharge2: (poHeader as any).PO_MiscCharge2 || null,
            PO_Total: poHeader.PO_Total,
            CreatedBy: poHeader.CreatedBy,
            PO_Deleted: poHeader.PO_Deleted
        };

        return formattedOrder;
    }

    /**
     * Update PO Shipping Info
     * Updates shipping-related fields in PO_Header
     */
    async updatePOShippingInfo(poNumber: number, userId: number, updateData: any) {
        // Verify user exists in receivable_user table
        const user = await ReceivableUser.findByPk(userId);
        if (!user) {
            throw new AppError('User not found or not authorized', 404);
        }

        // Find the PO Header
        const poHeader = await POHeader.findByPk(poNumber);
        if (!poHeader) {
            throw new AppError('Purchase Order not found', 404);
        }

        // Check if the order is locked by this user
        const lock = await RecordLock.findOne({
            where: {
                Lock_Number: poNumber,
                Lock_Type: 1,
                Lock_User: Number(user.userNumber ?? 0)
            }
        });

        if (!lock) {
            throw new AppError('Order is not locked by you. Please accept the order first.', 403);
        }

        // Prepare update object - only include fields that are provided
        const updateFields: any = {};

        // PO Info fields
        if (updateData.shipDate !== undefined) {
            updateFields.Ship_Date = updateData.shipDate ? new Date(updateData.shipDate) : null;
        }
        if (updateData.invoiceDate !== undefined) {
            updateFields.Invoice_Date = updateData.invoiceDate ? new Date(updateData.invoiceDate) : null;
        }

        if (updateData.invoiceNumber !== undefined) {
            updateFields.Invoice_Number = updateData.invoiceNumber || '';
        }

        if (updateData.freightDeliveryCharge !== undefined) {
            updateFields.PO_DeliveryCharge = Number(updateData.freightDeliveryCharge) || 0;
        }
        if (updateData.discounts !== undefined) {
            const discount = Number(updateData.discounts) || 0;
            updateFields.PO_Discounts = discount > 0 ? -discount : discount;
        }
        if (updateData.miscChargeDiscount1 !== undefined) {
            updateFields.PO_MiscCharge = Number(updateData.miscChargeDiscount1) || 0;
        }
        if (updateData.miscChargeDiscount2 !== undefined) {
            updateFields.PO_MiscCharge2 = Number(updateData.miscChargeDiscount2) || 0;
        }

        // Shipping Info fields
        if (updateData.comment !== undefined) {
            updateFields.PO_Message = updateData.comment || '';
        }
        if (updateData.terms !== undefined) {
            updateFields.Terms = updateData.terms || '';
        }

        if (updateData.promoCode !== undefined) {
            updateFields.Promo_Code = updateData.promoCode || '';
        }
        if (updateData.trackingNumber !== undefined) {
            updateFields.Tracking_Number = updateData.trackingNumber || '';
        }

        // Update the PO Header
        await poHeader.update(updateFields);

        // Fetch updated PO Header with vendor info
        const updatedPOHeader = await POHeader.findByPk(poNumber, {
            include: [
                {
                    model: Vendor,
                    as: 'vendor',
                    attributes: ['Primary_Vendor', 'V_Description', 'V_Addr1', 'V_City', 'V_State', 'V_Zip', 'V_Phone'],
                    required: false,
                }
            ]
        });

        if (!updatedPOHeader) {
            throw new AppError('Failed to retrieve updated Purchase Order', 500);
        }

        // Format response
        return {
            PO_Number: updatedPOHeader.PO_Number,
            Ship_Date: updatedPOHeader.Ship_Date,
            Invoice_Date: updatedPOHeader.Invoice_Date,
            Delivery_Req_Date: (updatedPOHeader as any).FTP_REQ_Date,
            Invoice_Number: updatedPOHeader.Invoice_Number,
            PO_Type: updatedPOHeader.PO_Type,
            PO_DeliveryCharge: updatedPOHeader.PO_DeliveryCharge,
            PO_Discounts: updatedPOHeader.PO_Discounts,
            PO_MiscCharge: updatedPOHeader.PO_MiscCharge,
            PO_MiscCharge2: updatedPOHeader.PO_MiscCharge2,
            PO_Message: updatedPOHeader.PO_Message,
            Terms: updatedPOHeader.Terms,
            Delivery_ID: updatedPOHeader.Delivery_ID,
            Promo_Code: updatedPOHeader.Promo_Code,
            Tracking_Number: updatedPOHeader.Tracking_Number,
        };
    }

}
