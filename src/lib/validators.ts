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

// User CRUD
export const updateUserSchema = z.object({
  userId: z.number().int().positive(),
  email: z.email("Invalid email format").optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z
    .string()
    .regex(/^0\d{9}$/, "Thai phone format: 0XXXXXXXXX")
    .optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export const deleteUserSchema = z.object({
  userId: z.number().int().positive(),
});

export const getAllUsersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
});

// Booking CRUD
export const updateBookingSchema = z.object({
  bookingId: z.number().int().positive(),
  slotId: z.number().int().positive().optional(),
  note: z.string().max(500).optional(),
});

export const deleteBookingSchema = z.object({
  bookingId: z.number().int().positive(),
});

// TimeSlot CRUD
export const createSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
});

export const updateSlotSchema = z.object({
  slotId: z.number().int().positive(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  isBlocked: z.boolean().optional(),
  blockedReason: z.string().max(200).optional(),
});

export const deleteSlotSchema = z.object({
  slotId: z.number().int().positive(),
});

// Waitlist
export const joinWaitlistSchema = z.object({
  slotId: z.number().int().positive(),
});

export const leaveWaitlistSchema = z.object({
  slotId: z.number().int().positive(),
});

export const getWaitlistBySlotSchema = z.object({
  slotId: z.number().int().positive(),
});

// Reschedule
export const rescheduleBookingSchema = z.object({
  bookingId: z.number().int().positive(),
  newSlotId: z.number().int().positive(),
});

// Guest Booking
export const createGuestBookingSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email format"),
  phone: z.string().regex(/^0\d{9}$/, "Thai phone format: 0XXXXXXXXX"),
  slotId: z.number().int().positive(),
  note: z.string().max(500).optional(),
});

export const cancelGuestBookingSchema = z.object({
  cancelToken: z.string().min(1),
});

// Manual Booking
export const createManualBookingSchema = z.object({
  userId: z.number().int().positive().optional(),
  guestFirstName: z.string().min(1).optional(),
  guestLastName: z.string().min(1).optional(),
  guestEmail: z.email().optional(),
  guestPhone: z.string().regex(/^0\d{9}$/).optional(),
  slotId: z.number().int().positive(),
  note: z.string().max(500).optional(),
});

// Holidays
export const addHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  reason: z.string().max(200).optional(),
});

export const removeHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

export const getHolidaysSchema = z.object({
  year: z.number().int().min(2024).max(2030),
});

// Analytics
export const getAnalyticsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
