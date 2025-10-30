import Joi from 'joi';

export const orderPickCreateSchema = Joi.object({
  orderNumber: Joi.number().integer().required(),
  customerNumber: Joi.number().integer().required(),
  status: Joi.string()
    .valid('pending', 'in_progress', 'completed')
    .default('in_progress'),

  notes: Joi.string().optional().allow(null, ''),

  totalLines: Joi.number().integer().min(0).default(0),
  totalQty: Joi.number().precision(4).min(0).default(0),

  scannedLines: Joi.number().integer().min(0).default(0),
  scannedQty: Joi.number().precision(4).min(0).default(0),
});


export const orderPickBoxSchema = Joi.object({
    orderNumber: Joi.number().integer().required(),
  
    type: Joi.string()
      .valid('box', 'tote', 'drinks')
      .required(),

  
  });