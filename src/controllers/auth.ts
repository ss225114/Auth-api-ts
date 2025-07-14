import bcrypt from "bcryptjs";
import { db } from "../db/index";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { generateAccessToken, generateRefreshToken } from "../auth/jwt";
import { Request, Response } from "express";
import { otpMail } from "../utils/email";
import { otpGen } from "../utils/otp";

export const register = async (req: Request, res: Response) => {
  const { username, email, password, bank_acc } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const otp = otpGen();
  const time = new Date();
  await db
    .insert(usersTable)
    .values({
      username,
      email,
      password: hash,
      bank_acc,
      isActive: false,
      otp,
      otpGeneratedTime: time,
    });

  await otpMail(email, otp);
  res.status(201).json({
    message: "Otp sent to mail Id. Verify mail to complete registration",
  });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .then((u) => u[0]);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  res.status(200).json({ user, accessToken, refreshToken });
  return;
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { email, otpInp } = req.body;
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .then((u) => u[0]);
  if (
    otpInp === user.otp &&
    user.otpGeneratedTime && (Date.now() - user.otpGeneratedTime.getTime()) / (1000 * 60) < 2) {
    await db
      .update(usersTable)
      .set({ isActive: true, otp: null, otpGeneratedTime: null })
      .where(eq(usersTable.id, user.id));
    res.status(200).json({ message: "User registration Successful" });
    return;
  } else {
    // console.log((Date.now() - user.otpGeneratedTime?user.otpGeneratedTime.getTime():0) / 1000 < 60);
    res.status(500).json({ message: "Invalid otp" });
    return;
  }
};
