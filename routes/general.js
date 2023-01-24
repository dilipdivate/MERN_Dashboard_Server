import express from "express";
import {
  getDashboardStats,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getUserFromToken,
} from "../controllers/general.js";

const router = express.Router();

// console.log("Router", router);
// CRUD - USER Operations
router.get("/user", getCustomers);
router.get("/user/me", getUserFromToken);
// router.get("/user/:email", getUserByEmail);
router.get("/user/:id", getCustomerById);
router.put("/user/:id", updateCustomer);
router.delete("/user/:id", deleteCustomer);

router.get("/dashboard", getDashboardStats);

export default router;
