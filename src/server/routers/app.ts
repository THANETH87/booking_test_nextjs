import { router } from "../trpc";
import { authRouter } from "./auth";
import { bookingRouter } from "./booking";
import { slotRouter } from "./slot";
import { adminRouter } from "./admin";

export const appRouter = router({
  auth: authRouter,
  booking: bookingRouter,
  slot: slotRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
