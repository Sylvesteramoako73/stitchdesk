import { z } from 'zod'

const phone = z.string().min(7).max(20).regex(/^[\d\s\+\-\(\)]+$/, 'Invalid phone number')
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')

export const ClientSchema = z.object({
  name:        z.string().min(1).max(100).trim(),
  phone:       phone,
  email:       z.string().email().max(200).optional().or(z.literal('')),
  notes:       z.string().max(1000).optional(),
  tags:        z.string().max(200).optional(),
  dateOfBirth: isoDate.optional().or(z.literal('')),
  gender:      z.enum(['female', 'male']).optional().or(z.literal('')),
  address:     z.string().max(300).optional(),
})


export const StaffSchema = z.object({
  name:           z.string().min(1).max(100).trim(),
  role:           z.string().min(1).max(100).trim(),
  phone:          phone.optional().or(z.literal('')),
  email:          z.string().email().optional().or(z.literal('')),
  specialties:    z.string().max(300).optional(),
  commissionRate: z.number().min(0).max(100),
  systemRole:     z.enum(['owner', 'manager', 'staff']).optional(),
  locationId:     z.string().max(128).nullable().optional(),
})


export const ExpenseSchema = z.object({
  category:    z.enum(['rent','fabric','supplies','utilities','wages','equipment','marketing','maintenance','other']),
  description: z.string().min(1).max(300).trim(),
  amount:      z.number().min(0).max(10_000_000),
  date:        isoDate,
  locationId:  z.string().max(128).nullable().optional(),
})

export const LocationSchema = z.object({
  name:    z.string().min(1).max(100).trim(),
  address: z.string().min(1).max(300).trim(),
  phone:   phone,
})

export const ApprenticeSchema = z.object({
  name:                   z.string().min(1).max(100).trim(),
  phone:                  phone.optional().or(z.literal('')),
  email:                  z.string().email().optional().or(z.literal('')),
  mentorId:               z.string().max(128).nullable().optional(),
  locationId:             z.string().max(128).nullable().optional(),
  stage:                  z.enum(['beginner', 'intermediate', 'advanced']),
  startDate:              isoDate,
  expectedGraduationDate: isoDate.nullable().optional().or(z.literal('')),
  programDurationMonths:  z.number().int().min(1).max(120).nullable().optional(),
  specialtiesLearning:    z.string().max(500).optional(),
  stipend:                z.number().min(0).max(1_000_000).nullable().optional(),
  notes:                  z.string().max(1000).optional(),
})

