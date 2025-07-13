import { register, login, verifyEmail } from "../src/controllers/auth";
import { db } from "../src/db/index";
import { usersTable } from "../src/db/schema";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../src/auth/jwt";
import { otpMail } from "../src/utils/email";
import { otpGen } from "../src/utils/otp";

jest.mock("bcryptjs");
jest.mock("../src/auth/jwt");
jest.mock("../src/utils/email");
jest.mock("../src/utils/otp");
jest.mock("../src/db/index", () => ({
  db: {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue(undefined),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    then: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  },
}));

describe("register", () => {
  it("should hash password, insert user, send otp email", async () => {
    const mockReq = {
      body: {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        bank_acc: "123456",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
    (otpGen as jest.Mock).mockReturnValue("123456");

    await register(mockReq as any, mockRes as any);

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
    expect(db.insert).toHaveBeenCalledWith(usersTable);
    expect(otpMail).toHaveBeenCalledWith("test@example.com", "123456");
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Otp sent to mail Id. Verify mail to complete registration",
    });
  });
});

describe("login", () => {
  it("should login a user and return credentials with access and refresh token", async () => {
    const mockReq = {
      body: {
        username: "testuser",
        password: "password123",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

      const mockUser = {
      id: 1,
      username: "testuser",
      password: "hashed_password",
    };

    const mockDb = db as unknown as {
      select: jest.Mock;
      from: jest.Mock;
      where: jest.Mock;
      then: jest.Mock;
      insert: jest.Mock;
      values: jest.Mock;
      update: jest.Mock;
      set: jest.Mock;
    };

    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);
    mockDb.then.mockImplementation((cb) => cb([mockUser]));

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (generateAccessToken as jest.Mock).mockReturnValue("access_token");
    (generateRefreshToken as jest.Mock).mockReturnValue("refresh_token");

    await login(mockReq as any, mockRes as any);

    expect(mockDb.select).toHaveBeenCalled();    
    expect(mockRes.json).toHaveBeenCalledWith({
      user: mockUser,
      accessToken: "access_token",
      refreshToken: "refresh_token",
    });
  });
});
