import Joi from "joi";


export const signupSchema = Joi.object({
  customerNumber: Joi.number().required().messages({
    "number.base": "Customer Number must be a number",
    "any.required": "Customer Number is required"
  })
});

export const verifySignupOtpSchema = Joi.object({
  customerNumber: Joi.number().required().messages({
    "number.base": "Customer Number must be a number",
    "any.required": "Customer Number is required"
  }),
  otp: Joi.string().length(4).required().messages({
    "string.empty": "OTP is required",
    "string.length": "OTP must be 4 digits"
  })
});
export const loginSalesSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "any.required": "Email is required",
    "string.email": "Email must be a valid email address"
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required"
  }),
  deviceToken: Joi.string().optional().allow('', null).messages({
    "string.empty": "Device Token is optional",
    "any.required": "Device Token is optional",
  })
});



export const loginSchema = Joi.object({
  email_phone: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "any.required": "Email is required",
    "string.email": "Email must be a valid email address"
  }),
  deviceToken: Joi.string().optional().allow('', null).messages({
    "string.empty": "Device Token is optional",
    "any.required": "Device Token is optional",
  })

})
export const loginPasswrodSchema = Joi.object({
  email_phone: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "any.required": "Email is required",
    "string.email": "Email must be a valid email address"
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  })
})


export const verifyOtpSchema = Joi.object({
  email_phone: Joi.string().required().messages({
    "string.empty": "Either email or phoneNumber is required",
    "any.required": "Either email or phoneNumber is required",
  }),
  otp: Joi.string().required().messages({
    "string.empty": "password is required",
    "any.required": "password is required",
  }),
});

export const checkUserWareHouseSchema = Joi.object({
  wareHouseId: Joi.string().required().messages({
    "string.empty": "warehouse id is required",
    "any.required": "warehouse id is required",
  }),
});


export const forgotPasswordSchema = Joi.object({
  email: Joi.string().required().messages({
    "string.empty": " email is required",
    "any.required": " email is required",
  })
})

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    "string.empty": "Token is required",
    "any.required": "Token is required",
  }),
  newPassword: Joi.string().required().messages({
    "string.empty": "New password is required",
    "any.required": "New password is required",
  }),
})

export const changePasswordSchema = Joi.object({
  old_password: Joi.string().required().messages({
    "string.empty": "Current password is required",
    "any.required": "Current password is required",
  }),

  new_password: Joi.string().required().messages({
    "string.empty": "New password is required",
    "any.required": "New password is required",
  }),

  confirm_password: Joi.string()
    .required()
    .valid(Joi.ref("new_password"))
    .messages({
      "any.only": "Confirm password must match new password",
      "string.empty": "Confirm password is required",
      "any.required": "Confirm password is required",
    }),
});

// validations/signup.validation.ts

export const signUpValidation = Joi.object({
  account_number: Joi.number()
    .required()
    .messages({
      'number.base': 'Account number must be a number',
      'number.empty': 'Account number cannot be empty',
      'any.required': 'Account number is required',
    }),
});

export const startDeliveryRouteSchema = Joi.object({
  routeId: Joi.number().integer().required().messages({
    "number.base": "Route ID must be a number",
    "number.integer": "Route ID must be an integer",
    "any.required": "Route ID is required",
  }),
  stopId: Joi.number().integer().required().messages({
    "number.base": "Stop ID must be a number",
    "number.integer": "Stop ID must be an integer",
    "any.required": "Stop ID is required",
  }),
});

export const updateDriverLatLongSchema = Joi.object({
  currentLocation: Joi.string().trim().required().messages({
    "string.base": "Current location must be a string",
    "string.empty": "Current location is required",
    "any.required": "Current location is required",
  }),

  currentLatitude: Joi.number().required().messages({
    "number.base": "Current latitude must be a number",
    "any.required": "Current latitude is required",
  }),
  currentLongitude: Joi.number().required().messages({
    "number.base": "Current longitude must be a number",
    "any.required": "Current longitude is required",
  }),
});
