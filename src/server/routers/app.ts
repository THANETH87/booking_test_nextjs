import { router } from "../trpc";
import { authRouter } from "./auth";
import { bookingRouter } from "./booking";
import { slotRouter } from "./slot";
import { adminRouter } from "./admin";
import { waitlistRouter } from "./waitlist";
import { guestRouter } from "./guest";

export const appRouter = router({
  auth: authRouter,
  booking: bookingRouter,
  slot: slotRouter,
  admin: adminRouter,
  waitlist: waitlistRouter,
  guest: guestRouter,
});

export type AppRouter = typeof appRouter;
