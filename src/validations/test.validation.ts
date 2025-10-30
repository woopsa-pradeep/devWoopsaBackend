import Joi from 'joi';

export const createUserSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.empty': 'Username is required',
            'string.min': 'Username must be at least 3 characters long',
            'string.max': 'Username cannot exceed 30 characters',
            'string.alphanum': 'Username can only contain alphanumeric characters'
        }),

    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address'
        }),

    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
        .required()
        .messages({
            'string.empty': 'Password is required',
            'string.pattern.base': 'Password must be between 3 and 30 characters and can only contain letters and numbers'
        })
});

export const updateUserSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .messages({
            'string.min': 'Username must be at least 3 characters long',
            'string.max': 'Username cannot exceed 30 characters',
            'string.alphanum': 'Username can only contain alphanumeric characters'
        }),

    email: Joi.string()
        .email()
        .messages({
            'string.email': 'Please provide a valid email address'
        }),

    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
        .messages({
            'string.pattern.base': 'Password must be between 3 and 30 characters and can only contain letters and numbers'
        })
}); 

export const uploadProductImageSchema = Joi.object({
    product_number: Joi.number().required(),
    isAllow: Joi.boolean().optional(),
});