import express from "express";
import {
  getDashboardStats,
  getUsers,
  getUserByID,
  // getUserByEmail,
  signIn,
  postUser,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  validateResetToken,
  refreshToken,
  revokeToken,
  getCustomers,
  getCustomerById,
  postCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/general.js";

const router = express.Router();

// CRUD - USER Operations
router.get("/user", getCustomers);
router.get("/user/:id", getCustomerById);
// router.get("/user/:email", getUserByEmail);
router.post("/user/signin", signIn);
router.post("/user", postCustomer);
router.put("/user/:id", updateCustomer);
router.delete("/user/:id", deleteCustomer);

// ADMIN Processes - USER Operations
router.post("/user/forgot-password", forgotPassword);
router.post("/user/reset-password", resetPassword);
router.post("/user/verify-email", verifyEmail);
router.post("/user/validate-reset-token", validateResetToken);
router.post("/user/refresh-token", refreshToken);
router.post("/user/revoke-token", revokeToken);

router.get("/dashboard", getDashboardStats);

export default router;
