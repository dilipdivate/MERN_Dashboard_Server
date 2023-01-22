import express from "express";
import {
  getProducts,
  getProductById,
  postProduct,
  updateProduct,
  deleteProduct,
  // getCustomers,
  // getCustomerById,
  // postCustomer,
  // updateCustomer,
  // deleteCustomer,
  getTransactions,
  getTransactionById,
  postTransaction,
  updateTransaction,
  deleteTransaction,
  getGeography,
} from "../controllers/client.js";

const router = express.Router();

// CRUD - Products
router.get("/products", getProducts);

router.get("/products/:id", getProductById);
router.post("/products", postProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// // CRUD - Customers
// router.get("/customers", getCustomers);
// router.get("/customers/:id", getCustomerById);
// router.post("/customers", postCustomer);
// router.put("/customers/:id", updateCustomer);
// router.delete("/customers/:id", deleteCustomer);

// CRUD - Transactions
router.get("/transactions", getTransactions);
router.get("/transactions/:id", getTransactionById);
router.post("/transactions", postTransaction);
router.put("/transactions/:id", updateTransaction);
router.delete("/transactions/:id", deleteTransaction);

router.get("/geography", getGeography);

export default router;
