import express from "express";
import {
  signInHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  changePasswordHandler,
  verifyEmailHandler,
  validateResetTokenHandler,
  refreshTokenHandler,
  revokeTokenHandler,
  registerHandler,
  signOutHandler,
  deserializeUser,
} from "../controllers/auth.js";
import {
  createUserSchema,
  loginUserSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../schema/user.schema.js";
import { validate } from "../config/validate.js";

const router = express.Router();

router.post("/register", validate(createUserSchema), registerHandler);

router.post("/signin", validate(loginUserSchema), signInHandler);
router.post("/signout", deserializeUser, signOutHandler);

// ADMIN Processes - USER Operations
router.post("/forgot-password", forgotPasswordHandler);
router.patch(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  resetPasswordHandler
);
router.patch(
  "/change-password",
  validate(changePasswordSchema),
  changePasswordHandler
);

router.post("/verify-email", verifyEmailHandler);
router.post("/validate-reset-token", validateResetTokenHandler);
router.post("/refresh-token", refreshTokenHandler);
router.post("/revoke-token", revokeTokenHandler);

export default router;
