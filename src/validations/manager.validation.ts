import Joi from 'joi';
import path from 'path';

export const saasValidationBannerSchema = Joi.object({

  UpcNumber: Joi.string()
    .required()
    .messages({
      'string.base': 'UPC number must be a string.',
      'any.required': 'UPC number is required.',
    }),

  Description: Joi.string()
    .required()
    .messages({
      'string.base': 'Description must be a string.',
    }),

  ValidTill: Joi.date()
    .required()
    .messages({
      'date.base': 'Valid till must be a valid date.',
      'any.required': 'Valid till date is required.',
    }),

  UploadedBy: Joi.number()
    .required()
    .messages({
      'number.base': 'Uploaded by must be a number.',
      'any.required': 'Uploaded by is required.',
    }),

  UploadedAt: Joi.date()
    .required()
    .messages({
      'date.base': 'Uploaded at must be a valid date.',
      'any.required': 'Uploaded at is required.',
    }),

  Keyword: Joi.string()
    .optional()
    .messages({
      'string.base': 'Keyword must be a string.',
    }),

  ItemNumber: Joi.number()
    .optional()
    .messages({
      'number.base': 'Item number must be a number.',
    }),
});
// validation/erpUser.validation.ts

// validations/users.validation.ts

export const createUserSchema = Joi.object({
  userNumber: Joi.number().required().messages({
    'any.required': 'User is required',
    'string.empty': 'User cannot be empty',
  }),

  // ✅ salesRepNumber is now ARRAY
  salesRepNumber: Joi.array()
    .items(
      Joi.string().trim().allow(''), // e.g. "1234"
      Joi.number(),                  // e.g. 1234
    )
    .default([]) // ✅ Default empty array
    .messages({
      'array.base': 'salesRepNumber must be an array',
      'string.base': 'Each salesRepNumber must be a string',
      'number.base': 'Each salesRepNumber must be a number',
    }),

  firstName: Joi.string().required().messages({
    'any.required': 'firstName is required',
    'string.empty': 'firstName cannot be empty',
  }),

  lastName: Joi.string().required().messages({
    'any.required': 'lastName is required',
    'string.empty': 'lastName cannot be empty',
  }),

  role: Joi.string().required().valid('sales', 'driver', 'checker', 'epick', 'receivable').messages({
    'any.required': 'role is required',
    'string.empty': 'role cannot be empty',
  }),

  email: Joi.string().email().required().messages({
    'string.email': 'email must be a valid email address',
    'any.required': 'email is required',
  }),
});

export const createReceivableUserSchema = Joi.object({
  userNumber: Joi.number().required().messages({
    'any.required': 'User is required',
    'string.empty': 'User cannot be empty',
  }),

  // ✅ salesRepNumber is now ARRAY
  salesRepNumber: Joi.array()
    .items(
      Joi.string().trim().allow(''), // e.g. "1234"
      Joi.number(),                  // e.g. 1234
    )
    .default([]) // ✅ Default empty array
    .messages({
      'array.base': 'salesRepNumber must be an array',
      'string.base': 'Each salesRepNumber must be a string',
      'number.base': 'Each salesRepNumber must be a number',
    }),

  firstName: Joi.string().required().messages({
    'any.required': 'firstName is required',
    'string.empty': 'firstName cannot be empty',
  }),

  lastName: Joi.string().required().messages({
    'any.required': 'lastName is required',
    'string.empty': 'lastName cannot be empty',
  }),

  // Role is optional for receivable users since it's automatically set to 'receivable'
  role: Joi.string().optional().valid('receivable').messages({
    'any.only': 'Role must be receivable if provided',
  }),

  email: Joi.string().email().required().messages({
    'string.email': 'email must be a valid email address',
    'any.required': 'email is required',
  }),

  password: Joi.string().min(3).required().messages({
    'any.required': 'password is required',
    'string.min': 'password must be at least 3 characters',
    'string.empty': 'password cannot be empty',
  }),

  item_sort_by: Joi.string().valid('sales_location', 'section_location', 'sales_section_location', 'alphabetically', 'item_number', 'short_number', 'line_number').optional().default('line_number'),
});

export const updateReceivableUserSchema = Joi.object({
  userNumber: Joi.number().optional().messages({
    'number.base': 'User number must be a number',
  }),

  salesRepNumber: Joi.array()
    .items(
      Joi.string().trim().allow(''),
      Joi.number(),
    )
    .optional()
    .messages({
      'array.base': 'salesRepNumber must be an array',
    }),

  firstName: Joi.string().optional().messages({
    'string.empty': 'firstName cannot be empty',
  }),

  lastName: Joi.string().optional().messages({
    'string.empty': 'lastName cannot be empty',
  }),

  email: Joi.string().email().optional().messages({
    'string.email': 'email must be a valid email address',
  }),

  password: Joi.string().min(3).optional().messages({
    'string.min': 'password must be at least 3 characters',
  }),

  status: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  setUserDiscountLimit: Joi.number().optional(),
  allowDiscount: Joi.boolean().optional(),
  allowDeliveryCharge: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export const createEpickUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'email must be a valid email address',
    'any.required': 'email is required',
  }),

  firstName: Joi.string().required().messages({
    'any.required': 'firstName is required',
    'string.empty': 'firstName cannot be empty',
  }),

  lastName: Joi.string().required().messages({
    'any.required': 'lastName is required',
    'string.empty': 'lastName cannot be empty',
  }),

  password: Joi.string().min(3).required().messages({
    'any.required': 'password is required',
    'string.min': 'password must be at least 3 characters',
  }),

  userNumber: Joi.number().required().messages({
    'any.required': 'userNumber is required',
    'number.base': 'userNumber must be a number',
  }),

  assignmentType: Joi.string().valid('sales_category', 'pickright_area').required().messages({
    'any.required': 'assignmentType is required',
    'any.only': 'assignmentType must be sales_category or pickright_area',
  }),

  category: Joi.array()
    .items(Joi.number().integer())
    .messages({
      'array.base': 'category must be an array',
      'array.min': 'category must contain at least one category',
    })
    .when('assignmentType', {
      is: 'sales_category',
      then: Joi.array().items(Joi.number().integer()).min(1).required(),
      otherwise: Joi.array().items(Joi.number().integer()).optional().default([]),
    }),

  pickRightAreas: Joi.array()
    .items(Joi.string().min(1))
    .messages({
      'array.base': 'pickRightAreas must be an array',
      'array.min': 'pickRightAreas must contain at least one area',
    })
    .when('assignmentType', {
      is: 'pickright_area',
      then: Joi.array().items(Joi.string().min(1)).min(1).required(),
      otherwise: Joi.array().items(Joi.string().min(1)).optional().default([]),
    }),

  order_type: Joi.string().valid('order_number', 'qty_number').optional().default('order_number'),

  shortby: Joi.string().valid('Asc', 'Des').optional().default('Des'),

  item_sort_by: Joi.string().valid('sales_location', 'section_location', 'sales_section_location', 'alphabetically', 'item_number', 'short_number', 'line_number').optional().default('line_number'),

  status: Joi.boolean().optional().default(true),

  isActive: Joi.boolean().optional().default(true),
});

export const updateEpickUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  userNumber: Joi.string().allow(null, '').optional(),
  password: Joi.string().min(3).optional().messages({
    'string.min': 'password must be at least 3 characters',
  }),
  status: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  assignmentType: Joi.string().valid('sales_category', 'pickright_area').optional(),
  category: Joi.array()
    .items(Joi.number().integer())
    .min(1)
    .optional()
    .messages({
      'array.base': 'category must be an array',
      'array.min': 'category must contain at least one category',
    }),
  pickRightAreas: Joi.array()
    .items(Joi.string().min(1))
    .min(1)
    .optional()
    .messages({
      'array.base': 'pickRightAreas must be an array',
      'array.min': 'pickRightAreas must contain at least one area',
    }),
  order_type: Joi.string().valid('order_number', 'qty_number').optional(),
  shortby: Joi.string().valid('asc', 'des', 'Asc', 'Des').optional(),
  item_sort_by: Joi.string().valid('sales_location', 'section_location', 'sales_section_location', 'alphabetically', 'item_number', 'short_number', 'line_number').optional(),
});

export const updateEpickUserPreferencesSchema = Joi.object({
  order_type: Joi.string().valid('order_number', 'qty_number').optional(),
  shortby: Joi.string().valid('asc', 'des', 'Asc', 'Des').optional(),
  item_sort_by: Joi.string().valid('sales_location', 'section_location', 'sales_section_location', 'alphabetically', 'alphabetically_section_location', 'item_number', 'short_number', 'line_number').optional(),
}).or('order_type', 'shortby', 'item_sort_by').messages({
  'object.missing': 'At least one of order_type, shortby, or item_sort_by must be provided'
});

export const updateEpickUserCategoriesSchema = Joi.object({
  category: Joi.array()
    .items(Joi.number().integer())
    .min(1)
    .required()
    .messages({
      'array.base': 'category must be an array',
      'array.min': 'category must contain at least one category',
      'any.required': 'category is required',
    }),
});

export const updateEpickUserItemSortSchema = Joi.object({
  item_sort_by: Joi.string().valid('sales_location', 'section_location', 'sales_section_location', 'alphabetically', 'alphabetically_section_location', 'item_number', 'short_number', 'line_number').required().messages({
    'any.required': 'item_sort_by is required',
    'any.only': 'item_sort_by must be one of: sales_location, section_location, sales_section_location, alphabetically, alphabetically_section_location, item_number, short_number, line_number'
  }),
});

// export const createPOHeaderSchema = Joi.object({
//   PO_Date: Joi.date().required().messages({
//       'any.required': 'PO_Date is required',
//       'date.base': 'PO_Date must be a valid date',
//     }),

//   Primary_Vendor: Joi.number().required().messages({
//       'any.required': 'Primary_Vendor is required',
//       'number.base': 'Primary_Vendor must be a number',
//     }),

//   Invoice_Number: Joi.string().required().messages({
//       'any.required': 'Invoice_Number is required',
//       'string.base': 'Invoice_Number must be a string',
//     }),

//   Invoice_Date: Joi.date().required().messages({
//       'any.required': 'Invoice_Date is required',
//       'date.base': 'Invoice_Date must be a valid date',
//     }),

//   PO_Total: Joi.number().required().messages({
//       'any.required': 'PO_Total is required',
//       'number.base': 'PO_Total must be a number',
//     }),

//   Requested_Delivery_Date: Joi.date().optional().allow(null)
//     .messages({
//       'date.base': 'Requested_Delivery_Date must be a valid date in YYYY-MM-DD format',
//     }),

// }).unknown(true);



// validations/rolePermissionRequest.validation.ts

export const rolePermissionRequestSchema = Joi.object({
  userId: Joi.number().required().messages({
    'any.required': 'userId is required',
    'number.base': 'userId must be a number',
  }),

  permissions: Joi.array()
    .items(
      Joi.object({
        module: Joi.string().trim().required().messages({
          'any.required': 'module is required',
        }),
        add: Joi.boolean().optional(),
        edit: Joi.boolean().optional(),
        delete: Joi.boolean().optional(),
        view: Joi.boolean().optional(),
        path: Joi.string()
          .trim()
      })
    )
    .min(1)
    .required()
    .messages({
      'array.base': 'permissions must be an array',
      'array.min': 'at least one permission is required',
      'any.required': 'permissions array is required',
    }),
});

export const roleUdatePermissionRequestSchema = Joi.object({
  userId: Joi.number().required().messages({
    'any.required': 'userId is required',
    'number.base': 'userId must be a number',
  }),
  permissions: Joi.array()
    .items(
      Joi.object({
        module: Joi.string().trim().required().messages({
          'any.required': 'module is required',
        }),
        add: Joi.boolean().optional(),
        edit: Joi.boolean().optional(),
        delete: Joi.boolean().optional(),
        view: Joi.boolean().optional(),
        path: Joi.string().required(),
        id: Joi.number().optional().allow(null, ''),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.base': 'permissions must be an array',
      'array.min': 'at least one permission is required',
      'any.required': 'permissions array is required',
    }),
});

export const updateWarehouseSettingSchema = Joi.object({
  // Basic Settings
  inventoryThreshold: Joi.number().min(0).required().messages({
    'number.base': 'Inventory threshold must be a number',
    'number.min': 'Inventory threshold cannot be negative',
    'any.required': 'Inventory threshold is required',
  }),
  emailAddress: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'any.required': 'Email address is required',
  }),
  cutOffTime: Joi.string().required().messages({
    'string.base': 'Cut-off time must be a string',
    'any.required': 'Cut-off time is required',
  }),

  maxOrderQty: Joi.number().min(0).required().messages({
    'number.base': 'Max order quantity must be a number',
    'number.min': 'Max order quantity cannot be negative',
    'any.required': 'Max order quantity is required',
  }),
  minOrderAmount: Joi.number().min(0).required().messages({
    'number.base': 'Min order amount must be a number',
    'number.min': 'Min order amount cannot be negative',
    'any.required': 'Min order amount is required',
  }),

  // Flags for Sales Rep
  showInventoryStockToSalesRep: Joi.boolean().required(),
  allowOrderWithoutStockSalesRep: Joi.boolean().required(),
  allowViewARToSalesRep: Joi.boolean().required(),
  showItemsWithoutPriceToSalesRep: Joi.boolean().required(),

  // Flags for Retailer
  showInventoryStockToRetailer: Joi.boolean().required(),
  allowOrderWithoutStockRetailer: Joi.boolean().required(),
  allowViewARToRetailer: Joi.boolean().required(),
  showItemsWithoutPriceToRetailer: Joi.boolean().required(),

  // Controls & Features
  enableStorePickup: Joi.boolean().required(),
  enableMaxOrderQtyControl: Joi.boolean().required(),
  enableMinOrderAmountControl: Joi.boolean().required(),
  showDepositCharges: Joi.boolean().required(),
});


export const homeSettingsSchema = Joi.object({
  showMostSale: Joi.boolean().required().messages({
    'any.required': 'Show most sale is required',
  }),
  showAsPerCustomer: Joi.boolean().required().messages({
    'any.required': 'Show as per customer is required',
  }),
  promotedItems: Joi.array(),
  showPromotedItems: Joi.boolean().required().messages({
    'any.required': 'Show promoted items is required',
  }),
  maxPromotedItems: Joi.number().required().messages({
    'any.required': 'Max promoted items is required',
  }),
  showCustomerHistory: Joi.boolean().required().messages({
    'any.required': 'Show customer history is required',
  }),
});

// ItemLimit validation schemas
export const createItemLimitSchema = Joi.object({
  Item_Number: Joi.number().required().messages({
    'string.base': 'Item number must be a string',
    'any.required': 'Item number is required',
  }),
  QtyLimit: Joi.number().required().messages({
    'number.base': 'Quantity limit must be a number',
    'number.min': 'Quantity limit must be at least 1',
    'any.required': 'Quantity limit is required',
  }),

});

export const updateItemLimitSchema = Joi.object({
  Item_Number: Joi.number().optional().messages({
    'string.base': 'Item number must be a string',
  }),
  QtyLimit: Joi.number().optional().messages({
    'number.base': 'Quantity limit must be a number',
    'number.min': 'Quantity limit must be at least 1',
  }),
  markAsBundle: Joi.boolean().optional().allow(null, '').messages({
    'boolean.base': 'Mark as bundle must be a boolean',
  }),

});

// NotificationScheduler validation schemas
export const createNotificationSchedulerSchema = Joi.object({
  userId: Joi.array().items(Joi.number().integer().positive()).min(1).required().messages({
    'array.base': 'User IDs must be an array',
    'array.min': 'At least one user ID is required',
    'any.required': 'User IDs are required',
    'number.base': 'User ID must be a number',
    'number.integer': 'User ID must be an integer',
    'number.positive': 'User ID must be positive'
  }),
  title: Joi.string().trim().min(1).max(255).required().messages({
    'string.base': 'Title must be a string',
    'string.empty': 'Title cannot be empty',
    'string.min': 'Title must be at least 1 character long',
    'string.max': 'Title cannot exceed 255 characters',
    'any.required': 'Title is required'
  }),
  description: Joi.string().trim().min(1).required().messages({
    'string.base': 'Description must be a string',
    'string.empty': 'Description cannot be empty',
    'string.min': 'Description must be at least 1 character long',
    'any.required': 'Description is required'
  }),
  date: Joi.date().required().messages({
    'date.base': 'Date must be a valid date',
    'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
    'date.min': 'Date cannot be in the past',
    'any.required': 'Date is required'
  }),
  time: Joi.string().required().messages({
    'string.base': 'Time must be a string',
    'string.pattern.base': 'Time must be in HH:MM:SS format',
    'any.required': 'Time is required'
  }),
  isActive: Joi.boolean().default(true).messages({
    'boolean.base': 'isActive must be a boolean'
  })
});

export const updateNotificationSchedulerSchema = Joi.object({
  userId: Joi.array().items(Joi.number().integer().positive()).min(1).optional().messages({
    'array.base': 'User IDs must be an array',
    'array.min': 'At least one user ID is required',
    'number.base': 'User ID must be a number',
    'number.integer': 'User ID must be an integer',
    'number.positive': 'User ID must be positive'
  }),
  title: Joi.string().trim().min(1).max(255).optional().messages({
    'string.base': 'Title must be a string',
    'string.empty': 'Title cannot be empty',
    'string.min': 'Title must be at least 1 character long',
    'string.max': 'Title cannot exceed 255 characters'
  }),
  description: Joi.string().trim().min(1).optional().messages({
    'string.base': 'Description must be a string',
    'string.empty': 'Description cannot be empty',
    'string.min': 'Description must be at least 1 character long'
  }),
  date: Joi.date().optional().messages({
    'date.base': 'Date must be a valid date',
    'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
    'date.min': 'Date cannot be in the past'
  }),
  time: Joi.string().optional().messages({
    'string.base': 'Time must be a string',
    'string.pattern.base': 'Time must be in HH:MM:SS format'
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean'
  }),
  isExpire: Joi.boolean().optional().messages({
    'boolean.base': 'isExpire must be a boolean'
  })
});

export const getNotificationSchedulerSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1'
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100'
  }),
  search: Joi.string().trim().optional().messages({
    'string.base': 'Search must be a string'
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean'
  }),
  isExpire: Joi.boolean().optional().messages({
    'boolean.base': 'isExpire must be a boolean'
  }),
  date: Joi.date().iso().optional().messages({
    'date.base': 'Date must be a valid date',
    'date.format': 'Date must be in ISO format (YYYY-MM-DD)'
  })
});

// Link validation schemas
export const createLinkSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.base': 'Name must be a string.',
    'string.empty': 'Name cannot be empty.',
    'any.required': 'Name is required.',
  }),
  description: Joi.string().trim().optional().allow('').messages({
    'string.base': 'Description must be a string.',
  }),



  url: Joi.string().uri().required().messages({
    'string.base': 'URL must be a string.',
    'string.empty': 'URL cannot be empty.',
    'string.uri': 'URL must be a valid URL.',
    'any.required': 'URL is required.',
  }),
});

export const updateLinkSchema = Joi.object({
  name: Joi.string().trim().optional().messages({
    'string.base': 'Name must be a string.',
    'string.empty': 'Name cannot be empty.',
  }),
  description: Joi.string().trim().optional().allow('').messages({
    'string.base': 'Description must be a string.',
  }),
  file: Joi.string().trim().optional().allow('').messages({
    'string.base': 'File must be a string.',
  }),
  logo: Joi.string().trim().optional().allow('').messages({
    'string.base': 'Logo must be a string.',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean.',
  }),
  url: Joi.string().uri().optional().messages({
    'string.base': 'URL must be a string.',
    'string.empty': 'URL cannot be empty.',
    'string.uri': 'URL must be a valid URL.',
  }),
});

export const getLinksQuerySchema = Joi.object({
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
});

// Story validation schemas
export const createStorySchema = Joi.object({
  mediaType: Joi.string().valid('image', 'video').required().messages({
    'string.base': 'Media type must be a string.',
    'any.only': 'Media type must be either "image" or "video".',
    'any.required': 'Media type is required.',
  }),
  media: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'Media must be a string.',
    'string.empty': 'Media cannot be empty.',
  }),
  caption: Joi.string().trim().optional().allow('').messages({
    'string.base': 'Caption must be a string.',
  }),
});

export const updateStorySchema = Joi.object({
  mediaType: Joi.string().valid('image', 'video').optional().messages({
    'string.base': 'Media type must be a string.',
    'any.only': 'Media type must be either "image" or "video".',
  }),
  caption: Joi.string().trim().optional().allow('').messages({
    'string.base': 'Caption must be a string.',
  }),
  expiresAt: Joi.date().iso().optional().messages({
    'date.base': 'Expires at must be a valid date.',
    'date.format': 'Expires at must be in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ).',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean.',
  }),
});

export const getStoriesQuerySchema = Joi.object({
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
  mediaType: Joi.string().valid('image', 'video').optional().messages({
    'string.base': 'Media type must be a string.',
    'any.only': 'Media type must be either "image" or "video".',
  }),
});

// WebView validation schemas
export const createWebViewSchema = Joi.object({
  section: Joi.string().valid('header', 'middle', 'bottom').required().messages({
    'string.base': 'Section must be a string.',
    'any.only': 'Section must be either "header", "middle", or "bottom".',
    'any.required': 'Section is required.',
  }),
  productsList: Joi.string().optional().allow('', null).messages({
    'string.base': 'Products list must be a string'
  })
});

export const updateWebViewSchema = Joi.object({
  section: Joi.string().valid('header', 'middle', 'bottom').optional().messages({
    'string.base': 'Section must be a string.',
    'any.only': 'Section must be either "header", "middle", or "bottom".',
  }),
  order: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Order must be a number.',
    'number.integer': 'Order must be an integer.',
    'number.min': 'Order must be at least 0.',
  }),

});


export const getWebViewsQuerySchema = Joi.object({
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
  section: Joi.string().valid('header', 'middle', 'bottom').optional().messages({
    'string.base': 'Section must be a string.',
    'any.only': 'Section must be either "header", "middle", or "bottom".',
  }),
  groupBySection: Joi.boolean().optional().default(false).messages({
    'boolean.base': 'groupBySection must be a boolean.',
  }),
});

// Retailer Request validation schemas
export const createRetailerRequestSchema = Joi.object({
  business_name: Joi.string().trim().required().messages({
    'string.base': 'Business name must be a string',
    'string.empty': 'Business name cannot be empty',
    'any.required': 'Business name is required'
  }),
  special_delivery_instructions: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'Special delivery instructions must be a string'
  }),
  dba_name: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'DBA name must be a string'
  }),
  business_type: Joi.string().valid('SOLE_PROP', 'PARTNERSHIP', 'LLC', 'CORP', 'OTHER').required().messages({
    'string.base': 'Business type must be a string',
    'any.only': 'Business type must be one of: SOLE_PROP, PARTNERSHIP, LLC, CORP, OTHER',
    'any.required': 'Business type is required'
  }),
  federal_ein: Joi.string().max(15).optional().allow('', null).messages({
    'string.base': 'Federal EIN must be a string',
    'string.max': 'Federal EIN cannot exceed 15 characters'
  }),
  ownership_type: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'Ownership type must be a string'
  }),
  primary_contact: Joi.string().trim().required().messages({
    'string.base': 'Primary contact must be a string',
    'string.empty': 'Primary contact cannot be empty',
    'any.required': 'Primary contact is required'
  }),
  phone: Joi.string().trim().required().messages({
    'string.base': 'Phone must be a string',
    'string.empty': 'Phone number is required',
    'any.required': 'Phone number is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'string.empty': 'Email is required',
    'any.required': 'Email is required'
  }),
  website: Joi.string().uri().optional().allow('', null).messages({
    'string.uri': 'Website must be a valid URL'
  }),
  physical_street: Joi.string().trim().required().messages({
    'string.base': 'Physical street address must be a string',
    'string.empty': 'Physical street address cannot be empty',
    'any.required': 'Physical street address is required'
  }),
  physical_city: Joi.string().trim().required().messages({
    'string.base': 'Physical city must be a string',
    'string.empty': 'Physical city cannot be empty',
    'any.required': 'Physical city is required'
  }),
  physical_state: Joi.string().length(2).required().messages({
    'string.base': 'Physical state must be a string',
    'string.length': 'Physical state must be exactly 2 characters',
    'any.required': 'Physical state is required'
  }),
  physical_zip: Joi.string().trim().required().messages({
    'string.base': 'Physical ZIP code must be a string',
    'string.empty': 'Physical ZIP code cannot be empty',
    'any.required': 'Physical ZIP code is required'
  }),
  physical_county: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'Physical county must be a string'
  }),
  mailing_same_as_physical: Joi.boolean().default(true).messages({
    'boolean.base': 'Mailing same as physical must be a boolean'
  }),
  mailing_street: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'Mailing street must be a string'
  }),
  mailing_city: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'Mailing city must be a string'
  }),
  mailing_state: Joi.string().length(2).optional().allow('', null).messages({
    'string.base': 'Mailing state must be a string',
    'string.length': 'Mailing state must be exactly 2 characters'
  }),
  mailing_zip: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'Mailing ZIP code must be a string'
  }),
  sales_tax_id: Joi.string().trim().required().messages({
    'string.base': 'Sales tax ID must be a string',
    'string.empty': 'Sales Tax ID is required',
    'any.required': 'Sales Tax ID is required'
  }),
  state_tobacco_license: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'State tobacco license must be a string'
  }),
  federal_tobacco_permit: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'Federal tobacco permit must be a string'
  }),
  resale_certificate_url: Joi.string().uri().optional().allow('', null).messages({
    'string.uri': 'Resale certificate URL must be a valid URL'
  }),
  state_tobacco_license_url: Joi.string().uri().optional().allow('', null).messages({
    'string.uri': 'State tobacco license URL must be a valid URL'
  }),
  business_license_url: Joi.string().uri().optional().allow('', null).messages({
    'string.uri': 'Business license URL must be a valid URL'
  }),
  owner_government_id_url: Joi.string().uri().optional().allow('', null).messages({
    'string.uri': 'Owner government ID URL must be a valid URL'
  }),
  owners: Joi.string().optional().allow('', null).messages({
    'string.base': 'Owners must be a string'
  }),
  credit_limit_requested: Joi.boolean().default(false).messages({
    'boolean.base': 'Credit limit requested must be a boolean'
  }),
  bank_name: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'Bank name must be a string'
  }),
  bank_account_last4: Joi.string().length(4).optional().allow('', null).messages({
    'string.base': 'Bank account last 4 digits must be a string',
    'string.length': 'Bank account last 4 digits must be exactly 4 characters'
  }),
  references: Joi.string().optional().allow('', null).messages({
    'string.base': 'References must be a string'
  }),

  preferred_delivery_days: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'Preferred delivery days must be a string'
  }),
  compliance_certification: Joi.boolean().valid(true).required().messages({
    'boolean.base': 'Compliance certification must be a boolean',
    'any.only': 'You must certify compliance with tobacco laws',
    'any.required': 'Compliance certification is required'
  }),
  authorized_signature: Joi.string().trim().required().messages({
    'string.base': 'Authorized signature must be a string',
    'string.empty': 'Authorized signature is required',
    'any.required': 'Authorized signature is required'
  }),
  signature_date: Joi.string().trim().required().messages({
    'string.base': 'Signature date must be a string',
    'string.empty': 'Signature date is required',
    'any.required': 'Signature date is required'
  }),
  notes: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'Notes must be a string'
  })
});





// Policies validation schemas
export const createPoliciesSchema = Joi.object({
  PrivacyPolicies: Joi.string().optional().allow('', null).messages({
    'string.base': 'Privacy policies must be a string'
  }),
  TermsAndConditions: Joi.string().optional().allow('', null).messages({
    'string.base': 'Terms and conditions must be a string'
  }),
  SoftwareLicense: Joi.string().optional().allow('', null).messages({
    'string.base': 'Software license must be a string'
  }),
  RefundPolicies: Joi.string().optional().allow('', null).messages({
    'string.base': 'Refund policies must be a string'
  })
});

export const updatePoliciesSchema = Joi.object({
  PrivacyPolicies: Joi.string().optional().allow('', null).messages({
    'string.base': 'Privacy policies must be a string'
  }),
  TermsAndConditions: Joi.string().optional().allow('', null).messages({
    'string.base': 'Terms and conditions must be a string'
  }),
  SoftwareLicense: Joi.string().optional().allow('', null).messages({
    'string.base': 'Software license must be a string'
  }),
  RefundPolicies: Joi.string().optional().allow('', null).messages({
    'string.base': 'Refund policies must be a string'
  })
});

export const updateRefundPoliciesSchema = Joi.object({
  RefundPolicies: Joi.string().required().messages({
    'string.base': 'Refund policies must be a string',
    'string.empty': 'Refund policies cannot be empty',
    'any.required': 'Refund policies is required'
  })
});

// WebCategory validation schemas
export const createWebCategorySchema = Joi.object({
  categoryId: Joi.number().required().messages({
    'number.base': 'Category ID must be a number',
    'any.required': 'Category ID is required'
  }),
  name: Joi.string().max(100).required().messages({
    'string.base': 'Name must be a string',
    'string.max': 'Name cannot exceed 100 characters',
    'string.empty': 'Name cannot be empty',
    'any.required': 'Name is required'
  }),
  image: Joi.string().optional().allow('', null).messages({
    'string.base': 'Image must be a string'
  }),
  status: Joi.string().max(50).optional().allow('', null).messages({
    'string.base': 'Status must be a string',
    'string.max': 'Status cannot exceed 50 characters'
  }),
  isActive: Joi.boolean().optional().default(true).messages({
    'boolean.base': 'IsActive must be a boolean'
  })
});

export const updateWebCategorySchema = Joi.object({
  categoryId: Joi.number().optional().messages({
    'number.base': 'Category ID must be a number'
  }),
  name: Joi.string().max(100).optional().messages({
    'string.base': 'Name must be a string',
    'string.max': 'Name cannot exceed 100 characters'
  }),
  image: Joi.string().optional().allow('', null).messages({
    'string.base': 'Image must be a string'
  }),
  status: Joi.string().max(50).optional().allow('', null).messages({
    'string.base': 'Status must be a string',
    'string.max': 'Status cannot exceed 50 characters'
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'IsActive must be a boolean'
  })
});

export const createWebQuickLinkSchema = Joi.object({
  title: Joi.string().required().messages({
    'any.required': 'Title is required',
    'string.empty': 'Title cannot be empty',
  }),
  url: Joi.string().uri().required().messages({
    'any.required': 'URL is required',
    'string.uri': 'URL must be a valid URI',
    'string.empty': 'URL cannot be empty',
  }),
  icon: Joi.string().optional().messages({
    'string.base': 'Icon must be a string',
  }),
  order: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Order must be a number',
    'number.integer': 'Order must be an integer',
    'number.min': 'Order must be greater than or equal to 0',
  }),
  isActive: Joi.boolean().optional().default(true).messages({
    'boolean.base': 'IsActive must be a boolean',
  }),
});

export const updateWebQuickLinkSchema = Joi.object({
  title: Joi.string().optional().messages({
    'string.base': 'Title must be a string',
    'string.empty': 'Title cannot be empty',
  }),
  url: Joi.string().uri().optional().messages({
    'string.uri': 'URL must be a valid URI',
    'string.empty': 'URL cannot be empty',
  }),
  icon: Joi.string().optional().messages({
    'string.base': 'Icon must be a string',
  }),
  order: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Order must be a number',
    'number.integer': 'Order must be an integer',
    'number.min': 'Order must be greater than or equal to 0',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'IsActive must be a boolean',
  }),
});

// WebLocation validation schemas
export const createWebLocationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required().messages({
    'any.required': 'Latitude is required',
    'number.base': 'Latitude must be a number',
    'number.min': 'Latitude must be between -90 and 90',
    'number.max': 'Latitude must be between -90 and 90',
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    'any.required': 'Longitude is required',
    'number.base': 'Longitude must be a number',
    'number.min': 'Longitude must be between -180 and 180',
    'number.max': 'Longitude must be between -180 and 180',
  }),
});

export const updateWebLocationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).optional().messages({
    'number.base': 'Latitude must be a number',
    'number.min': 'Latitude must be between -90 and 90',
    'number.max': 'Latitude must be between -90 and 90',
  }),
  longitude: Joi.number().min(-180).max(180).optional().messages({
    'number.base': 'Longitude must be a number',
    'number.min': 'Longitude must be between -180 and 180',
    'number.max': 'Longitude must be between -180 and 180',
  }),
});

export const getWebLocationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be greater than 0',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be greater than 0',
    'number.max': 'Limit must be greater than 0 and less than or equal to 100',
  }),
  search: Joi.string().optional().messages({
    'string.base': 'Search must be a string',
  }),
});

// ContactUs validation schemas
export const createContactUsSchema = Joi.object({
  PhoneNO: Joi.string()
    .required()
    .messages({
      'string.base': 'Phone number must be a string.',
      'any.required': 'Phone number is required.',
    }),
  WhatupNo: Joi.string()
    .required()
    .messages({
      'string.base': 'WhatsApp number must be a string.',
      'any.required': 'WhatsApp number is required.',
    }),
  EmailAdd: Joi.string()
    .email()
    .required()
    .messages({
      'string.base': 'Email address must be a string.',
      'string.email': 'Email address must be a valid email.',
      'any.required': 'Email address is required.',
    }),
  Fax: Joi.string()
    .required()
    .messages({
      'string.base': 'Fax number must be a string.',
      'any.required': 'Fax number is required.',
    }),
});

export const updateContactUsSchema = Joi.object({
  PhoneNO: Joi.string()
    .optional()
    .messages({
      'string.base': 'Phone number must be a string.',
    }),
  WhatupNo: Joi.string()
    .optional()
    .messages({
      'string.base': 'WhatsApp number must be a string.',
    }),
  EmailAdd: Joi.string()
    .email()
    .optional()
    .messages({
      'string.base': 'Email address must be a string.',
      'string.email': 'Email address must be a valid email.',
    }),
  SalesRepName: Joi.string()
    .optional()
    .messages({
      'string.base': 'Sales representative name must be a string.',
    }),
  Fax: Joi.string()
    .optional()
    .messages({
      'string.base': 'Fax number must be a string.',
    }),
});

export const getContactUsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be greater than 0',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be greater than 0',
    'number.max': 'Limit must be greater than 0 and less than or equal to 100',
  }),
  search: Joi.string().optional().messages({
    'string.base': 'Search must be a string',
  }),
});

// EmailModule validation schemas
export const createEmailModuleSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name cannot be empty',
    'any.required': 'Name is required',
  }),
  isEmailSetup: Joi.boolean().optional().default(false).messages({
    'boolean.base': 'isEmailSetup must be a boolean',
  }),
});

export const updateEmailModuleSchema = Joi.object({
  name: Joi.string().trim().optional().messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name cannot be empty',
  }),
  isEmailSetup: Joi.boolean().optional().messages({
    'boolean.base': 'isEmailSetup must be a boolean',
  }),
}).min(1);

export const getEmailModulesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be greater than 0',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be greater than 0',
    'number.max': 'Limit must be greater than 0 and less than or equal to 100',
  }),
  search: Joi.string().optional().messages({
    'string.base': 'Search must be a string',
  }),
});

// EmailModuleConfig validation schemas
export const createEmailModuleConfigSchema = Joi.object({
  emailModuleId: Joi.number().integer().positive().required().messages({
    'number.base': 'Email module ID must be a number',
    'number.integer': 'Email module ID must be an integer',
    'number.positive': 'Email module ID must be positive',
    'any.required': 'Email module ID is required',
  }),
  host: Joi.string().trim().required().messages({
    'string.base': 'Host must be a string',
    'string.empty': 'Host cannot be empty',
    'any.required': 'Host is required',
  }),
  port: Joi.number().integer().min(1).max(65535).required().messages({
    'number.base': 'Port must be a number',
    'number.integer': 'Port must be an integer',
    'number.min': 'Port must be at least 1',
    'number.max': 'Port cannot exceed 65535',
    'any.required': 'Port is required',
  }),
  username: Joi.string().trim().required().messages({
    'string.base': 'Username must be a string',
    'string.empty': 'Username cannot be empty',
    'any.required': 'Username is required',
  }),
  secure: Joi.boolean().optional().default(false).messages({
    'boolean.base': 'Secure must be a boolean',
  }),
  password: Joi.string().trim().required().messages({
    'string.base': 'Password must be a string',
    'string.empty': 'Password cannot be empty',
    'any.required': 'Password is required',
  }),
  fromEmail: Joi.string().email().required().messages({
    'string.email': 'From email must be a valid email address',
    'string.empty': 'From email cannot be empty',
    'any.required': 'From email is required',
  }),
  fromName: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'From name must be a string',
  }),
  isActive: Joi.boolean().optional().default(true).messages({
    'boolean.base': 'isActive must be a boolean',
  }),
});

export const updateEmailModuleConfigSchema = Joi.object({
  emailModuleId: Joi.number().integer().positive().optional().messages({
    'number.base': 'Email module ID must be a number',
    'number.integer': 'Email module ID must be an integer',
    'number.positive': 'Email module ID must be positive',
  }),
  host: Joi.string().trim().optional().messages({
    'string.base': 'Host must be a string',
    'string.empty': 'Host cannot be empty',
  }),
  port: Joi.number().integer().min(1).max(65535).optional().messages({
    'number.base': 'Port must be a number',
    'number.integer': 'Port must be an integer',
    'number.min': 'Port must be at least 1',
    'number.max': 'Port cannot exceed 65535',
  }),
  username: Joi.string().trim().optional().messages({
    'string.base': 'Username must be a string',
    'string.empty': 'Username cannot be empty',
  }),
  secure: Joi.boolean().optional().messages({
    'boolean.base': 'Secure must be a boolean',
  }),
  password: Joi.string().trim().optional().messages({
    'string.base': 'Password must be a string',
    'string.empty': 'Password cannot be empty',
  }),
  fromEmail: Joi.string().email().optional().messages({
    'string.email': 'From email must be a valid email address',
    'string.empty': 'From email cannot be empty',
  }),
  fromName: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'From name must be a string',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean',
  }),
}).min(1);

export const getEmailModuleConfigsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be greater than 0',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be greater than 0',
    'number.max': 'Limit must be greater than 0 and less than or equal to 100',
  }),
  search: Joi.string().optional().messages({
    'string.base': 'Search must be a string',
  }),
  emailModuleId: Joi.number().integer().positive().optional().messages({
    'number.base': 'Email module ID must be a number',
    'number.integer': 'Email module ID must be an integer',
    'number.positive': 'Email module ID must be positive',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean',
  }),
});

// Email Management validation schemas
export const createEmailConfigSchema = Joi.object({
  module: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'Module must be a string',
    'string.empty': 'Module cannot be empty',
  }),
  host: Joi.string().trim().required().messages({
    'string.base': 'Host must be a string',
    'string.empty': 'Host cannot be empty',
    'any.required': 'Host is required'
  }),
  port: Joi.number().integer().min(1).max(65535).required().messages({
    'number.base': 'Port must be a number',
    'number.integer': 'Port must be an integer',
    'number.min': 'Port must be at least 1',
    'number.max': 'Port cannot exceed 65535',
    'any.required': 'Port is required'
  }),
  secure: Joi.boolean().default(false).messages({
    'boolean.base': 'Secure must be a boolean'
  }),
  username: Joi.string().trim().required().messages({
    'string.base': 'Username must be a string',
    'string.empty': 'Username cannot be empty',
    'any.required': 'Username is required'
  }),
  password: Joi.string().trim().required().messages({
    'string.base': 'Password must be a string',
    'string.empty': 'Password cannot be empty',
    'any.required': 'Password is required'
  }),
  fromEmail: Joi.string().email().required().messages({
    'string.email': 'From email must be a valid email address',
    'string.empty': 'From email cannot be empty',
    'any.required': 'From email is required'
  }),
  fromName: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'From name must be a string'
  })
});

export const updateEmailConfigSchema = Joi.object({
  host: Joi.string().trim().optional().messages({
    'string.base': 'Host must be a string',
    'string.empty': 'Host cannot be empty'
  }),
  port: Joi.number().integer().min(1).max(65535).optional().messages({
    'number.base': 'Port must be a number',
    'number.integer': 'Port must be an integer',
    'number.min': 'Port must be at least 1',
    'number.max': 'Port cannot exceed 65535'
  }),
  secure: Joi.boolean().optional().messages({
    'boolean.base': 'Secure must be a boolean'
  }),
  username: Joi.string().trim().optional().messages({
    'string.base': 'Username must be a string',
    'string.empty': 'Username cannot be empty'
  }),
  password: Joi.string().trim().optional().messages({
    'string.base': 'Password must be a string',
    'string.empty': 'Password cannot be empty'
  }),
  fromEmail: Joi.string().email().optional().messages({
    'string.email': 'From email must be a valid email address',
    'string.empty': 'From email cannot be empty'
  }),
  fromName: Joi.string().trim().optional().allow('', null).messages({
    'string.base': 'From name must be a string'
  })
});

// Email Marketing validation schemas
export const createEmailMarketingSchema = Joi.object({
  to: Joi.array().items(Joi.string().email()).min(1).required().messages({
    'array.base': 'Recipients must be an array',
    'array.min': 'At least one recipient is required',
    'any.required': 'Recipients are required',
    'string.email': 'Each recipient must be a valid email address'
  }),
  cc: Joi.array().items(Joi.string().email()).optional().messages({
    'array.base': 'CC recipients must be an array',
    'string.email': 'Each CC recipient must be a valid email address'
  }),
  subject: Joi.string().trim().min(1).max(255).required().messages({
    'string.base': 'Subject must be a string',
    'string.empty': 'Subject cannot be empty',
    'string.min': 'Subject must be at least 1 character long',
    'string.max': 'Subject cannot exceed 255 characters',
    'any.required': 'Subject is required'
  }),
  body: Joi.string().trim().min(1).required().messages({
    'string.base': 'Body must be a string',
    'string.empty': 'Body cannot be empty',
    'string.min': 'Body must be at least 1 character long',
    'any.required': 'Body is required'
  }),
  attachments: Joi.array().items(Joi.string().uri()).optional().messages({
    'array.base': 'Attachments must be an array',
    'string.uri': 'Each attachment must be a valid URL'
  }),
  status: Joi.string().optional().allow('', null)
});

export const getEmailMarketingQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be greater than 0'
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be greater than 0',
    'number.max': 'Limit must be greater than 0 and less than or equal to 100'
  }),
  search: Joi.string().optional().messages({
    'string.base': 'Search must be a string'
  }),
  userId: Joi.number().integer().positive().optional().messages({
    'number.base': 'User ID must be a number',
    'number.integer': 'User ID must be an integer',
    'number.positive': 'User ID must be positive'
  })
});

// InventoryUPC CRUD validation schemas
export const createInventoryUPCSchema = Joi.object({
  UPC_Number: Joi.string().optional().allow('', null).messages({
    'string.base': 'UPC Number must be a string'
  }),
  Jurisdiction_State: Joi.number().integer().required().messages({
    'number.base': 'Jurisdiction State must be a number',
    'number.integer': 'Jurisdiction State must be an integer',
    'any.required': 'Jurisdiction State is required'
  }),
  Jurisdiction_County: Joi.number().integer().required().messages({
    'number.base': 'Jurisdiction County must be a number',
    'number.integer': 'Jurisdiction County must be an integer',
    'any.required': 'Jurisdiction County is required'
  }),
  Jurisdiction_City: Joi.number().integer().required().messages({
    'number.base': 'Jurisdiction City must be a number',
    'number.integer': 'Jurisdiction City must be an integer',
    'any.required': 'Jurisdiction City is required'
  }),
  Item_Number: Joi.number().integer().required().messages({
    'number.base': 'Item Number must be a number',
    'number.integer': 'Item Number must be an integer',
    'any.required': 'Item Number is required'
  }),
  Status: Joi.number().integer().min(0).max(255).required().messages({
    'number.base': 'Status must be a number',
    'number.integer': 'Status must be an integer',
    'number.min': 'Status must be between 0 and 255',
    'number.max': 'Status must be between 0 and 255',
    'any.required': 'Status is required'
  }),
  Priority: Joi.number().integer().min(0).max(255).required().messages({
    'number.base': 'Priority must be a number',
    'number.integer': 'Priority must be an integer',
    'number.min': 'Priority must be between 0 and 255',
    'number.max': 'Priority must be between 0 and 255',
    'any.required': 'Priority is required'
  }),
  Qty: Joi.number().integer().min(0).required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be greater than or equal to 0',
    'any.required': 'Quantity is required'
  })
});

// InventoryLocation validation schemas
export const createInventoryLocationSchema = Joi.object({
  Item_Number: Joi.number().integer().required().messages({
    'number.base': 'Item_Number must be a number.',
    'number.integer': 'Item_Number must be an integer.',
    'any.required': 'Item_Number is required.'
  }),
  Location: Joi.string().trim().required().messages({
    'string.base': 'Location must be a string.',
    'string.empty': 'Location is required.',
    'any.required': 'Location is required.'
  }),
  Section: Joi.string().trim().optional().allow('').messages({
    'string.base': 'Section must be a string.'
  }),
  Status: Joi.boolean().optional().default(true).messages({
    'boolean.base': 'Status must be a boolean.'
  }),
  isActive: Joi.boolean().optional().default(true).messages({
    'boolean.base': 'isActive must be a boolean.'
  })
});

export const updateInventoryLocationSchema = Joi.object({
  C_Number: Joi.number().integer().optional().messages({
    'number.base': 'C_Number must be a number.',
    'number.integer': 'C_Number must be an integer.'
  }),
  Item_Number: Joi.number().integer().optional().messages({
    'number.base': 'Item_Number must be a number.',
    'number.integer': 'Item_Number must be an integer.'
  }),
  Location: Joi.string().trim().optional().messages({
    'string.base': 'Location must be a string.'
  }),
  Section: Joi.string().trim().optional().allow('').messages({
    'string.base': 'Section must be a string.'
  }),
  Status: Joi.boolean().optional().messages({
    'boolean.base': 'Status must be a boolean.'
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean.'
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export const createVendorSchema = Joi.object({
  V_Description: Joi.string().required().messages({
    "any.required": "Vendor description is required"
  }),
  V_Addr1: Joi.string().required().messages({
    'string.email': 'email must be a valid email address',
    "any.required": "Vendor address line 1 is required"
  }),
  V_City: Joi.string().required().messages({
    "any.required": "Vendor city is required"
  }),
  V_State: Joi.string().required().messages({
    "any.required": "Vendor state is required"
  }),
  V_Zip: Joi.string().required().messages({
    "any.required": "Vendor zip code is required"
  }),
}).unknown(true);

export const createErpUserSchema = Joi.object({
  UserID: Joi.string()
    .max(5)
    .allow(null, '')
    .messages({
      'string.base': 'UserID must be a string',
      'string.max': 'UserID cannot exceed 5 characters',
    }),
  UserIsActive: Joi.alternatives()
    .try(
      Joi.boolean(),
      Joi.number().valid(0, 1)
    )
    .default(true)
    .messages({
      'any.only': 'UserIsActive must be either 0, 1, true or false',
    }),
  UserName: Joi.string()
    .max(50)
    .required()
    .messages({
      'string.base': 'UserName must be a string',
      'string.max': 'UserName cannot exceed 50 characters',
      'any.required': 'UserName is required',
    }),

  UserPassword: Joi.string()
    .max(5)
    .required()
    .messages({
      'string.base': 'UserPassword must be a string',
      'string.max': 'UserPassword cannot exceed 5 characters',
      'any.required': 'UserPassword is required',
    }),

  UserGroup: Joi.number()
    .integer()
    .allow(null)
    .messages({
      'number.base': 'UserGroup must be a number',
    }),
})


export const updateErpUserSchema = Joi.object({
  UserID: Joi.string()
    .max(5)
    .allow(null, '')
    .messages({
      'string.base': 'UserID must be a string',
      'string.max': 'UserID cannot exceed 5 characters',
    }),
  UserIsActive: Joi.alternatives()
    .try(
      Joi.boolean(),
      Joi.number().valid(0, 1)
    )
    .default(true)
    .messages({
      'any.only': 'UserIsActive must be either 0, 1, true or false',
    }),
  UserName: Joi.string()
    .max(50)
    .messages({
      'string.base': 'UserName must be a string',
      'string.max': 'UserName cannot exceed 50 characters',
    }),

  UserPassword: Joi.string()
    .max(5)
    .messages({
      'string.base': 'UserPassword must be a string',
      'string.max': 'UserPassword cannot exceed 5 characters',
    }),
})

export const updateInventoryUPCSchema = Joi.object({
  UPC_Number: Joi.string().optional().allow('', null).messages({
    'string.base': 'UPC Number must be a string'
  }),
  Jurisdiction_State: Joi.number().integer().optional().messages({
    'number.base': 'Jurisdiction State must be a number',
    'number.integer': 'Jurisdiction State must be an integer'
  }),
  Jurisdiction_County: Joi.number().integer().optional().messages({
    'number.base': 'Jurisdiction County must be a number',
    'number.integer': 'Jurisdiction County must be an integer'
  }),
  Jurisdiction_City: Joi.number().integer().optional().messages({
    'number.base': 'Jurisdiction City must be a number',
    'number.integer': 'Jurisdiction City must be an integer'
  }),
  Item_Number: Joi.number().integer().optional().messages({
    'number.base': 'Item Number must be a number',
    'number.integer': 'Item Number must be an integer'
  }),
  Status: Joi.number().integer().min(0).max(255).optional().messages({
    'number.base': 'Status must be a number',
    'number.integer': 'Status must be an integer',
    'number.min': 'Status must be between 0 and 255',
    'number.max': 'Status must be between 0 and 255'
  }),
  Priority: Joi.number().integer().min(0).max(255).optional().messages({
    'number.base': 'Priority must be a number',
    'number.integer': 'Priority must be an integer',
    'number.min': 'Priority must be between 0 and 255',
    'number.max': 'Priority must be between 0 and 255'
  }),
  Qty: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be greater than or equal to 0'
  })
});

export const createEpickSettingSchema = Joi.object({
  pin: Joi.string().required().messages({
    'string.base': 'PIN must be a string',
    'any.required': 'PIN is required'
  }),
  allowSingleScan: Joi.boolean().required().messages({
    'boolean.base': 'Allow single scan must be a boolean',
    'any.required': 'Allow single scan is required'
  }),
  capOrderQtyByInventory: Joi.boolean().optional().messages({
    'boolean.base': 'Cap order qty by inventory must be a boolean'
  })
});

export const updateEpickSettingSchema = Joi.object({
  pin: Joi.string().optional().messages({
    'string.base': 'PIN must be a string'
  }),
  allowSingleScan: Joi.boolean().optional().messages({
    'boolean.base': 'Allow single scan must be a boolean'
  }),
  capOrderQtyByInventory: Joi.boolean().optional().messages({
    'boolean.base': 'Cap order qty by inventory must be a boolean'
  })
});

export const createInvoiceSettingSchema = Joi.object({
  Name: Joi.string().required().messages({
    'string.base': 'Name must be a string',
    'any.required': 'Name is required'
  }),
  Email: Joi.string().email().optional().allow(null, '').messages({
    'string.base': 'Email must be a string',
    'string.email': 'Email must be a valid email address'
  }),
  Address_line_1: Joi.string().required().messages({
    'string.base': 'Address_line_1 must be a string',
    'any.required': 'Address_line_1 is required'
  }),
  Full_address: Joi.required().messages({
    'any.required': 'Full Address is required'
  }),
  header_line_1: Joi.string().allow('', null).optional().messages({ 'string.base': 'header_line_1 must be a string' }),
  invoice_Upc_Type: Joi.optional().allow(null).messages({ 'string.base': 'invoice_Upc_Type must be a required' }),
  invoice_Upc_Value: Joi.string().optional().allow(null).messages({ 'string.base': 'invoice_Upc_Value must be a string' })
}).unknown(true);

export const updateInvoiceSettingSchema = Joi.object({
  Name: Joi.string().required().messages({
    'string.base': 'Name must be a string',
    'any.required': 'Name is required'
  }),

  Address_line_1: Joi.string().required().messages({
    'string.base': 'Address_line_1 must be a string',
    'any.required': 'Address_line_1 is required'
  }),
  Full_address: Joi.required().messages({
    'any.required': 'Full Address is required'
  }),
  header_line_1: Joi.string().allow('', null).optional().messages({ 'string.base': 'header_line_1 must be a string' }),
  invoice_Upc_Type: Joi.optional().allow(null).messages({ 'string.base': 'invoice_Upc_Type must be a required' }),
  invoice_Upc_Value: Joi.string().optional().allow(null).messages({ 'string.base': 'invoice_Upc_Value must be a string' })
}).unknown(true);

export const getEpickSettingsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be greater than 0'
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be greater than 0',
    'number.max': 'Limit must be greater than 0 and less than or equal to 100'
  }),
  search: Joi.string().optional().messages({
    'string.base': 'Search must be a string'
  }),
  jurisdiction_state: Joi.number().integer().optional().messages({
    'number.base': 'Jurisdiction State must be a number',
    'number.integer': 'Jurisdiction State must be an integer'
  }),
  jurisdiction_county: Joi.number().integer().optional().messages({
    'number.base': 'Jurisdiction County must be a number',
    'number.integer': 'Jurisdiction County must be an integer'
  }),
  jurisdiction_city: Joi.number().integer().optional().messages({
    'number.base': 'Jurisdiction City must be a number',
    'number.integer': 'Jurisdiction City must be an integer'
  }),
  item_number: Joi.number().integer().optional().messages({
    'number.base': 'Item Number must be a number',
    'number.integer': 'Item Number must be an integer'
  }),
  status: Joi.number().integer().min(0).max(255).optional().messages({
    'number.base': 'Status must be a number',
    'number.integer': 'Status must be an integer',
    'number.min': 'Status must be between 0 and 255',
    'number.max': 'Status must be between 0 and 255'
  }),
  priority: Joi.number().integer().min(0).max(255).optional().messages({
    'number.base': 'Priority must be a number',
    'number.integer': 'Priority must be an integer',
    'number.min': 'Priority must be between 0 and 255',
    'number.max': 'Priority must be between 0 and 255'
  })
});

// Driver CRUD validation schemas
export const createDriverSchema = Joi.object({

  firstName: Joi.string().trim().required().messages({
    'string.base': 'First name must be a string',
    'string.empty': 'First name cannot be empty',
    'any.required': 'First name is required',
  }),

  lastName: Joi.string().trim().required().messages({
    'string.base': 'Last name must be a string',
    'string.empty': 'Last name cannot be empty',
    'any.required': 'Last name is required',
  }),

  email: Joi.string().email().required().messages({
    'string.base': 'Email must be a string',
    'string.email': 'Email must be a valid email address',
    'string.empty': 'Email cannot be empty',
    'any.required': 'Email is required',
  }),



  driverLicenseNo: Joi.string().trim().allow(null).optional().messages({
    'string.base': 'Driver license number must be a string',
  }),

  licenseExpirationDate: Joi.date().allow(null).optional().messages({
    'date.base': 'License expiration date must be a valid date',
  }),

  licenseClass: Joi.string()
    .valid('A', 'B', 'C', 'D')
    .allow(null)
    .optional()
    .messages({
      'any.only': 'License class must be one of A, B, C, or D',
    }),

  driverPicture: Joi.string().allow(null).optional().messages({
    'string.base': 'Driver picture must be a string (file path or URL)',
  }),

  dotMedicalCertificate: Joi.string().allow(null).optional().messages({
    'string.base': 'DOT medical certificate must be a string (file path or URL)',
  }),

  password: Joi.string().required().messages({
    'string.base': 'Password must be a string',
    'string.empty': 'Password cannot be empty',
    'any.required': 'Password is required',
  }),


});

export const updateDistributorSchema = Joi.object({
  PM_ID: Joi.forbidden(),
  RJR_Whole_ID: Joi.string().max(7),
  RJR_Ship_ID: Joi.string().max(7),
  RJR_Descriptor: Joi.string().max(1),
  D_Name: Joi.string().max(32),

  D_Addr1: Joi.string().max(32),
  D_Addr2: Joi.string().max(32),

  D_City: Joi.string().max(24),
  D_State: Joi.string().max(2),
  D_Zip: Joi.string().max(9),

  D_Lcontact: Joi.string().max(20),
  D_Fcontact: Joi.string().max(20),

  D_Phone: Joi.string().max(10),
  D_Fax: Joi.string().max(10),

  D_Logo: Joi.string().max(50),

  ClientID: Joi.string().max(10),

  PO_ShipTo1: Joi.string().max(50),
  PO_ShipTo2: Joi.string().max(50),
  PO_ShipTo3: Joi.string().max(50),
  PO_ShipTo4: Joi.string().max(50),

  PO_BillTo1: Joi.string().max(50),
  PO_BillTo2: Joi.string().max(50),
  PO_BillTo3: Joi.string().max(50),
  PO_BillTo4: Joi.string().max(50),

  D_Email: Joi.string().email().max(100),

  D_OtherName: Joi.string().max(200),
  D_OtherAddr1: Joi.string(),
  D_OtherAddr2: Joi.string(),

  D_OtherCity: Joi.string().max(200),
  D_OtherState: Joi.string().max(200),
  D_OtherZip: Joi.string().max(200),

  D_OtherPhone: Joi.string().max(20),
  D_OtherFax: Joi.string().max(100)

}).min(1);


export const updateDriverSchema = Joi.object({
  firstName: Joi.string().trim().required().messages({
    'string.base': 'First name must be a string',
    'string.empty': 'First name cannot be empty',
    'any.required': 'First name is required',
  }),

  lastName: Joi.string().trim().required().messages({
    'string.base': 'Last name must be a string',
    'string.empty': 'Last name cannot be empty',
    'any.required': 'Last name is required',
  }),

  email: Joi.string().email().required().messages({
    'string.base': 'Email must be a string',
    'string.email': 'Email must be a valid email address',
    'string.empty': 'Email cannot be empty',
    'any.required': 'Email is required',
  }),

  driverLicenseNo: Joi.string().trim().allow(null).optional().messages({
    'string.base': 'Driver license number must be a string',
  }),

  licenseExpirationDate: Joi.date().allow(null).optional().messages({
    'date.base': 'License expiration date must be a valid date',
  }),

  licenseClass: Joi.string()
    .valid('A', 'B', 'C', 'D')
    .allow(null)
    .optional()
    .messages({
      'any.only': 'License class must be one of A, B, C, or D',
    }),

  driverPicture: Joi.string().allow(null).optional().messages({
    'string.base': 'Driver picture must be a string (file path or URL)',
  }),

  dotMedicalCertificate: Joi.string().allow(null).optional().messages({
    'string.base': 'DOT medical certificate must be a string (file path or URL)',
  }),

  password: Joi.string().optional().allow('').messages({
    'string.base': 'Password must be a string',
  }),

  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean',
  }),
});


export const updateDriverLocationSchema = Joi.object({
  currentLatitude: Joi.number().min(-90).max(90).required().messages({
    'number.base': 'Latitude must be a number',
    'number.min': 'Latitude must be between -90 and 90',
    'number.max': 'Latitude must be between -90 and 90',
    'any.required': 'Latitude is required'
  }),
  currentLongitude: Joi.number().min(-180).max(180).required().messages({
    'number.base': 'Longitude must be a number',
    'number.min': 'Longitude must be between -180 and 180',
    'number.max': 'Longitude must be between -180 and 180',
    'any.required': 'Longitude is required'
  })
});

export const getDriversQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1'
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100'
  }),
  search: Joi.string().trim().optional().messages({
    'string.base': 'Search must be a string'
  })
});

// DriverRouteAssignment CRUD validation schemas
export const createDriverRouteAssignmentSchema = Joi.object({
  driverId: Joi.number().integer().required().messages({
    'number.base': 'Driver ID must be a number',
    'number.integer': 'Driver ID must be an integer',
    'any.required': 'Driver ID is required'
  }),
  routes: Joi.array().items(Joi.number().integer()).default([]).messages({
    'array.base': 'Routes must be an array',
    'number.base': 'Each route must be a number'
  }),
  deliveryDay: Joi.string().trim().required().messages({
    'string.base': 'Delivery day must be a string',
    'string.empty': 'Delivery day cannot be empty',
    'any.required': 'Delivery day is required'
  }),
  deliveryDayNumber: Joi.number().integer().min(1).max(7).required().messages({
    'number.base': 'Delivery day number must be a number',
    'number.integer': 'Delivery day number must be an integer',
    'number.min': 'Delivery day number must be between 1 and 7',
    'number.max': 'Delivery day number must be between 1 and 7',
    'any.required': 'Delivery day number is required'
  })
});

export const updateDriverRouteAssignmentSchema = Joi.object({
  driverId: Joi.number().integer().optional().messages({
    'number.base': 'Driver ID must be a number',
    'number.integer': 'Driver ID must be an integer'
  }),
  routes: Joi.array().items(Joi.string().trim()).optional().messages({
    'array.base': 'Routes must be an array',
    'string.base': 'Each route must be a string'
  }),
  deliveryDay: Joi.string().trim().optional().messages({
    'string.base': 'Delivery day must be a string',
    'string.empty': 'Delivery day cannot be empty'
  }),
  deliveryDayNumber: Joi.number().integer().min(1).max(7).optional().messages({
    'number.base': 'Delivery day number must be a number',
    'number.integer': 'Delivery day number must be an integer',
    'number.min': 'Delivery day number must be between 1 and 7',
    'number.max': 'Delivery day number must be between 1 and 7'
  })
});

// Vehicle CRUD validation schemas
export const createVehicleSchema = Joi.object({
  description: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': 'Description must be a string',
  }),
  loadCapacityLbs: Joi.number().integer().positive().allow(null).optional().messages({
    'number.base': 'Load capacity must be a number',
    'number.integer': 'Load capacity must be an integer',
    'number.positive': 'Load capacity must be a positive number',
  }),
  truckType: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': 'Truck type must be a string',
  }),
  licenseRegistrationNumber: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': 'License registration number must be a string',
  }),
  vinNumber: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': 'VIN number must be a string',
  }),
  engineType: Joi.string().valid('gasoline', 'electric', 'diesel').allow(null).optional().messages({
    'any.only': 'Engine type must be one of: gasoline, electric, diesel',
  }),
  lastServiceDate: Joi.date().iso().allow(null).optional().messages({
    'date.base': 'Last service date must be a valid date',
    'date.format': 'Last service date must be in ISO format (YYYY-MM-DD)',
  }),
  lastOilChangeDate: Joi.date().iso().allow(null).optional().messages({
    'date.base': 'Last oil change date must be a valid date',
    'date.format': 'Last oil change date must be in ISO format (YYYY-MM-DD)',
  }),
  nextOilChangeAfterMonths: Joi.number().integer().positive().allow(null).optional().messages({
    'number.base': 'Next oil change after months must be a number',
    'number.integer': 'Next oil change after months must be an integer',
    'number.positive': 'Next oil change after months must be a positive number',
  }),
  mileageHours: Joi.number().positive().allow(null).optional().messages({
    'number.base': 'Mileage/Hours must be a number',
    'number.positive': 'Mileage/Hours must be a positive number',
  }),
  insurancePolicyNumber: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': 'Insurance policy number must be a string',
  }),
  insuranceCarrier: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': 'Insurance carrier must be a string',
  }),
  insuranceExpirationDate: Joi.date().iso().allow(null).optional().messages({
    'date.base': 'Insurance expiration date must be a valid date',
    'date.format': 'Insurance expiration date must be in ISO format (YYYY-MM-DD)',
  }),
  conditionStatus: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': 'Condition status must be a string',
  }),
  physicalNotes: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': 'Physical notes must be a string',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean',
  }),
});

export const updateVehicleSchema = Joi.object({
  description: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': 'Description must be a string',
  }),
  loadCapacityLbs: Joi.number().integer().positive().allow(null).optional().messages({
    'number.base': 'Load capacity must be a number',
    'number.integer': 'Load capacity must be an integer',
    'number.positive': 'Load capacity must be a positive number',
  }),
  truckType: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': 'Truck type must be a string',
  }),
  licenseRegistrationNumber: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': 'License registration number must be a string',
  }),
  vinNumber: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': 'VIN number must be a string',
  }),
  engineType: Joi.string().valid('gasoline', 'electric', 'diesel').allow(null).optional().messages({
    'any.only': 'Engine type must be one of: gasoline, electric, diesel',
  }),
  lastServiceDate: Joi.date().iso().allow(null).optional().messages({
    'date.base': 'Last service date must be a valid date',
    'date.format': 'Last service date must be in ISO format (YYYY-MM-DD)',
  }),
  lastOilChangeDate: Joi.date().iso().allow(null).optional().messages({
    'date.base': 'Last oil change date must be a valid date',
    'date.format': 'Last oil change date must be in ISO format (YYYY-MM-DD)',
  }),
  nextOilChangeAfterMonths: Joi.number().integer().positive().allow(null).optional().messages({
    'number.base': 'Next oil change after months must be a number',
    'number.integer': 'Next oil change after months must be an integer',
    'number.positive': 'Next oil change after months must be a positive number',
  }),
  mileageHours: Joi.number().positive().allow(null).optional().messages({
    'number.base': 'Mileage/Hours must be a number',
    'number.positive': 'Mileage/Hours must be a positive number',
  }),
  insurancePolicyNumber: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': 'Insurance policy number must be a string',
  }),
  insuranceCarrier: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': 'Insurance carrier must be a string',
  }),
  insuranceExpirationDate: Joi.date().iso().allow(null).optional().messages({
    'date.base': 'Insurance expiration date must be a valid date',
    'date.format': 'Insurance expiration date must be in ISO format (YYYY-MM-DD)',
  }),
  conditionStatus: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': 'Condition status must be a string',
  }),
  physicalNotes: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': 'Physical notes must be a string',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean',
  }),
});

export const getVehiclesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
  search: Joi.string().trim().optional().messages({
    'string.base': 'Search must be a string',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean',
  }),
});

export const getDriverRouteAssignmentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1'
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100'
  }),
  search: Joi.string().trim().optional().messages({
    'string.base': 'Search must be a string'
  }),
  driverId: Joi.number().integer().optional().messages({
    'number.base': 'Driver ID must be a number',
    'number.integer': 'Driver ID must be an integer'
  }),
  deliveryDay: Joi.string().trim().optional().messages({
    'string.base': 'Delivery day must be a string'
  })
});

// Picklist validation schemas
export const createPicklistSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name cannot be empty',
    'any.required': 'Name is required'
  }),
  selectedFields: Joi.object({
    lineNumber: Joi.boolean().optional().default(true),
    orderedQty: Joi.boolean().required().messages({
      'any.required': 'orderedQty is required in selectedFields',
      'boolean.base': 'orderedQty must be a boolean'
    }),
    scannedQty: Joi.boolean().required().messages({
      'any.required': 'scannedQty is required in selectedFields',
      'boolean.base': 'scannedQty must be a boolean'
    }),
    description: Joi.boolean().optional().default(true),
    itemNumber: Joi.boolean().optional().default(true),
    pack: Joi.boolean().optional().default(true),
    size: Joi.boolean().optional().default(true),
    upc: Joi.boolean().optional().default(true),
    onhand: Joi.boolean().optional().default(true),
    salesCategory: Joi.boolean().optional().default(true),
    priceClass: Joi.boolean().optional().default(true),
    unitCost: Joi.boolean().optional().default(true),
    extendedCost: Joi.boolean().optional().default(true),
    retail: Joi.boolean().optional().default(true),
    section: Joi.boolean().optional().default(true),
    location: Joi.boolean().optional().default(true),
    vendorItem: Joi.boolean().optional().default(true),
    sequence: Joi.boolean().optional().default(true)
  }).required().messages({
    'any.required': 'selectedFields is required',
    'object.base': 'selectedFields must be an object'
  }),
  groupBy: Joi.string().trim().required().min(1).messages({
    'string.base': 'groupBy must be a string',
    'string.empty': 'groupBy cannot be empty',
    'any.required': 'groupBy is required',
    'string.min': 'groupBy cannot be an empty string'
  }),
  newCategoryOnNewPage: Joi.boolean().optional().default(true),
  headerPosition: Joi.string().trim().allow(null, '').optional(),
  footerPosition: Joi.string().trim().allow(null, '').optional(),
  pickedByPosition: Joi.string().trim().allow(null, '').optional(),
  checkedByPosition: Joi.string().trim().allow(null, '').optional(),
  showTotalCartons: Joi.boolean().optional().default(true),
  showTotalPieces: Joi.boolean().optional().default(true),
  showTotalLines: Joi.boolean().optional().default(true),
  showPickedBy: Joi.boolean().optional().default(true),
  showCheckedBy: Joi.boolean().optional().default(true),
  showBundles: Joi.boolean().optional().default(true)
});

export const updatePicklistSchema = Joi.object({
  name: Joi.string().trim().optional().messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name cannot be empty'
  }),
  selectedFields: Joi.object({
    lineNumber: Joi.boolean().optional(),
    orderedQty: Joi.boolean().required().messages({
      'any.required': 'orderedQty is required in selectedFields',
      'boolean.base': 'orderedQty must be a boolean'
    }),
    scannedQty: Joi.boolean().required().messages({
      'any.required': 'scannedQty is required in selectedFields',
      'boolean.base': 'scannedQty must be a boolean'
    }),
    description: Joi.boolean().optional(),
    itemNumber: Joi.boolean().optional(),
    pack: Joi.boolean().optional(),
    size: Joi.boolean().optional(),
    upc: Joi.boolean().optional(),
    onhand: Joi.boolean().optional(),
    salesCategory: Joi.boolean().optional(),
    priceClass: Joi.boolean().optional(),
    unitCost: Joi.boolean().optional(),
    extendedCost: Joi.boolean().optional(),
    retail: Joi.boolean().optional(),
    section: Joi.boolean().optional(),
    location: Joi.boolean().optional(),
    vendorItem: Joi.boolean().optional(),
    sequence: Joi.boolean().optional()
  }).optional().messages({
    'object.base': 'selectedFields must be an object'
  }),
  groupBy: Joi.string().trim().min(1).optional().messages({
    'string.base': 'groupBy must be a string',
    'string.empty': 'groupBy cannot be empty',
    'string.min': 'groupBy cannot be an empty string'
  }),
  newCategoryOnNewPage: Joi.boolean().optional(),
  headerPosition: Joi.string().trim().allow(null, '').optional(),
  footerPosition: Joi.string().trim().allow(null, '').optional(),
  pickedByPosition: Joi.string().trim().allow(null, '').optional(),
  checkedByPosition: Joi.string().trim().allow(null, '').optional(),
  showTotalCartons: Joi.boolean().optional(),
  showTotalPieces: Joi.boolean().optional(),
  showTotalLines: Joi.boolean().optional(),
  showPickedBy: Joi.boolean().optional(),
  showCheckedBy: Joi.boolean().optional(),
  showBundles: Joi.boolean().optional()
});

// FuturePricing validation schemas
const futurePricingItemSchema = Joi.object({
  itemNumber: Joi.number().integer().positive().required().messages({
    'number.base': 'Item number must be a number',
    'number.integer': 'Item number must be an integer',
    'number.positive': 'Item number must be positive',
    'any.required': 'Item number is required',
  }),
  effectiveAt: Joi.date().required().messages({
    'date.base': 'Effective date must be a valid date',
    'any.required': 'Effective date is required',
  }),
  changedFields: Joi.array().items(Joi.object()).min(1).required().messages({
    'array.base': 'Changed fields must be an array',
    'array.min': 'Changed fields must contain at least one field change',
    'any.required': 'Changed fields is required',
  }),
  isApplied: Joi.boolean().optional().default(false).messages({
    'boolean.base': 'Is applied must be a boolean',
  }),
  changedBy: Joi.string().valid('admin', 'user').required().messages({
    'string.base': 'Changed by must be a string',
    'any.only': 'Changed by must be either "admin" or "user"',
    'any.required': 'Changed by is required',
  }),
  changedUserId: Joi.number().integer().positive().allow(null).optional().messages({
    'number.base': 'Changed user ID must be a number',
    'number.integer': 'Changed user ID must be an integer',
    'number.positive': 'Changed user ID must be positive',
  }),
});

export const createFuturePricingSchema = Joi.object({
  futurePricings: Joi.array().items(futurePricingItemSchema).min(1).required().messages({
    'array.base': 'Future pricings must be an array',
    'array.min': 'At least one future pricing entry is required',
    'any.required': 'Future pricings array is required',
  }),
});

export const updateFuturePricingSchema = Joi.object({
  itemNumber: Joi.number().integer().positive().optional().messages({
    'number.base': 'Item number must be a number',
    'number.integer': 'Item number must be an integer',
    'number.positive': 'Item number must be positive',
  }),
  effectiveAt: Joi.date().optional().messages({
    'date.base': 'Effective date must be a valid date',
  }),
  changedFields: Joi.array().items(Joi.object()).min(1).optional().messages({
    'array.base': 'Changed fields must be an array',
    'array.min': 'Changed fields must contain at least one field change',
  }),
  isApplied: Joi.boolean().optional().messages({
    'boolean.base': 'Is applied must be a boolean',
  }),
  changedBy: Joi.string().valid('admin', 'user').optional().messages({
    'string.base': 'Changed by must be a string',
    'any.only': 'Changed by must be either "admin" or "user"',
  }),
  changedUserId: Joi.number().integer().positive().allow(null).optional().messages({
    'number.base': 'Changed user ID must be a number',
    'number.integer': 'Changed user ID must be an integer',
    'number.positive': 'Changed user ID must be positive',
  }),
});

export const getFuturePricingQuerySchema = Joi.object({
  page: Joi.number().integer().positive().optional().default(1),
  limit: Joi.number().integer().positive().optional().default(10),
  search: Joi.string().optional().allow(''),
  itemNumber: Joi.number().integer().positive().optional(),
  isApplied: Joi.boolean().optional(),
  changedBy: Joi.string().valid('admin', 'user').optional(),
});

export const createInventoryItemGroupSchema = Joi.object({
  Item_GroupID: Joi.number().integer().required().messages({
    'number.base': 'Item_GroupID must be a number',
    'number.integer': 'Item_GroupID must be an integer',
    'any.required': 'Item_GroupID is required'
  }),
  Item_GroupDescription: Joi.string().trim().required().messages({
    'string.base': 'Item_GroupDescription must be a string',
    'string.empty': 'Item_GroupDescription cannot be empty',
    'any.required': 'Item_GroupDescription is required'
  })
});
// RetailerDocuments validation schemas
export const createRetailerDocumentsSchema = Joi.object({
  customerNumber: Joi.number().integer().positive().required().messages({
    'number.base': 'Customer number must be a number',
    'number.integer': 'Customer number must be an integer',
    'number.positive': 'Customer number must be positive',
    'any.required': 'Customer number is required',
  }),
  attachments: Joi.array().items(Joi.string()).optional().allow(null).messages({
    'array.base': 'Attachments must be an array',
  }),
  salesTaxDoc: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Sales tax document must be a string',
  }),
  CigTaxDoc: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Cig tax document must be a string',
  }),
  licenseAttachments: Joi.array().items(Joi.string()).optional().allow(null).messages({
    'array.base': 'License attachments must be an array',
  }),
});

export const updateRetailerDocumentsSchema = Joi.object({
  customerNumber: Joi.number().integer().positive().optional().messages({
    'number.base': 'Customer number must be a number',
    'number.integer': 'Customer number must be an integer',
    'number.positive': 'Customer number must be positive',
  }),
  attachments: Joi.array().items(Joi.string()).optional().allow(null).messages({
    'array.base': 'Attachments must be an array',
  }),
  salesTaxDoc: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Sales tax document must be a string',
  }),
  CigTaxDoc: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Cig tax document must be a string',
  }),
  licenseAttachments: Joi.array().items(Joi.string()).optional().allow(null).messages({
    'array.base': 'License attachments must be an array',
  }),
});

export const getRetailerDocumentsQuerySchema = Joi.object({
  page: Joi.number().integer().positive().optional().default(1),
  limit: Joi.number().integer().positive().optional().default(10),
  search: Joi.string().optional().allow(''),
  customerNumber: Joi.number().integer().positive().optional(),
});

// RetailerLocation validation schemas
export const createRetailerLocationSchema = Joi.object({
  C_Number: Joi.number().integer().positive().required().messages({
    'number.base': 'Customer number must be a number',
    'number.integer': 'Customer number must be an integer',
    'number.positive': 'Customer number must be positive',
    'any.required': 'Customer number is required',
  }),
  lat: Joi.number().optional().allow(null).messages({
    'number.base': 'Latitude must be a number',
  }),
  long: Joi.number().optional().allow(null).messages({
    'number.base': 'Longitude must be a number',
  }),
  City: Joi.string().optional().allow(null, '').messages({
    'string.base': 'City must be a string',
  }),
  Country: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Country must be a string',
  }),
  Address: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Address must be a string',
  }),
  State: Joi.string().optional().allow(null, '').messages({
    'string.base': 'State must be a string',
  }),
  Zip: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Zip must be a string',
  }),
});

export const updateRetailerLocationSchema = Joi.object({
  C_Number: Joi.number().integer().positive().optional().messages({
    'number.base': 'Customer number must be a number',
    'number.integer': 'Customer number must be an integer',
    'number.positive': 'Customer number must be positive',
  }),
  lat: Joi.number().optional().allow(null).messages({
    'number.base': 'Latitude must be a number',
  }),
  long: Joi.number().optional().allow(null).messages({
    'number.base': 'Longitude must be a number',
  }),
  City: Joi.string().optional().allow(null, '').messages({
    'string.base': 'City must be a string',
  }),
  Country: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Country must be a string',
  }),
  Address: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Address must be a string',
  }),
  State: Joi.string().optional().allow(null, '').messages({
    'string.base': 'State must be a string',
  }),
  Zip: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Zip must be a string',
  }),
});

export const getRetailerLocationQuerySchema = Joi.object({
  page: Joi.number().integer().positive().optional().default(1),
  limit: Joi.number().integer().positive().optional().default(10),
  search: Joi.string().optional().allow(''),
  C_Number: Joi.number().integer().positive().optional(),
});


export const updateInventoryItemGroupSchema = Joi.object({
  Item_GroupID: Joi.number().integer().optional().messages({
    'number.base': 'Item_GroupID must be a number',
    'number.integer': 'Item_GroupID must be an integer'
  }),
  Item_GroupDescription: Joi.string().trim().optional().messages({
    'string.base': 'Item_GroupDescription must be a string',
  })
});

export const createInventoryBrandSchema = Joi.object({
  Brand_ID: Joi.number().integer().messages({
    'number.base': 'BrandID must be a number',
    'number.integer': 'BrandID must be an integer',
    // 'any.required': 'BrandID is required'
  }),
  Brand_Family: Joi.string().trim().required().messages({
    'string.base': 'Brand_Family must be a string',
    'string.empty': 'Brand_Family cannot be empty',
    'any.required': 'Brand_Family is required'
  }),
  Brand_PM_Status: Joi.string().trim().messages({
    'string.base': 'Brand_PM_Status must be a string',
    'string.empty': 'Brand_PM_Status cannot be empty',
  }),
  Brand_ReceivedStamped: Joi.boolean().optional().messages({
    'boolean.base': 'Brand_ReceivedStamped must be a boolean',
  })
});

export const updateInventoryBrandSchema = Joi.object({
  Brand_ID: Joi.number().integer().optional().messages({
    'number.base': 'BrandID must be a number',
    'number.integer': 'BrandID must be an integer'
  }),
  Brand_Family: Joi.string().trim().optional().messages({
    'string.base': 'Brand_Family must be a string',
  }),
  Brand_PM_Status: Joi.string().trim().optional().messages({
    'string.base': 'Brand_PM_Status must be a string',
  }),
  Brand_ReceivedStamped: Joi.boolean().optional().messages({
    'boolean.base': 'Brand_ReceivedStamped must be a boolean',
  })
});

export const updatePriceClassSchema = Joi.object({
  Class_Desc: Joi.string().trim().optional().messages({
    'string.base': 'Class_Desc must be a string',
  }),
  MSA_Default: Joi.string().trim().optional().messages({
    'string.base': 'MSA_Default must be a string',
  }),
  Price_Class: Joi.forbidden().messages({
    'any.unknown': 'Price_Class cannot be updated',
    'any.forbidden': 'Price_Class cannot be updated',
  }),
  Rebate_Amount: Joi.number().precision(2).min(0).optional().messages({
    'number.base': 'Rebate_Amount must be a number',
    'number.min': 'Rebate_Amount must be greater than or equal to 0',
  }),
  SelectionVisible: Joi.boolean().optional().messages({
    'boolean.base': 'SelectionVisible must be a boolean',
  }),
  Allow_Price_Change: Joi.boolean().optional().messages({
    'boolean.base': 'Allow_Price_Change must be a boolean',
  }),
  Allow_Price_Change_Remote: Joi.boolean().optional().messages({
    'boolean.base': 'Allow_Price_Change_Remote must be a boolean',
  }),
  Sales_Category_Group: Joi.string().trim().optional().messages({
    'string.base': 'Sales_Category_Group must be a string',
  }),
  Product_ExpDays: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Product_ExpDays must be a number',
    'number.integer': 'Product_ExpDays must be an integer',
    'number.min': 'Product_ExpDays must be greater than or equal to 0',
  })
});

// Delivery Route Schema
export const createDeliveryRouteSchema = Joi.object({
  routeNumber: Joi.string().trim().required().messages({
    'any.required': 'routeNumber is required',
    'string.empty': 'routeNumber cannot be empty',
    'string.base': 'routeNumber must be a string',
  }),

  day: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'any.required': 'day is required',
      'string.empty': 'day cannot be empty',
      'string.pattern.base': 'day must be in YYYY-MM-DD format',
    }),

  driverId: Joi.number().integer().positive().required().messages({
    'any.required': 'driverId is required',
    'number.base': 'driverId must be a number',
    'number.integer': 'driverId must be an integer',
    'number.positive': 'driverId must be a positive number',
  }),

  truckId: Joi.number().integer().positive().required().messages({
    'any.required': 'truckId is required',
    'number.base': 'truckId must be a number',
    'number.integer': 'truckId must be an integer',
    'number.positive': 'truckId must be a positive number',
  }),

  origin: Joi.object({
    lat: Joi.number().min(-90).max(90).required().messages({
      'any.required': 'origin.lat is required',
      'number.base': 'origin.lat must be a number',
      'number.min': 'origin.lat must be between -90 and 90',
      'number.max': 'origin.lat must be between -90 and 90',
    }),
    lng: Joi.number().min(-180).max(180).required().messages({
      'any.required': 'origin.lng is required',
      'number.base': 'origin.lng must be a number',
      'number.min': 'origin.lng must be between -180 and 180',
      'number.max': 'origin.lng must be between -180 and 180',
    }),
  })
    .required()
    .messages({
      'any.required': 'origin is required',
      'object.base': 'origin must be an object',
    }),

  destination: Joi.object({
    lat: Joi.number().min(-90).max(90).required().messages({
      'any.required': 'destination.lat is required',
      'number.base': 'destination.lat must be a number',
      'number.min': 'destination.lat must be between -90 and 90',
      'number.max': 'destination.lat must be between -90 and 90',
    }),
    lng: Joi.number().min(-180).max(180).required().messages({
      'any.required': 'destination.lng is required',
      'number.base': 'destination.lng must be a number',
      'number.min': 'destination.lng must be between -180 and 180',
      'number.max': 'destination.lng must be between -180 and 180',
    }),
  })
    .required()
    .messages({
      'any.required': 'destination is required',
      'object.base': 'destination must be an object',
    }),

  stops: Joi.array()
    .items(
      Joi.object({
        stopSequence: Joi.number().integer().positive().required().messages({
          'any.required': 'stopSequence is required',
          'number.base': 'stopSequence must be a number',
          'number.integer': 'stopSequence must be an integer',
          'number.positive': 'stopSequence must be a positive number',
        }),
        C_Number: Joi.number().integer().positive().required().messages({
          'any.required': 'C_Number is required',
          'number.base': 'C_Number must be a number',
          'number.integer': 'C_Number must be an integer',
          'number.positive': 'C_Number must be a positive number',
        }),
        lat: Joi.number().min(-90).max(90).required().messages({
          'any.required': 'lat is required',
          'number.base': 'lat must be a number',
          'number.min': 'lat must be between -90 and 90',
          'number.max': 'lat must be between -90 and 90',
        }),
        lng: Joi.number().min(-180).max(180).required().messages({
          'any.required': 'lng is required',
          'number.base': 'lng must be a number',
          'number.min': 'lng must be between -180 and 180',
          'number.max': 'lng must be between -180 and 180',
        }),
        orderNumbers: Joi.alternatives()
          .try(
            Joi.number().integer().positive(),
            Joi.array().items(Joi.number().integer().positive())
          )
          .required()
          .messages({
            'any.required': 'orderNumbers is required',
            'alternatives.match': 'orderNumbers must be a number or an array of numbers',
          }),
      })
    )
    .min(1)
    .required()
    .messages({
      'any.required': 'stops is required',
      'array.base': 'stops must be an array',
      'array.min': 'stops must contain at least one stop',
    })
});
// PreBook validation schemas
export const createPreBookSchema = Joi.object({
  startDate: Joi.date().required().messages({
    'date.base': 'Start date must be a valid date',
    'any.required': 'Start date is required',
  }),
  endDate: Joi.date().required().messages({
    'date.base': 'End date must be a valid date',
    'any.required': 'End date is required',
  }),
  products: Joi.array().items(Joi.number().integer().positive()).min(1).required().messages({
    'array.base': 'Products must be an array',
    'array.min': 'Products must contain at least one item',
    'any.required': 'Products array is required',
  }),
  showPrice: Joi.boolean().optional().default(false).messages({
    'boolean.base': 'Show price must be a boolean',
  }),
  note: Joi.string().allow(null, '').optional().messages({
    'string.base': 'Note must be a string',
  }),
});

export const updatePreBookSchema = Joi.object({
  startDate: Joi.date().optional().messages({
    'date.base': 'Start date must be a valid date',
  }),
  endDate: Joi.date().optional().messages({
    'date.base': 'End date must be a valid date',
  }),
  products: Joi.array().items(Joi.number().integer().positive()).min(1).optional().messages({
    'array.base': 'Products must be an array',
    'array.min': 'Products must contain at least one item',
  }),
  showPrice: Joi.boolean().optional().messages({
    'boolean.base': 'Show price must be a boolean',
  }),
  note: Joi.string().allow(null, '').optional().messages({
    'string.base': 'Note must be a string',
  }),
});

export const getPreBooksQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
});

// TradeShow validation schemas
export const createTradeShowSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name cannot be empty',
    'any.required': 'Name is required',
  }),
  description: Joi.string().allow(null, '').optional().messages({
    'string.base': 'Description must be a string',
  }),
  tradeShowDate: Joi.date().required().messages({
    'date.base': 'Trade show date must be a valid date',
    'any.required': 'Trade show date is required',
  }),
  deliveryStartDate: Joi.date().required().messages({
    'date.base': 'Delivery start date must be a valid date',
    'any.required': 'Delivery start date is required',
  }),
  deliveryEndDate: Joi.date().required().messages({
    'date.base': 'Delivery end date must be a valid date',
    'any.required': 'Delivery end date is required',
  }),
  deliveryWeeks: Joi.number().integer().min(0).required().messages({
    'number.base': 'Delivery weeks must be a number',
    'number.integer': 'Delivery weeks must be an integer',
    'number.min': 'Delivery weeks must be greater than or equal to 0',
    'any.required': 'Delivery weeks is required',
  }),
  status: Joi.string().valid('active', 'inactive').optional().default('inactive').messages({
    'string.base': 'Status must be a string',
    'any.only': 'Status must be either "active" or "inactive"',
  }),
});

export const updateTradeShowSchema = Joi.object({
  name: Joi.string().trim().optional().messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name cannot be empty',
  }),
  description: Joi.string().allow(null, '').optional().messages({
    'string.base': 'Description must be a string',
  }),
  tradeShowDate: Joi.date().optional().messages({
    'date.base': 'Trade show date must be a valid date',
  }),
  deliveryStartDate: Joi.date().optional().messages({
    'date.base': 'Delivery start date must be a valid date',
  }),
  deliveryEndDate: Joi.date().optional().messages({
    'date.base': 'Delivery end date must be a valid date',
  }),
  deliveryWeeks: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Delivery weeks must be a number',
    'number.integer': 'Delivery weeks must be an integer',
    'number.min': 'Delivery weeks must be greater than or equal to 0',
  }),
  status: Joi.string().valid('active', 'inactive').optional().messages({
    'string.base': 'Status must be a string',
    'any.only': 'Status must be either "active" or "inactive"',
  }),
});

export const getTradeShowsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  tradeShowDate: Joi.date().optional(),
  deliveryStartDate: Joi.date().optional(),
  deliveryEndDate: Joi.date().optional(),
});

export const createTradeShowItemSchema = Joi.object({
  tradeShowId: Joi.number().integer().required().messages({
    'number.base': 'Trade show ID must be a number',
    'number.integer': 'Trade show ID must be an integer',
    'any.required': 'Trade show ID is required',
  }),
  itemNumber: Joi.string().required().messages({
    'string.base': 'Item number must be a string',
    'string.empty': 'Item number cannot be empty',
    'any.required': 'Item number is required',
  }),
  discount: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).required().messages({
    'string.base': 'Discount must be a string',
    'string.pattern.base': 'Discount must be a valid decimal number',
    'any.required': 'Discount is required',
  }),
  minQuantity: Joi.number().integer().min(0).required().messages({
    'number.base': 'Minimum quantity must be a number',
    'number.integer': 'Minimum quantity must be an integer',
    'number.min': 'Minimum quantity must be greater than or equal to 0',
    'any.required': 'Minimum quantity is required',
  }),
  maxQuantity: Joi.number().integer().min(0).required().messages({
    'number.base': 'Maximum quantity must be a number',
    'number.integer': 'Maximum quantity must be an integer',
    'number.min': 'Maximum quantity must be greater than or equal to 0',
    'any.required': 'Maximum quantity is required',
  }),
  disType: Joi.string().valid('PERCENT', 'FLAT').required().messages({
    'string.base': 'Discount type must be a string',
    'any.only': 'Discount type must be either "PERCENT" or "FLAT"',
    'any.required': 'Discount type is required',
  }),
}).custom((value, helpers) => {
  if (value.minQuantity > value.maxQuantity) {
    return helpers.error('any.invalid', {
      message: 'Minimum quantity must be less than or equal to maximum quantity',
    });
  }
  return value;
});

export const updateTradeShowItemSchema = Joi.object({
  tradeShowId: Joi.number().integer().optional().messages({
    'number.base': 'Trade show ID must be a number',
    'number.integer': 'Trade show ID must be an integer',
  }),
  itemNumber: Joi.string().optional().messages({
    'string.base': 'Item number must be a string',
    'string.empty': 'Item number cannot be empty',
  }),
  discount: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).optional().messages({
    'string.base': 'Discount must be a string',
    'string.pattern.base': 'Discount must be a valid decimal number',
  }),
  minQuantity: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Minimum quantity must be a number',
    'number.integer': 'Minimum quantity must be an integer',
    'number.min': 'Minimum quantity must be greater than or equal to 0',
  }),
  maxQuantity: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Maximum quantity must be a number',
    'number.integer': 'Maximum quantity must be an integer',
    'number.min': 'Maximum quantity must be greater than or equal to 0',
  }),
  disType: Joi.string().valid('PERCENT', 'FLAT').optional().messages({
    'string.base': 'Discount type must be a string',
    'any.only': 'Discount type must be either "PERCENT" or "FLAT"',
  }),
});

export const getTradeShowItemsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  tradeShowId: Joi.number().integer().optional(),
  itemNumber: Joi.string().optional(),
  disType: Joi.string().valid('PERCENT', 'FLAT').optional(),
});

export const createBulkTradeShowItemsSchema = Joi.object({
  tradeShowId: Joi.number().integer().required().messages({
    'number.base': 'Trade show ID must be a number',
    'number.integer': 'Trade show ID must be an integer',
    'any.required': 'Trade show ID is required',
  }),
  items: Joi.array()
    .items(
      Joi.object({
        itemNumber: Joi.string().required().messages({
          'string.base': 'Item number must be a string',
          'string.empty': 'Item number cannot be empty',
          'any.required': 'Item number is required',
        }),
        discount: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).required().messages({
          'string.base': 'Discount must be a string',
          'string.pattern.base': 'Discount must be a valid decimal number',
          'any.required': 'Discount is required',
        }),
        minQuantity: Joi.number().integer().min(0).required().messages({
          'number.base': 'Minimum quantity must be a number',
          'number.integer': 'Minimum quantity must be an integer',
          'number.min': 'Minimum quantity must be greater than or equal to 0',
          'any.required': 'Minimum quantity is required',
        }),
        description: Joi.string().required().messages({
          'string.base': 'Description must be a string',
          'string.empty': 'Description cannot be empty',
          'any.required': 'Description is required',
        }),
        salesCategory: Joi.number().integer().min(0).required().messages({
          'number.base': 'Sales category must be a number',
          'number.integer': 'Sales category must be an integer',
          'number.min': 'Sales category must be greater than or equal to 0',
          'any.required': 'Sales category is required',
        }),
        priceClass: Joi.number().integer().min(0).required().messages({
          'number.base': 'Price class must be a number',
          'number.integer': 'Price class must be an integer',
          'number.min': 'Price class must be greater than or equal to 0',
          'any.required': 'Price class is required',
        }),
        maxQuantity: Joi.number().integer().min(0).required().messages({
          'number.base': 'Maximum quantity must be a number',
          'number.integer': 'Maximum quantity must be an integer',
          'number.min': 'Maximum quantity must be greater than or equal to 0',
          'any.required': 'Maximum quantity is required',
        }),
        disType: Joi.string().valid('PERCENT', 'FLAT').required().messages({
          'string.base': 'Discount type must be a string',
          'any.only': 'Discount type must be either "PERCENT" or "FLAT"',
          'any.required': 'Discount type is required',
        }),
        vendorId: Joi.number().integer().optional().messages({
          'number.base': 'Vendor ID must be a number',
          'number.integer': 'Vendor ID must be an integer',
        }),
      })
    )
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.base': 'Items must be an array',
      'array.min': 'Items array must contain at least one item',
      'array.max': 'Cannot create more than 100 items at once',
      'any.required': 'Items array is required',
    }),
}).custom((value, helpers) => {
  // Validate that minQuantity <= maxQuantity for each item
  const errors: string[] = [];
  value.items.forEach((item: any, index: number) => {
    // Validate that quantities are finite numbers
    if (!Number.isFinite(item.minQuantity) || item.minQuantity < 0) {
      errors.push(`Item at index ${index}: Minimum quantity must be a non-negative number`);
    }
    if (!Number.isFinite(item.maxQuantity) || item.maxQuantity < 0) {
      errors.push(`Item at index ${index}: Maximum quantity must be a non-negative number`);
    }
    // Validate quantity range only if both are valid finite numbers
    if (
      Number.isFinite(item.minQuantity) &&
      Number.isFinite(item.maxQuantity) &&
      item.minQuantity > item.maxQuantity
    ) {
      errors.push(`Item at index ${index}: Minimum quantity must be less than or equal to maximum quantity`);
    }
    // Validate discount for PERCENT type
    if (item.disType === 'PERCENT') {
      const discountValue = parseFloat(item.discount);
      if (!Number.isFinite(discountValue) || discountValue < 0) {
        errors.push(`Item at index ${index}: Discount must be a valid non-negative number`);
      }
      if (Number.isFinite(discountValue) && discountValue > 100) {
        errors.push(`Item at index ${index}: Percentage discount cannot exceed 100`);
      }
    }
    // Validate discount for FLAT type
    if (item.disType === 'FLAT') {
      const discountValue = parseFloat(item.discount);
      if (!Number.isFinite(discountValue) || discountValue < 0) {
        errors.push(`Item at index ${index}: Discount must be a valid non-negative number`);
      }
    }
  });

  if (errors.length > 0) {
    return helpers.error('any.invalid', {
      message: errors.join('; '),
    });
  }
  return value;
});

export const updateBulkTradeShowItemsSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().integer().positive().required().messages({
          'number.base': 'id must be a number',
          'number.integer': 'id must be an integer',
          'number.positive': 'id must be a positive number',
          'any.required': 'id is required',
        }),
        tradeShowId: Joi.number().integer().optional().messages({
          'number.base': 'Trade show ID must be a number',
          'number.integer': 'Trade show ID must be an integer',
        }),
        itemNumber: Joi.string().optional().messages({
          'string.base': 'Item number must be a string',
          'string.empty': 'Item number cannot be empty',
        }),
        discount: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).optional().messages({
          'string.base': 'Discount must be a string',
          'string.pattern.base': 'Discount must be a valid decimal number',
        }),
        minQuantity: Joi.number().integer().min(0).optional().messages({
          'number.base': 'Minimum quantity must be a number',
          'number.integer': 'Minimum quantity must be an integer',
          'number.min': 'Minimum quantity must be greater than or equal to 0',
        }),
        maxQuantity: Joi.number().integer().min(0).optional().messages({
          'number.base': 'Maximum quantity must be a number',
          'number.integer': 'Maximum quantity must be an integer',
          'number.min': 'Maximum quantity must be greater than or equal to 0',
        }),
        disType: Joi.string().valid('PERCENT', 'FLAT').optional().messages({
          'string.base': 'Discount type must be a string',
          'any.only': 'Discount type must be either "PERCENT" or "FLAT"',
        }),
        description: Joi.string().optional().messages({
          'string.base': 'Description must be a string',
        }),
        salesCategory: Joi.number().integer().min(0).optional().messages({
          'number.base': 'Sales category must be a number',
          'number.integer': 'Sales category must be an integer',
          'number.min': 'Sales category must be greater than or equal to 0',
        }),
        priceClass: Joi.number().integer().min(0).optional().messages({
          'number.base': 'Price class must be a number',
          'number.integer': 'Price class must be an integer',
          'number.min': 'Price class must be greater than or equal to 0',
        }),
        vendorId: Joi.number().integer().optional().messages({
          'number.base': 'Vendor ID must be a number',
          'number.integer': 'Vendor ID must be an integer',
        }),
      })
    )
    .min(1)
    .max(100)
    .required()
    .custom((value, helpers) => {
      const errors: string[] = [];
      const seen = new Set<number>();

      value.forEach((item: any, index: number) => {
        // Check for duplicate IDs
        if (item.id && seen.has(item.id)) {
          errors.push(`Item at index ${index}: id ${item.id} is duplicated in the request`);
        } else if (item.id) {
          seen.add(item.id);
        }

        // Validate quantity range if both are provided
        if (item.minQuantity !== undefined && item.maxQuantity !== undefined) {
          if (!Number.isFinite(item.minQuantity) || item.minQuantity < 0) {
            errors.push(`Item at index ${index}: Minimum quantity must be a non-negative number`);
          }
          if (!Number.isFinite(item.maxQuantity) || item.maxQuantity < 0) {
            errors.push(`Item at index ${index}: Maximum quantity must be a non-negative number`);
          }
          if (
            Number.isFinite(item.minQuantity) &&
            Number.isFinite(item.maxQuantity) &&
            item.minQuantity > item.maxQuantity
          ) {
            errors.push(`Item at index ${index}: Minimum quantity must be less than or equal to maximum quantity`);
          }
        }

        // Validate discount for PERCENT type
        if (item.discount !== undefined) {
          const discountValue = parseFloat(item.discount);
          if (!Number.isFinite(discountValue) || discountValue < 0) {
            errors.push(`Item at index ${index}: Discount must be a valid non-negative number`);
          }
          const disType = item.disType || 'PERCENT'; // Default to PERCENT if not provided
          if (disType === 'PERCENT' && Number.isFinite(discountValue) && discountValue > 100) {
            errors.push(`Item at index ${index}: Percentage discount cannot exceed 100`);
          }
        }
      });

      if (errors.length > 0) {
        return helpers.error('any.invalid', {
          message: errors.join('; '),
        });
      }
      return value;
    })
    .messages({
      'array.base': 'Items must be an array',
      'array.min': 'Items array must contain at least one item',
      'array.max': 'Cannot update more than 100 items at once',
      'any.required': 'Items array is required',
    }),
});

export const createTradeShowRetailerSchema = Joi.object({
  tradeShowId: Joi.number().integer().required().messages({
    'number.base': 'Trade show ID must be a number',
    'number.integer': 'Trade show ID must be an integer',
    'any.required': 'Trade show ID is required',
  }),
  retailerId: Joi.number().integer().required().messages({
    'number.base': 'Retailer ID must be a number',
    'number.integer': 'Retailer ID must be an integer',
    'any.required': 'Retailer ID is required',
  }),
});

export const createBulkTradeShowRetailersSchema = Joi.object({
  tradeShowId: Joi.number().integer().required().messages({
    'number.base': 'Trade show ID must be a number',
    'number.integer': 'Trade show ID must be an integer',
    'any.required': 'Trade show ID is required',
  }),
  retailerIds: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().integer().positive().required().messages({
          'number.base': 'id must be a number',
          'number.integer': 'id must be an integer',
          'number.positive': 'id must be a positive number',
          'any.required': 'id is required',
        }),
        name: Joi.string().trim().required().messages({
          'string.base': 'name must be a string',
          'string.empty': 'name cannot be empty',
          'any.required': 'name is required',
        }),
      })
    )
    .min(1)
    .max(100)
    .required()
    .custom((value, helpers) => {
      const seen = new Set<number>();
      const errors: string[] = [];

      value.forEach((retailer: any, index: number) => {
        if (retailer.id && seen.has(retailer.id)) {
          errors.push(`Retailer at index ${index}: id ${retailer.id} is duplicated in the request`);
        } else if (retailer.id) {
          seen.add(retailer.id);
        }
      });

      if (errors.length > 0) {
        return helpers.error('any.custom', {
          message: errors.join('; '),
        });
      }
      return value;
    })
    .messages({
      'array.base': 'Retailer IDs must be an array',
      'array.min': 'Retailer IDs array must contain at least one retailer',
      'array.max': 'Cannot create more than 100 associations at once',
      'any.required': 'Retailer IDs array is required',
      'any.custom': 'Validation errors: {#message}',
    }),
});

export const updateTradeShowRetailerSchema = Joi.object({
  tradeShowId: Joi.number().integer().optional().messages({
    'number.base': 'Trade show ID must be a number',
    'number.integer': 'Trade show ID must be an integer',
  }),
  retailerId: Joi.number().integer().optional().messages({
    'number.base': 'Retailer ID must be a number',
    'number.integer': 'Retailer ID must be an integer',
  }),
});

export const getTradeShowRetailersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  tradeShowId: Joi.number().integer().optional(),
  retailerId: Joi.number().integer().optional(),
});

// TradeShowVendor validation schemas
export const createTradeShowVendorSchema = Joi.object({
  tradeShowId: Joi.number().integer().required().messages({
    'number.base': 'Trade show ID must be a number',
    'number.integer': 'Trade show ID must be an integer',
    'any.required': 'Trade show ID is required',
  }),
  vendorId: Joi.number().integer().required().messages({
    'number.base': 'Vendor ID must be a number',
    'number.integer': 'Vendor ID must be an integer',
    'any.required': 'Vendor ID is required',
  }),
});

export const createBulkTradeShowVendorsSchema = Joi.object({
  tradeShowId: Joi.number().integer().required().messages({
    'number.base': 'Trade show ID must be a number',
    'number.integer': 'Trade show ID must be an integer',
    'any.required': 'Trade show ID is required',
  }),
  vendorIds: Joi.array()
    .items(
      Joi.object({
        Primary_Vendor: Joi.number().integer().positive().required().messages({
          'number.base': 'Primary_Vendor must be a number',
          'number.integer': 'Primary_Vendor must be an integer',
          'number.positive': 'Primary_Vendor must be a positive number',
          'any.required': 'Primary_Vendor is required',
        }),
        V_Description: Joi.string().trim().optional().allow('', null).messages({
          'string.base': 'V_Description must be a string',
        }),
      })
    )
    .min(1)
    .max(100)
    .required()
    .custom((value, helpers) => {
      const seen = new Set<number>();
      const errors: string[] = [];

      value.forEach((vendor: any, index: number) => {
        if (vendor.Primary_Vendor && seen.has(vendor.Primary_Vendor)) {
          errors.push(`Vendor at index ${index}: Primary_Vendor ${vendor.Primary_Vendor} is duplicated in the request`);
        } else if (vendor.Primary_Vendor) {
          seen.add(vendor.Primary_Vendor);
        }
      });

      if (errors.length > 0) {
        return helpers.error('any.custom', {
          message: errors.join('; '),
        });
      }
      return value;
    })
    .messages({
      'array.base': 'Vendor IDs must be an array',
      'array.min': 'Vendor IDs array must contain at least one vendor',
      'array.max': 'Cannot create more than 100 associations at once',
      'any.required': 'Vendor IDs array is required',
      'any.custom': 'Validation errors: {#message}',
    }),
});

export const updateTradeShowVendorSchema = Joi.object({
  tradeShowId: Joi.number().integer().optional().messages({
    'number.base': 'Trade show ID must be a number',
    'number.integer': 'Trade show ID must be an integer',
  }),
  vendorId: Joi.number().integer().optional().messages({
    'number.base': 'Vendor ID must be a number',
    'number.integer': 'Vendor ID must be an integer',
  }),
});

export const getTradeShowVendorsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  tradeShowId: Joi.number().integer().optional(),
  vendorId: Joi.number().integer().optional(),
});

// TradeShowDeliveryProduct validation schemas
export const createTradeShowDeliveryProductSchema = Joi.object({
  tradeShowId: Joi.number().integer().required().messages({
    'number.base': 'Trade show ID must be a number',
    'number.integer': 'Trade show ID must be an integer',
    'any.required': 'Trade show ID is required',
  }),
  itemNumber: Joi.string().required().messages({
    'string.base': 'Item number must be a string',
    'string.empty': 'Item number cannot be empty',
    'any.required': 'Item number is required',
  }),
  weekNumber: Joi.number().integer().min(1).required().messages({
    'number.base': 'Week number must be a number',
    'number.integer': 'Week number must be an integer',
    'number.min': 'Week number must be at least 1',
    'any.required': 'Week number is required',
  }),
  startDate: Joi.date().required().messages({
    'date.base': 'Start date must be a valid date',
    'any.required': 'Start date is required',
  }),
  endDate: Joi.date().required().messages({
    'date.base': 'End date must be a valid date',
    'any.required': 'End date is required',
  }),
  deliveryType: Joi.string().valid('pickup', 'delivery').required().messages({
    'string.base': 'Delivery type must be a string',
    'any.only': 'Delivery type must be either "pickup" or "delivery"',
    'any.required': 'Delivery type is required',
  }),
}).custom((value, helpers) => {
  if (value.startDate > value.endDate) {
    return helpers.error('any.invalid', {
      message: 'Start date must be before or equal to end date',
    });
  }
  return value;
});

export const createBulkTradeShowDeliveryProductsSchema = Joi.object({
  tradeShowId: Joi.number().integer().required().messages({
    'number.base': 'Trade show ID must be a number',
    'number.integer': 'Trade show ID must be an integer',
    'any.required': 'Trade show ID is required',
  }),
  deliveries: Joi.array()
    .items(
      Joi.object({
        itemNumber: Joi.number().required().messages({
          'string.base': 'Item number must be a string',
          'string.empty': 'Item number cannot be empty',
          'any.required': 'Item number is required',
        }),
        weekNumber: Joi.number().integer().min(1).required().messages({
          'number.base': 'Week number must be a number',
          'number.integer': 'Week number must be an integer',
          'number.min': 'Week number must be at least 1',
          'any.required': 'Week number is required',
        }),
        startDate: Joi.string().required().messages({
          'date.base': 'Start date must be a valid date',
          'any.required': 'Start date is required',
        }),
        endDate: Joi.string().required().messages({
          'date.base': 'End date must be a valid date',
          'any.required': 'End date is required',
        }),
        deliveryType: Joi.string().valid('pickup', 'delivery').required().messages({
          'string.base': 'Delivery type must be a string',
          'any.only': 'Delivery type must be either "pickup" or "delivery"',
          'any.required': 'Delivery type is required',
        }),
      })
    )
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.base': 'Deliveries must be an array',
      'array.min': 'Deliveries array must contain at least one entry',
      'array.max': 'Cannot create more than 100 deliveries at once',
      'any.required': 'Deliveries array is required',
    }),
}).custom((value, helpers) => {
  const errors: string[] = [];

  value.deliveries.forEach((delivery: any, index: number) => {
    if (delivery.startDate && delivery.endDate && delivery.startDate > delivery.endDate) {
      errors.push(`Delivery at index ${index}: Start date must be before or equal to end date`);
    }
  });

  if (errors.length > 0) {
    return helpers.error('any.invalid', {
      message: errors.join('; '),
    });
  }

  return value;
});

export const updateTradeShowDeliveryProductSchema = Joi.object({
  tradeShowId: Joi.number().integer().optional().messages({
    'number.base': 'Trade show ID must be a number',
    'number.integer': 'Trade show ID must be an integer',
  }),
  itemNumber: Joi.string().optional().messages({
    'string.base': 'Item number must be a string',
    'string.empty': 'Item number cannot be empty',
  }),
  weekNumber: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Week number must be a number',
    'number.integer': 'Week number must be an integer',
    'number.min': 'Week number must be at least 1',
  }),
  startDate: Joi.date().optional().messages({
    'date.base': 'Start date must be a valid date',
  }),
  endDate: Joi.date().optional().messages({
    'date.base': 'End date must be a valid date',
  }),
  deliveryType: Joi.string().valid('pickup', 'delivery').optional().messages({
    'string.base': 'Delivery type must be a string',
    'any.only': 'Delivery type must be either "pickup" or "delivery"',
  }),
}).custom((value, helpers) => {
  if (value.startDate && value.endDate && value.startDate > value.endDate) {
    return helpers.error('any.invalid', {
      message: 'Start date must be before or equal to end date',
    });
  }
  return value;
});

export const getTradeShowDeliveryProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  tradeShowId: Joi.number().integer().optional(),
  itemNumber: Joi.string().optional(),
  weekNumber: Joi.number().integer().optional(),
  deliveryType: Joi.string().valid('pickup', 'delivery').optional(),
});

// CustomerAssignInvoiceTemplate validation schemas
export const createCustomerAssignInvoiceTemplateSchema = Joi.object({
  customerNumber: Joi.number().integer().positive().required().messages({
    'number.base': 'Customer number must be a number',
    'number.integer': 'Customer number must be an integer',
    'number.positive': 'Customer number must be positive',
    'any.required': 'Customer number is required',
  }),
  templateId: Joi.number().integer().positive().required().messages({
    'number.base': 'Template ID must be a number',
    'number.integer': 'Template ID must be an integer',
    'number.positive': 'Template ID must be positive',
    'any.required': 'Template ID is required',
  }),
});

export const updateCustomerAssignInvoiceTemplateSchema = Joi.object({
  customerNumber: Joi.number().integer().positive().optional().messages({
    'number.base': 'Customer number must be a number',
    'number.integer': 'Customer number must be an integer',
    'number.positive': 'Customer number must be positive',
  }),
  templateId: Joi.number().integer().positive().optional().messages({
    'number.base': 'Template ID must be a number',
    'number.integer': 'Template ID must be an integer',
    'number.positive': 'Template ID must be positive',
  }),
}).min(1);

export const getCustomerAssignInvoiceTemplatesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be greater than 0',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be greater than 0',
    'number.max': 'Limit must be greater than 0 and less than or equal to 100',
  }),
  search: Joi.string().optional().messages({
    'string.base': 'Search must be a string',
  }),
  customerNumber: Joi.number().integer().positive().optional().messages({
    'number.base': 'Customer number must be a number',
    'number.integer': 'Customer number must be an integer',
    'number.positive': 'Customer number must be positive',
  }),
  templateId: Joi.number().integer().positive().optional().messages({
    'number.base': 'Template ID must be a number',
    'number.integer': 'Template ID must be an integer',
    'number.positive': 'Template ID must be positive',
  }),
});

export const bulkAddCustomerAssignInvoiceTemplatesSchema = Joi.object({
  assignments: Joi.array()
    .items(
      Joi.object({
        customerNumber: Joi.number().integer().positive().required().messages({
          'number.base': 'Customer number must be a number',
          'number.integer': 'Customer number must be an integer',
          'number.positive': 'Customer number must be positive',
          'any.required': 'Customer number is required',
        }),
        templateId: Joi.number().integer().positive().required().messages({
          'number.base': 'Template ID must be a number',
          'number.integer': 'Template ID must be an integer',
          'number.positive': 'Template ID must be positive',
          'any.required': 'Template ID is required',
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.base': 'Assignments must be an array',
      'array.min': 'At least one assignment is required',
      'any.required': 'Assignments array is required',
    }),
});

export const bulkRemoveCustomerAssignInvoiceTemplatesSchema = Joi.object({
  assignments: Joi.array()
    .items(
      Joi.object({
        customerNumber: Joi.number().integer().positive().required().messages({
          'number.base': 'Customer number must be a number',
          'number.integer': 'Customer number must be an integer',
          'number.positive': 'Customer number must be positive',
          'any.required': 'Customer number is required',
        }),
        templateId: Joi.number().integer().positive().required().messages({
          'number.base': 'Template ID must be a number',
          'number.integer': 'Template ID must be an integer',
          'number.positive': 'Template ID must be positive',
          'any.required': 'Template ID is required',
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.base': 'Assignments must be an array',
      'array.min': 'At least one assignment is required',
      'any.required': 'Assignments array is required',
    }),
});

// InvoiceTemplate validation schemas
export const createInvoiceTemplateSchema = Joi.object({
  name: Joi.string().trim().required(),
  mainTemplate: Joi.boolean().default(false),
  groupBy: Joi.string().allow("").default(""),
  showGroupHeader: Joi.boolean().default(true),
  selectedColumns: Joi.object({
    orderQty: Joi.boolean().default(true),
    shippedQty: Joi.boolean().default(true),
    itemNumber: Joi.boolean().default(true),
    description: Joi.boolean().default(true),
    pack: Joi.boolean().default(true),
    size: Joi.boolean().default(true),
    upc: Joi.boolean().default(true),
    sortNumber: Joi.boolean().default(true),
    ebt: Joi.boolean().default(true),
    retail1: Joi.boolean().default(false),
    deposit: Joi.boolean().default(false),
    price: Joi.boolean().default(true),
    unitPrice: Joi.boolean().default(false),
    tax: Joi.boolean().default(false),
    prepaidTaxAmount: Joi.boolean().default(false),
    totalPPD: Joi.boolean().default(false),
    priceWithTaxWithPPD: Joi.boolean().default(false),
    priceWithTaxWithoutPPD: Joi.boolean().default(false),
    extendedTotal: Joi.boolean().default(true),
  })
    .default()
    .unknown(false),

  columnHeaderNames: Joi.object().default({}),
  columnPlacement: Joi.string().default("default"),
  columnOrder: Joi.object().default({}),

  upcOption: Joi.string().default("barcode_primary"),

  showDistributorDetails: Joi.boolean().default(true),
  showCustomerDetails: Joi.boolean().default(true),
  showBillTo: Joi.boolean().default(true),
  showShipTo: Joi.boolean().default(true),
  showDocNumber: Joi.boolean().default(true),
  showPageOf: Joi.boolean().default(true),
  showInvoiceDate: Joi.boolean().default(true),
  showInvoiceDateWithTime: Joi.boolean().default(false),
  showRoute: Joi.boolean().default(true),
  showStop: Joi.boolean().default(true),
  showLogo: Joi.boolean().default(true),
  logoPosition: Joi.string().default("left"),
  showTerms: Joi.boolean().default(true),

  headerOnPages: Joi.string().default("firstplussummary"),
  showHeaderMessage: Joi.boolean().default(false),
  headerMessageFirstPage: Joi.string().allow("").default(""),

  footerLayout: Joi.string().default("messageleft"),
  showFooterMessage: Joi.boolean().default(false),
  footerMessageLastPage: Joi.string().allow("").default(""),
  footerSummaryLabels: Joi.object().default({}),

  showSubTotal: Joi.boolean().default(true),
  showDeliveryCharge: Joi.boolean().default(true),
  showDeposit: Joi.boolean().default(true),
  showHouseCharge: Joi.boolean().default(false),
  showPosCheck: Joi.boolean().default(false),
  showPosCash: Joi.boolean().default(false),
  showPosCredit: Joi.boolean().default(false),
  showInvoiceTotal: Joi.boolean().default(true),
  showLastBalance: Joi.boolean().default(true),
  showTotalAmountDue: Joi.boolean().default(true),

  showReportGeneratedByWoopsa: Joi.boolean().default(true),

  selectedCustomerIds: Joi.array()
    .items(Joi.number().integer().positive())
    .optional(),
}).unknown(false);




export const updateInvoiceTemplateSchema = Joi.object({
  name: Joi.string().optional().messages({
    "string.base": "Name must be a string",
  }),
  mainTemplate: Joi.boolean().optional(),

  groupBy: Joi.string().optional().allow(""),
  showGroupHeader: Joi.boolean().optional(),

  selectedColumns: Joi.object({
    orderQty: Joi.boolean().optional(),
    shippedQty: Joi.boolean().optional(),
    itemNumber: Joi.boolean().optional(),
    description: Joi.boolean().optional(),
    pack: Joi.boolean().optional(),
    size: Joi.boolean().optional(),
    upc: Joi.boolean().optional(),
    sortNumber: Joi.boolean().optional(),
    ebt: Joi.boolean().optional(),
    retail1: Joi.boolean().optional(),
    deposit: Joi.boolean().optional(),
    price: Joi.boolean().optional(),
    unitPrice: Joi.boolean().optional(),
    tax: Joi.boolean().optional(),
    prepaidTaxAmount: Joi.boolean().optional(),
    totalPPD: Joi.boolean().optional(),
    priceWithTaxWithPPD: Joi.boolean().optional(),
    priceWithTaxWithoutPPD: Joi.boolean().optional(),
    extendedTotal: Joi.boolean().optional(),
  }).optional(),

  columnHeaderNames: Joi.object().optional(),
  columnPlacement: Joi.string().optional(),
  columnOrder: Joi.object().optional(),

  upcOption: Joi.string().optional(),

  showDistributorDetails: Joi.boolean().optional(),
  showCustomerDetails: Joi.boolean().optional(),
  showBillTo: Joi.boolean().optional(),
  showShipTo: Joi.boolean().optional(),
  showDocNumber: Joi.boolean().optional(),
  showPageOf: Joi.boolean().optional(),
  showInvoiceDate: Joi.boolean().optional(),
  showInvoiceDateWithTime: Joi.boolean().optional(),
  showRoute: Joi.boolean().optional(),
  showStop: Joi.boolean().optional(),
  showLogo: Joi.boolean().optional(),
  logoPosition: Joi.string().optional(),
  showTerms: Joi.boolean().optional(),
  headerOnPages: Joi.string().optional(),
  showHeaderMessage: Joi.boolean().optional(),
  headerMessageFirstPage: Joi.string().optional().allow(""),

  footerLayout: Joi.string().optional(),
  showFooterMessage: Joi.boolean().optional(),
  footerMessageLastPage: Joi.string().optional().allow(""),
  footerSummaryLabels: Joi.object().optional(),

  showSubTotal: Joi.boolean().optional(),
  showDeliveryCharge: Joi.boolean().optional(),
  showDeposit: Joi.boolean().optional(),
  showHouseCharge: Joi.boolean().optional(),
  showPosCheck: Joi.boolean().optional(),
  showPosCash: Joi.boolean().optional(),
  showPosCredit: Joi.boolean().optional(),
  showInvoiceTotal: Joi.boolean().optional(),
  showLastBalance: Joi.boolean().optional(),
  showTotalAmountDue: Joi.boolean().optional(),

  showReportGeneratedByWoopsa: Joi.boolean().optional(),
}).min(1);

export const getInvoiceTemplatesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be greater than 0',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be greater than 0',
    'number.max': 'Limit must be greater than 0 and less than or equal to 100',
  }),
  search: Joi.string().optional().messages({
    'string.base': 'Search must be a string',
  }),
  mainTemplate: Joi.boolean().truthy('true').falsy('false').optional().messages({
    'boolean.base': 'mainTemplate must be a boolean',
  }),
});

// Bulk Upload Item Images validation schema
export const bulkUploadItemImagesSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        itemNumber: Joi.alternatives()
          .try(
            Joi.string().trim().required(),
            Joi.number().integer().positive().required()
          )
          .messages({
            'alternatives.match': 'Item number must be a string or positive integer',
            'any.required': 'Item number is required',
          }),
        img_url: Joi.string().uri().trim().required().messages({
          'string.base': 'Image URL must be a string',
          'string.empty': 'Image URL cannot be empty',
          'string.uri': 'Image URL must be a valid URL',
          'any.required': 'Image URL is required',
        }),
      })
    )
    .min(1)
    .max(1000)
    .required()
    .messages({
      'array.base': 'Items must be an array',
      'array.min': 'Items array must contain at least one item',
      'array.max': 'Cannot upload more than 1000 items at once',
      'any.required': 'Items array is required',
    }),
});

// ProductDiscount validation schemas
export const createProductDiscountSchema = Joi.object({
  ItemNumber: Joi.number().required().messages({
    'number.base': 'Item number must be a number',
    'any.required': 'Item number is required',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),
  discountType: Joi.string().valid('flat', 'percentage').required().messages({
    'string.base': 'Discount type must be a string',
    'any.only': 'Discount type must be either "flat" or "percentage"',
    'any.required': 'Discount type is required',
  }),
  discountValue: Joi.number().min(0).precision(2).required().messages({
    'number.base': 'Discount value must be a number',
    'number.min': 'Discount value must be at least 0',
    'any.required': 'Discount value is required',
  }),
  startDate: Joi.date().required().messages({
    'date.base': 'Start date must be a valid date',
    'any.required': 'Start date is required',
  }),
  endDate: Joi.date().greater(Joi.ref('startDate')).required().messages({
    'date.base': 'End date must be a valid date',
    'date.greater': 'End date must be after start date',
    'any.required': 'End date is required',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean',
  }),
});

export const updateProductDiscountSchema = Joi.object({
  ItemNumber: Joi.number().optional().messages({
    'number.base': 'Item number must be a number',
  }),
  quantity: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 1',
  }),
  discountType: Joi.string().valid('flat', 'percentage').optional().messages({
    'string.base': 'Discount type must be a string',
    'any.only': 'Discount type must be either "flat" or "percentage"',
  }),
  discountValue: Joi.number().min(0).precision(2).optional().messages({
    'number.base': 'Discount value must be a number',
    'number.min': 'Discount value must be at least 0',
  }),
  startDate: Joi.date().optional().messages({
    'date.base': 'Start date must be a valid date',
  }),
  endDate: Joi.date().optional().messages({
    'date.base': 'End date must be a valid date',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean',
  }),
}).custom((value, helpers) => {
  // If both startDate and endDate are provided, validate that endDate is after startDate
  if (value.startDate && value.endDate) {
    if (new Date(value.endDate) <= new Date(value.startDate)) {
      return helpers.error('date.greater');
    }
  }
  return value;
}).messages({
  'date.greater': 'End date must be after start date',
});

export const getProductDiscountsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
  search: Joi.string().optional().messages({
    'string.base': 'Search must be a string',
  }),
  ItemNumber: Joi.number().optional().messages({
    'number.base': 'Item number must be a number',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean',
  }),
});

// CreateCustomer validation schema
export const createCustomerSchema = Joi.object({
  C_Name: Joi.string().required().messages({
    'string.base': 'Customer name must be a string',
    'any.required': 'Customer name is required',
    'string.empty': 'Customer name cannot be empty',
  }),
}).options({ allowUnknown: true });