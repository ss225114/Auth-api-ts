import { boolean, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 25 }).notNull().unique(),
  email: varchar({ length: 128 }).notNull().unique(),
  password: varchar({ length: 100 }).notNull(),
  bank_acc: varchar({ length: 255 }).notNull(),
  otp: varchar({ length: 6 }), // or however your OTP is formatted
  otpGeneratedTime: timestamp(),
  isActive: boolean().default(false),
});
