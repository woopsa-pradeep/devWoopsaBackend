import { col, fn, literal, Op, where } from "sequelize";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import moment from "moment";
import { OrderPick } from "../models/postgres/epickOrder.model";
import { OrderDetail } from "../models/mmsql/orderDetail.model";
import { Inventory } from "../models/mmsql/inventory.model";
import { Customer } from "../models/mmsql/customer.model";
import { IOrderPick, IOrderPickBox } from "../interfaces/request.body.interface";
import { OrderPickBox } from "../models/postgres/epickOrderBox.model";
import { generateBarcodeAndUpload } from "../utils/barCodeGenerate";
import { generateBarcode, getInventoryOnHand } from "../utils/helper";
import { InventoryUPC } from "../models/mmsql/inventoryUpc.model";
import { AppError } from "../utils/AppError";
import { OrderPickScan } from "../models/postgres/epickOrderScan.model";

import { uploadFileToAzure } from "../utils/azureUploader";
import { CustomerRoute } from "../models/mmsql/customerRoutes.model";
import { ProductImage } from "../models/postgres/product.model";
import { Request } from "express";
import { postgresSequelize } from "../db";
import { PaginationOptions } from "../interfaces/pagination.interface";


export class EpickService {

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

       async getOrder() {
        const start = moment().startOf('day').toDate();
        const end   = moment().endOf('day').toDate();
      
        // 1) Get accepted orders for today (in_progress | completed)
        const acceptedOrders = await OrderPick.findAll({
          where: {
            createdAt: { [Op.gte]: start, [Op.lte]: end },
            status: { [Op.or]: ['in_progress', 'completed'] },
          },
          attributes: ['orderNumber'],
          raw: true,
        });
      
        // Clean + dedupe array of order numbers
        const acceptedOrderNumbers = Array.from(
          new Set(
            acceptedOrders
              .map((o: any) => o?.orderNumber)
              .filter((v: any) => v !== null && v !== undefined && String(v).trim() !== '')
              .map((v: any) => String(v)) // normalize to string to match your earlier includes check
          )
        );
      
        // 2) Query OrderHeader for today's orders, excluding accepted ones via NOT IN
        const headerWhere: any = {
          Order_Date: { [Op.gte]: start, [Op.lte]: end },
        };
        if (acceptedOrderNumbers.length > 0) {
          headerWhere.Order_Number = { [Op.notIn]: acceptedOrderNumbers };
        }
      
        const todayOrder = await OrderHeader.findAll({
          where: headerWhere,
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
            {
              model: OrderDetail,
              as: 'orderDetails',
              attributes: ['Order_Number', 'Line_Number', 'Quantity_Ordered', 'Pack', 'CaseCount'],
              required: false,
              include: [
                {
                  model: Inventory,
                  as: 'inventory',
                  attributes: ['Item_Number', 'Description'],
                  required: false,
                },
              ],
            },
          ],
          order: [
            ['Order_Number', 'ASC'],
            [{ model: OrderDetail, as: 'orderDetails' }, 'Line_Number', 'ASC'],
          ],
        });
      
        console.log(todayOrder, 'todayOrder');
      
        // keep response shape identical
        const notAcceptedOrders = todayOrder;
        return notAcceptedOrders;
      }

    async getOrderHistory(id: number) {
        const data = await OrderPick.findAll({
            where: {
                pickerUserNumber: id
            }
        })
        return data;
    }

    async acceptOrder(body: IOrderPick, id: number) {

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

        const data = await OrderPick.create({
            orderNumber: body.orderNumber,
            customerNumber: body.customerNumber,
            notes: body.notes,
            totalLines: body.totalLines,
            startedAt: moment().toDate(),
            totalQty: body.totalQty,
            scannedLines: body.scannedLines,
            OutOfStockItem: outOfStock,
            scannedQty: body.scannedQty,
            pickerUserNumber: id,
        })
        await OrderDetail.update(
        { Quantity_Shipped: 0 },
        {
where: {
        Order_Number: body.orderNumber,
        },
        }
);
        return data;
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

    async getOrderItem(orderNumber: number) {
        const data = await OrderDetail.findAll({
            attributes: [
              "Order_Number",
              "Line_Number",
              "Quantity_Ordered",
              "Pack",
              "CaseCount",
              "Quantity_Shipped",
              "Item_Number",
              "CaseCount",
            ],
            where: {
              Order_Number: orderNumber,
              [Op.and]: [
                where(col("Quantity_Ordered"), { [Op.gt]: col("Quantity_Shipped") }),
              ],
            },
            include: [
              {
                model: Inventory,
                as: "inventory",
                attributes: ["Item_Number", "Description", "Section", "Location"],
                include: [
                  {
                    model: InventoryUPC,
                    as: "UPCList",
                    attributes: ["UPC_Number"],
                    required: false,
                  },
                ],
              },
            ],
            order: [["Line_Number", "ASC"]],
            limit: 1
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

            return {
                ...item,
                inventoryOnHand: inventoryOnHand,
                masterImage: `${process.env.AZUREIMAGESERVER}${item?.inventory?.UPCList?.[0]?.UPC_Number || ''}.jpg`,
                isDistributorImageShow: productImage?.isAllow ?? false,
                distributorImage: productImage?.img_url || null,
            }

        }))
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

            await OrderDetail.update(
                {
                    Quantity_Shipped: literal(`"Quantity_Shipped" + ${Number(data.qty)}`)
                },
                {
                    where: {
                        Order_Number: data.orderNumber,
                        Item_Number: product.Item_Number
                    }
                }
            );

        } else {

            console.log(data, 'data--->');
            await OrderPickScan.create({
                orderNumber: Number(data.orderNumber),
                itemNumber: Number(product.Item_Number),
                qty: Number(data.qty),
                boxId: data.boxId,
                isSubsitute: data.isSubsitute || false
            })

            await OrderDetail.update(
                {
                    Quantity_Shipped: literal(`"Quantity_Shipped" + ${Number(data.qty)}`)
                },
                {
                    where: {
                        Order_Number: data.orderNumber,
                        Item_Number: product.Item_Number
                    }
                }
            );
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


    async OrderCompleted(id: number) {
        const data = await OrderPick.findOne({
            where: {
                orderNumber: id
            }
        })
        if (!data) {
            throw new AppError("Order not found", 404);
        }
        await data.update({
            status: 'completed',
            completedAt: moment().toDate()
        })


        console.log(data, 'data--->');

        return data;
    }

    async getUserHistory(id: number) {
        const data = await OrderPick.findAll({
            where: {
                pickerUserNumber: id,
                status: 'completed'
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
        const data = await OrderPick.findOne({
            where: {
                pickerUserNumber: id,
                status: 'in_progress'
            }
        })
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


    async getReportDate(id: number,query:PaginationOptions){

        let { page, limit } = query;
         page = Number(query.page || (query as any)['page ']) || 1;
         limit = Number(query.limit || (query as any)['limit ']) || 10;
         const offset = (page - 1) * limit;


        const {rows:data,count:totalCount} = await OrderPick.findAndCountAll({
            where: { pickerUserNumber: id,
                status: 'completed'
             },
             attributes:['orderNumber','customerNumber'],
             limit,
             offset
        })

        const finalData = await Promise.all(data.map(async (e: any) => {
            const customer = await Customer.findOne({
                where: { C_Number: e.customerNumber },
                attributes: ['C_Number', 'C_Name'],
                include: [
                    {
                        model: CustomerRoute,
                        as: 'Routes',
                        attributes: ['Route_Number', 'Stop_Number']
                    }
                ]
            })
            return {
                ...e.dataValues,
                customer: customer
            }
        }))
        return {
            data: finalData,
            totalCount: totalCount,
            page: page,
            limit: limit
        };

    }


    async getReportById(id: number){
        const data = await OrderPick.findAll({
            where: {
                orderNumber: id
            }
        })

        const finalData = await Promise.all(data?.map(async (e: any) => {

            const product = await OrderDetail.findAll({
                where: {
                    Order_Number: e.orderNumber
                },
                include: [
                    {
                        model: Inventory,
                        as: 'inventory',
                        attributes: ['Item_Number', 'Description', 'Item_Number'],
                        include: [
                            {
                                model: InventoryUPC,
                                as: 'UPCList',
                                attributes: ['UPC_Number'],
                                required: false
                            }
                        ]
                    },

                ]
            })
            return {
                ...e.dataValues,
                ...product
            }
        })) as any
        return finalData;
    }
}




