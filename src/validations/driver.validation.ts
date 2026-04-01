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
