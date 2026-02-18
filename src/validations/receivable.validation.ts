import Joi from 'joi';

export const acceptReceivableOrderSchema = Joi.object({
  poNumber: Joi.number().integer().optional(),
  PO_Number: Joi.number().integer().optional(),
}).or('poNumber', 'PO_Number').messages({
  'object.missing': 'Either poNumber or PO_Number is required',
});

export const updatePOShippingInfoSchema = Joi.object({
  poNumber: Joi.number().integer().required().messages({
    'number.base': 'PO Number must be a number',
    'any.required': 'PO Number is required',
  }),
  // PO Info fields
  shipDate: Joi.date().optional().allow(null),
  invoiceDate: Joi.date().optional().allow(null),

  invoiceNumber: Joi.string().optional().allow('', null),

  freightDeliveryCharge: Joi.number().optional().allow(null),
  discounts: Joi.number().optional().allow(null),
  miscChargeDiscount1: Joi.number().optional().allow(null),
  miscChargeDiscount2: Joi.number().optional().allow(null),
  // Shipping Info fields
  comment: Joi.string().optional().allow('', null),
  terms: Joi.string().optional().allow('', null),

  promoCode: Joi.string().optional().allow('', null),
  trackingNumber: Joi.string().optional().allow('', null),
});

const completeOrderItemSchema = Joi.object({
  itemNumber: Joi.number().integer().required().messages({
    'number.base': 'Item Number must be a number',
    'any.required': 'Item Number is required',
  }),
  quantity: Joi.number().min(0).required().messages({
    'number.base': 'Quantity must be a number',
    'number.min': 'Quantity must be >= 0',
    'any.required': 'Quantity is required',
  }),
});

export const completeOrderSchema = Joi.object({
  poNumber: Joi.number().integer().optional(),
  PO_Number: Joi.number().integer().optional(),
  items: Joi.array().items(completeOrderItemSchema).optional().default([]),
}).or('poNumber', 'PO_Number').messages({
  'object.missing': 'Either poNumber or PO_Number is required',
});
