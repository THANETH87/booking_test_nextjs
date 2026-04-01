import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { signToken, setAuthCookie, removeAuthCookie } from "@/lib/jwt";
import { registerSchema, loginSchema } from "@/lib/validators";

export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existing && !existing.deletedAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 12);

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
        },
      });

      const token = await signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      await setAuthCookie(token);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user || user.deletedAt) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const token = await signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      await setAuthCookie(token);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    }),

  logout: publicProcedure.mutation(async () => {
    await removeAuthCookie();
    return { success: true };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return user;
  }),
});
