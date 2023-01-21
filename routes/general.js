import express from "express";
import {
  getDashboardStats,
  postUser,
  // getUserByID,
  getUserByEmail,
} from "../controllers/general.js";

const router = express.Router();

// router.get("/user/:id", getUserByID);
router.get("/user/:email", getUserByEmail);
router.get("/dashboard", getDashboardStats);
router.post("/user", postUser);
export default router;
