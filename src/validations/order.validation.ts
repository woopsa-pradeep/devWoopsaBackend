import Joi from 'joi';

const placeOrderRequestSchema = Joi.object({
  Customer_Number: Joi.number().required(),
  Item_Number: Joi.number().required(),
  Price: Joi.number().required(),
  Qty: Joi.number().required(),
  TotalPrice: Joi.number().required(),
  id: Joi.number().required(),
  Tax_Rate: Joi.number().required(),
  Price_With_Tax: Joi.number().required(),
  TotalPriceWithTax: Joi.number().required(),
  prepaidTaxRate: Joi.number().optional().allow('',null,0),
});

const shippingDetailsSchema = Joi.object({
  method: Joi.string().valid('pickup', 'delivery').required(),
  pickupTime: Joi.string().allow(null, ''), 
  instructions: Joi.string().allow(null, ''),
  warehouseAddress: Joi.string().required(),
  shippingAddress: Joi.string().required(),
  selectedTimeSlot: Joi.string().allow(null, '')
});


export const placeOrderSchema = Joi.object({
  orderPlayload: Joi.array()
    .items(placeOrderRequestSchema)
    .min(1)
    .required(),
  Delivery_Charge: Joi.number().required(),
  shippingDetails: shippingDetailsSchema.required()

});
