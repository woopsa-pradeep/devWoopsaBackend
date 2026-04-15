import Joi from 'joi';

export const salesRepSchema = Joi.object({
    salesRep: Joi.object({
        showStock: Joi.boolean(),
        allowOrderInventoryUnAvaible: Joi.boolean(),
        viewAccountReceivable: Joi.boolean(),
        showWithOutPrice: Joi.boolean(),
    }).required(),
});

export const itemGlobalSchema = Joi.object({
    itemGlobal: Joi.object({
        InventoryThreshold: Joi.number().integer().min(0),
        maxOrderLimit: Joi.number().integer().min(0),
        MiniMumOrderAmount: Joi.number().integer().min(0),
    }).required(),
    showWithPerpaidTax: Joi.boolean().optional().allow(null,false),
    globalSearchOption: Joi.boolean().optional().allow(null,false),
    splitSearchOption: Joi.boolean().optional().allow(null,false),
    priceBook: Joi.boolean().optional().allow(null,false),
});

export const retailerSchema = Joi.object({
    retailer: Joi.object({
        showStock: Joi.boolean(),
        allowOrderInventoryUnAvaible: Joi.boolean(),
        showWithOutPrice: Joi.boolean(),
    }).required(),
});

export const warehouseProfileSchema = Joi.object({
    warehouseProfile: Joi.object({
        cutOffTime: Joi.string(),
        storePickup: Joi.boolean(),
        allowShipping: Joi.boolean(),
        allowFullTime: Joi.boolean(),
        timeSlots: Joi.array().items(
            Joi.object({
              day: Joi.string()
                .valid(
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday'
                )
                .required(),
              timeSlots: Joi.array().items(
                Joi.object({
                  startTime: Joi.string()
                    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
                    .required(),
                  endTime: Joi.string()
                    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
                    .required()
                })
              ).required()
            })
          ).optional()
    }).required(),
    orderEmailNotification: Joi.string().email().optional().allow(null,false),
});