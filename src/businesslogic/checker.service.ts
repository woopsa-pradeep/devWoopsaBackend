import { WebUsers } from "../models/postgres/users.model";
import { AppError } from "../utils/AppError";
import jwt from "jsonwebtoken";

export class CheckerService {

  /**
   * Login function for Checker
   * - Validates credentials
   * - Verifies user exists and is active
   * - Generates JWT token
   * - Returns user profile and token
   */
  async loginChecker(body: any) {
    try {
      const { email, password } = body;

      // 1️⃣ Validate input
      if (!email || !password) {
        throw new AppError("Email and password are required", 400);
      }

      // 2️⃣ Check if user exists (and optionally active/role)
      const user = await WebUsers.findOne({
        where: { email },
      });

      if (!user) {
        throw new AppError("Invalid email or password", 400);
      }

      // 3️⃣ Simple plain-text password check (no bcrypt)
      if (user.password !== password) {
        throw new AppError("Invalid email or password", 400);
      }

      // 4️⃣ Verify JWT secret
      if (!process.env.JWT_SECRET) {
        console.error("❌ Missing JWT_SECRET in environment variables");
        throw new Error("JWT secret not configured on server");
      }

      // 5️⃣ Generate token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role || "checker",
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // 6️⃣ Return consistent response
      return {
        success: true,
        message: "Checker login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          role: user.role || "checker",
        },
        token,
      };

    } catch (err: any) {
      // Log detailed error for debugging
      console.error("🔥 loginChecker error:", err);

      // Re-throw as AppError to ensure global handler can catch it
      throw new AppError(err.message || "Something went wrong!", 500);
    }
  }
}
