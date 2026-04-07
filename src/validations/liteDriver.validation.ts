import Joi from 'joi';

export const getCustomerForLatLongQuerySchema = Joi.object({
  search: Joi.string().trim().allow('', null).optional(),
});

export const getCustomerByCNumberParamSchema = Joi.object({
  C_Number: Joi.number().integer().positive().required().messages({
    'number.base': 'C_Number must be a number',
    'any.required': 'C_Number is required',
  }),
});

export const setCustomerLatLongSchema = Joi.object({
  C_Number: Joi.number().integer().positive().required().messages({
    'number.base': 'C_Number must be a number',
    'any.required': 'C_Number is required',
  }),
  lat: Joi.number().required().messages({
    'number.base': 'lat must be a number',
    'any.required': 'lat is required',
  }),
  long: Joi.number().required().messages({
    'number.base': 'long must be a number',
    'any.required': 'long is required',
  }),
  City: Joi.string().allow('', null).optional(),
  Country: Joi.string().allow('', null).optional(),
  Address: Joi.string().allow('', null).optional(),
  State: Joi.string().allow('', null).optional(),
  Zip: Joi.string().allow('', null).optional(),
  driverId: Joi.number().integer().positive().required().messages({
    'number.base': 'driverId must be a number',
    'any.required': 'driverId is required',
  }),
});
