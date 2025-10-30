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
