import Joi from 'joi';

export const addToCartValidation = Joi.object({
  Item_Number: Joi.number().required().messages({
    'number.base': 'Item number must be a number',
    'any.required': 'Item number is required'
  }),
  Price: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be positive',
    'number.precision': 'Price can have maximum 2 decimal places',
    'any.required': 'Price is required'
  }),
  Qty: Joi.number().integer().positive().required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.positive': 'Quantity must be positive',
    'any.required': 'Quantity is required'
  }),
  TotalPrice: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Total price must be a number',
    'number.positive': 'Total price must be positive',
    'number.precision': 'Total price can have maximum 2 decimal places',
    'any.required': 'Total price is required'
  }),
  Tax_Rate: Joi.number().required().messages({
    'number.base': 'Tax rate must be a number',
    'number.positive': 'Tax rate must be positive',
    'number.precision': 'Tax rate can have maximum 2 decimal places',
    'any.required': 'Tax rate is required'
  }),
  TotalPriceWithTax: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Total price with tax must be a number',
    'number.positive': 'Total price with tax must be positive',
    'number.precision': 'Total price with tax can have maximum 2 decimal places',
    'any.required': 'Total price with tax is required'
  }),
  Price_With_Tax: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Price with tax must be a number',
    'number.positive': 'Price with tax must be positive',
    'number.precision': 'Price with tax can have maximum 2 decimal places',
    'any.required': 'Price with tax is required'
  }),
  discount:Joi.number().optional().allow('',null,0).messages({
    'number.base': 'Discount must be a number',
    'number.positive': 'Discount must be positive',
    'number.precision': 'Discount can have maximum 2 decimal places',
    'any.required': 'Discount is required'
  }),
  originalPrice:Joi.number().optional().allow('',null,0).messages({
    'number.base': 'Original price must be a number',
    'number.positive': 'Original price must be positive',
    'number.precision': 'Original price can have maximum 2 decimal places',
    'any.required': 'Original price is required'
  })
});

export const updateCartItemValidation = Joi.object({
  Qty: Joi.number().integer().positive().optional().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.positive': 'Quantity must be positive'
  }),
  Price: Joi.number().positive().precision(2).optional().messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be positive',
    'number.precision': 'Price can have maximum 2 decimal places'
  }),
  TotalPrice: Joi.number().positive().precision(2).optional().messages({
    'number.base': 'Total price must be a number',
    'number.positive': 'Total price must be positive',
    'number.precision': 'Total price can have maximum 2 decimal places'
  }),
  TotalPriceWithTax: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Total price with tax must be a number',
    'number.positive': 'Total price with tax must be positive',
    'number.precision': 'Total price with tax can have maximum 2 decimal places',
    'any.required': 'Total price with tax is required'
  }),
  Tax_Rate: Joi.number().required().messages({
    'number.base': 'Tax rate must be a number',
    'number.positive': 'Tax rate must be positive',
    'number.precision': 'Tax rate can have maximum 2 decimal places',
    'any.required': 'Tax rate is required'
  }),
  Price_With_Tax: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Price with tax must be a number',
    'number.positive': 'Price with tax must be positive',
    'number.precision': 'Price with tax can have maximum 2 decimal places',
    'any.required': 'Price with tax is required'
  }),
  discount:Joi.number().optional().allow('',null,0).messages({
    'number.base': 'Discount must be a number',
    'number.positive': 'Discount must be positive',
    'number.precision': 'Discount can have maximum 2 decimal places',
    'any.required': 'Discount is required'
  }),
  originalPrice:Joi.number().optional().allow('',null,0).messages({
    'number.base': 'Original price must be a number',
    'number.positive': 'Original price must be positive',
    'number.precision': 'Original price can have maximum 2 decimal places',
    'any.required': 'Original price is required'
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export const cartItemIdValidation = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'Cart item ID must be a number',
    'number.integer': 'Cart item ID must be an integer',
    'number.positive': 'Cart item ID must be positive',
    'any.required': 'Cart item ID is required'
  })
}); 

export const createSupportTicketValidation = Joi.object({
  subject: Joi.string().required().messages({
    'string.empty': 'Subject is required',
    'any.required': 'Subject is required'
  }),
  description: Joi.string().required().messages({
    'string.empty': 'Description is required',
    'any.required': 'Description is required'
  }),
  contactNumber: Joi.string().required().messages({
    'string.empty': 'Contact number is required',
    'any.required': 'Contact number is required'
  })
});

// RetailerProductCatalog validation schemas
export const createRetailerProductCatalogSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.base': 'Name must be a string.',
    'string.empty': 'Name cannot be empty.',
    'any.required': 'Name is required.',
  }),
  description: Joi.string().trim().optional().allow('').messages({
    'string.base': 'Description must be a string.',
  }),

  attachment: Joi.string().trim().optional().allow('').messages({
    'string.base': 'Attachment must be a string.',
  }),
  link: Joi.string().trim().optional().allow('').messages({
    'string.base': 'Link must be a string.',
  }),
});

export const updateRetailerProductCatalogSchema = Joi.object({
  name: Joi.string().trim().optional().messages({
    'string.base': 'Name must be a string.',
    'string.empty': 'Name cannot be empty.',
  }),
  description: Joi.string().trim().optional().allow('').messages({
    'string.base': 'Description must be a string.',
  }),
  status: Joi.boolean().optional().messages({
    'boolean.base': 'Status must be a boolean.',
  }),
  attachment: Joi.string().trim().optional().allow('').messages({
    'string.base': 'Attachment must be a string.',
  }),
 
});

export const getRetailerProductCatalogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number.',
    'number.integer': 'Page must be an integer.',
    'number.min': 'Page must be at least 1.',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limit must be a number.',
    'number.integer': 'Limit must be an integer.',
    'number.min': 'Limit must be at least 1.',
    'number.max': 'Limit cannot exceed 100.',
  }),
  search: Joi.string().trim().optional().allow('').messages({
    'string.base': 'Search must be a string.',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean.',
  }),
  status: Joi.string().trim().optional().allow('').messages({
    'string.base': 'Status must be a string.',
  }),
});

export const addToCartMultiScannerValidation = Joi.object({
  upcNumbers: Joi.string().trim().optional().allow('').messages({
    'string.base': 'UPC numbers must be a string.',
  }),
  isMultiple: Joi.boolean().optional().messages({
    'boolean.base': 'isMultiple must be a boolean.',
  }),
  arrayOfUpc: Joi.array().items(Joi.string().trim()).optional().messages({
    'array.base': 'Array of UPCs must be an array.',
  }),
});