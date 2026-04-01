import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .regex(/^0\d{9}$/, "Thai phone format: 0XXXXXXXXX"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const createBookingSchema = z.object({
  slotId: z.number().int().positive(),
  note: z.string().max(500).optional(),
});

export const cancelBookingSchema = z.object({
  bookingId: z.number().int().positive(),
});

export const updateBookingStatusSchema = z.object({
  bookingId: z.number().int().positive(),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ]),
});

export const getAvailableSlotsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

export const blockSlotSchema = z.object({
  slotId: z.number().int().positive(),
  reason: z.string().max(200).optional(),
});

export const getAllBookingsSchema = z.object({
  status: z
    .enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
});
