import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    return next();
  };
};

// Common validation schemas
export const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().optional(),
    role: Joi.string().valid('CITIZEN', 'VOLUNTEER', 'NGO').default('CITIZEN'),
    organization: Joi.string().when('role', {
      is: Joi.string().valid('NGO', 'VOLUNTEER'),
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  createReport: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().optional(),
    urgency: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').default('MEDIUM'),
    tags: Joi.array().items(Joi.string()).default([]),
    photos: Joi.array().items(Joi.string()).default([])
  }),

  updateReport: Joi.object({
    status: Joi.string().valid('REPORTED', 'IN_PROGRESS', 'RESCUED', 'ADOPTED').optional(),
    assignedNGOId: Joi.string().optional()
  }),

  addReportUpdate: Joi.object({
    message: Joi.string().min(5).max(1000).required(),
    photos: Joi.array().items(Joi.string()).default([])
  }),

  createNGOProfile: Joi.object({
    organizationName: Joi.string().min(2).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    website: Joi.string().uri().optional(),
    address: Joi.string().min(5).max(500).required(),
    servicesOffered: Joi.array().items(Joi.string()).min(1).required(),
    operatingHours: Joi.string().optional(),
    capacity: Joi.string().optional()
  })
};