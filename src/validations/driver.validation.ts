import Joi from 'joi';

/** Matches payment options from AR (stored lowercase). */
export const DRIVER_EXPENSE_PAYMENT_METHODS = [
  'cash',
  'check',
  'credit',
  'debit',
  'other',
  'paid out',
  'ach',
] as const;

export const createDriverExpenseSchema = Joi.object({
  vehicleId: Joi.number().integer().positive().allow(null).optional(),
  expenseCategory: Joi.string().trim().min(1).max(120).required().messages({
    'string.empty': 'Expense category is required',
    'any.required': 'Expense category is required',
  }),
  expenseType: Joi.string().trim().min(1).max(120).required().messages({
    'string.empty': 'Expense type is required',
    'any.required': 'Expense type is required',
  }),
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be greater than zero',
    'any.required': 'Amount is required',
  }),
  expenseDate: Joi.date().iso().required().messages({
    'date.base': 'Expense date must be a valid date',
    'any.required': 'Expense date is required',
  }),
  arSubTypeRef: Joi.string()
    .trim()
    .lowercase()
    .required()
    .messages({
      'any.only': 'Payment method is invalid',
      'any.required': 'Payment method is required',
    }),
  receiptUrl: Joi.string().trim().max(2048).allow(null, '').optional(),
  notes: Joi.string().trim().max(5000).allow(null, '').optional(),
});

export const updateDriverExpenseSchema = Joi.object({
  vehicleId: Joi.number().integer().positive().allow(null).optional(),
  expenseType: Joi.string().trim().min(1).max(120).optional(),
  amount: Joi.number().positive().optional(),
  expenseDate: Joi.date().iso().optional(),
  arSubTypeRef: Joi.string()
    .trim()
    .lowercase()
    .valid(...DRIVER_EXPENSE_PAYMENT_METHODS)
    .optional()
    .messages({
      'any.only': 'Payment method is invalid',
    }),
  receiptUrl: Joi.string().trim().max(2048).allow(null, '').optional(),
  notes: Joi.string().trim().max(5000).allow(null, '').optional(),
}).or(
  'vehicleId',
  'expenseType',
  'amount',
  'expenseDate',
  'arSubTypeRef',
  'receiptUrl',
  'notes'
);

export const driverExpenseIdParamSchema = Joi.object({
  expenseId: Joi.number().integer().positive().required(),
});

export const driverExpenseListQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

export const rescheduleStopParamSchema = Joi.object({
  stopId: Joi.number().integer().positive().required(),
});

/**
 * insertAfterStopSequence: place this stop after the stop that currently has this sequence (1-based).
 * Use 0 to place the stop at the beginning of the route.
 * inProgressStopSequence: optional; after reorder, which new sequence (1..n) is in_progress.
 * If omitted, defaults to the moved stop's new position.
 */
export const reScheduleStopBodySchema = Joi.object({
  insertAfterStopSequence: Joi.number().integer().min(0).required().messages({
    'any.required': 'insertAfterStopSequence is required',
  }),
  inProgressStopSequence: Joi.number().integer().min(1).optional(),
  reScheduleReason: Joi.string().trim().max(500).allow(null, '').optional(),
  reScheduleNotes: Joi.string().trim().max(5000).allow(null, '').optional(),
  notes: Joi.string().trim().max(5000).allow(null, '').optional(),
});

export const cancelStopParamSchema = Joi.object({
  stopId: Joi.number().integer().positive().required(),
});

export const cancelStopBodySchema = Joi.object({
  cancelledReason: Joi.string().trim().max(500).allow(null, '').optional(),
});


export const allowToCompleteStopBodySchema = Joi.object({
  driverLat: Joi.number().required(),
  driverLng: Joi.number().required(),
  stopLat: Joi.number().required(),
  stopLng: Joi.number().required(),
});

export const DELIVERY_ROUTE_RETURN_STATUSES = [
  "pending",
  "picked_up",
  "returned_to_warehouse",
] as const;

export const setCustomerLocationSchema = Joi.object({
  customerId: Joi.number().integer().positive().required().messages({
    "any.required": "customerId is required",
    "number.base": "customerId must be a number",
  }),
  lat: Joi.number().min(-90).max(90).required().messages({
    "any.required": "lat is required",
    "number.base": "lat must be a number",
  }),
  long: Joi.number().min(-180).max(180).required().messages({
    "any.required": "long is required",
    "number.base": "long must be a number",
  }),
  city: Joi.string().trim().max(200).allow(null, "").optional(),
  state: Joi.string().trim().max(100).allow(null, "").optional(),
  zip: Joi.string().trim().max(20).allow(null, "").optional(),
  country: Joi.string().trim().max(100).allow(null, "").optional(),
  address: Joi.string().trim().max(500).allow(null, "").optional(),
});

const placeReturnOrderLineSchema = Joi.object({
  id: Joi.number().optional(),
  Customer_Number: Joi.number().optional(),
  Item_Number: Joi.number().integer().positive().required(),
  Price: Joi.number().min(0).required(),
  Qty: Joi.number().positive().required(),
  TotalPrice: Joi.number().min(0).required(),
  Tax_Rate: Joi.number().optional().allow(null),
  Price_With_Tax: Joi.number().optional(),
  TotalPriceWithTax: Joi.number().min(0).optional(),
  prepaidTaxRate: Joi.number().optional().allow(null, ""),
  discountPrice: Joi.number().optional(),
});

export const placeReturnOrderSchema = Joi.object({
  orderPlayload: Joi.array().items(placeReturnOrderLineSchema).min(1).required(),
  Delivery_Charge: Joi.number().optional().default(0),
  shippingDetails: Joi.any().optional(),
  hasDiscount: Joi.boolean().optional().default(false),
  discountAmount: Joi.number().optional().default(0),
  order_type: Joi.string().allow("", null).optional(),
});

export const updateReturnOrderSchema = Joi.array()
  .items(
    Joi.object({
      Order_Number: Joi.number().integer().positive().required(),
      Item_Number: Joi.number().integer().positive().required(),
      Quantity_Shipped: Joi.number().min(0).required(),
      Line_Number: Joi.number().integer().positive().required(),
    })
  )
  .min(1)
  .required();

export const updateTransferredStopBodySchema = Joi.object({
  C_Number: Joi.number().integer().positive().required().messages({
    "any.required": "C_Number is required",
  }),
  latitude: Joi.number().min(-90).max(90).required().messages({
    "any.required": "latitude is required",
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    "any.required": "longitude is required",
  }),
  reason: Joi.string().trim().max(500).allow(null, "").optional(),
});

export const createDeliveryRouteReturnSchema = Joi.object({
  routeId: Joi.number().integer().positive().required(),
  C_Number: Joi.number().integer().positive().required(),
  orderNumber: Joi.number().integer().positive().required(),
  pickupLatitude: Joi.number().min(-90).max(90).allow(null).optional(),
  pickupLongitude: Joi.number().min(-180).max(180).allow(null).optional(),
  returnReason: Joi.string().trim().max(500).allow(null, "").optional(),
  returnNotes: Joi.string().trim().max(5000).allow(null, "").optional(),
  photos: Joi.array().items(Joi.string().trim().max(2048)).default([]),
  customerSignature: Joi.string().trim().max(2048).allow(null, "").optional(),
  signBy: Joi.string().trim().max(200).allow(null, "").optional(),
  boxBarCode: Joi.array().items(Joi.string().trim().max(200)).default([]),
  scanBarCode: Joi.array().items(Joi.string().trim().max(200)).default([]),
  status: Joi.string()
    .valid(...DELIVERY_ROUTE_RETURN_STATUSES)
    .optional()
    .default("pending"),
});