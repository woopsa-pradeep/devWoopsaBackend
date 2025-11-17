import Joi from "joi";

export const createSalesCallTimeSchema = Joi.object({
  customer_number: Joi.number().integer().positive().required().messages({
    'number.base': 'Customer number must be a number',
    'number.integer': 'Customer number must be an integer',
    'number.positive': 'Customer number must be positive',
    'any.required': 'Customer number is required'
  }),
  salesRepNumber: Joi.number().integer().positive().required().messages({
    'number.base': 'Sales rep number must be a number',
    'number.integer': 'Sales rep number must be an integer',
    'number.positive': 'Sales rep number must be positive',
    'any.required': 'Sales rep number is required'
  }),
  time: Joi.string().required().messages({
    'date.base': 'Time must be a valid date',
    'any.required': 'Time is required'
  })
});

export const updateSalesCallTimeSchema = Joi.object({


  time: Joi.string().optional().messages({
    'string.base': 'Time must be a valid date'
  })
});

// SalesNote validation schemas
export const createSalesNoteSchema = Joi.object({
  CustomerNumber: Joi.number().integer().positive().required().messages({
    'number.base': 'Customer number must be a number',
    'number.integer': 'Customer number must be an integer',
    'number.positive': 'Customer number must be positive',
    'any.required': 'Customer number is required'
  }),
  note: Joi.string().min(1).max(1000).required().messages({
    'string.empty': 'Note cannot be empty',
    'string.min': 'Note must be at least 1 character long',
    'string.max': 'Note cannot exceed 1000 characters',
    'any.required': 'Note is required'
  })
});

export const updateSalesNoteSchema = Joi.object({
  
  note: Joi.string().min(1).max(1000).optional().messages({
    'string.empty': 'Note cannot be empty',
    'string.min': 'Note must be at least 1 character long',
    'string.max': 'Note cannot exceed 1000 characters'
  })
});

// OrderConfirmation validation schemas
export const createOrderConfirmationSchema = Joi.object({
  order_Number: Joi.number().required().messages({
    'number.base': 'Order number must be a number',
    'string.empty': 'Order number cannot be empty',
    'any.required': 'Order number is required'
  }),
  status: Joi.string().optional().messages({
    'string.base': 'Status must be a string'
  }),
  current_orderline: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Current orderline must be a number',
    'number.integer': 'Current orderline must be an integer',
    'number.min': 'Current orderline must be 0 or greater'
  }),
 
});

export const updateOrderConfirmationSchema = Joi.object({
  status: Joi.string().optional().messages({
    'string.base': 'Status must be a string'
  }),
  current_orderline: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Current orderline must be a number',
    'number.integer': 'Current orderline must be an integer',
    'number.min': 'Current orderline must be 0 or greater'
  }),
  startTime: Joi.date().allow(null).optional().messages({
    'date.base': 'Start time must be a valid date'
  }),
  endTime: Joi.date().allow(null).optional().messages({
    'date.base': 'End time must be a valid date'
  })
});