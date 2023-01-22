import Product from "../models/Product.js";
import ProductStat from "../models/ProductStat.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import getCountryIso3 from "country-iso-2-to-3";
import {
  getProductByIDSrv,
  addProductSrv,
  updateProductSrv,
  deleteProductSrv,
} from "../services/product.service.js";

import {
  getTransactionByIDSrv,
  addTransactionSrv,
  updateTransactionSrv,
  deleteTransactionSrv,
} from "../services/transaction.service.js";

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();

    const productsWithStats = await Promise.all(
      products.map(async (product) => {
        const stat = await ProductStat.find({
          productId: product._id,
        });
        return {
          ...product._doc,
          stat,
        };
      })
    );

    res.status(200).json(productsWithStats);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    // sort should look like this: { "field": "userId", "sort": "desc"}
    const { page = 1, pageSize = 20, sort = null, search = "" } = req.query;

    // formatted sort should look like { userId: -1 }
    const generateSort = () => {
      const sortParsed = JSON.parse(sort);
      const sortFormatted = {
        [sortParsed.field]: (sortParsed.sort = "asc" ? 1 : -1),
      };

      return sortFormatted;
    };
    const sortFormatted = Boolean(sort) ? generateSort() : {};

    const transactions = await Transaction.find({
      $or: [
        { cost: { $regex: new RegExp(search, "i") } },
        { userId: { $regex: new RegExp(search, "i") } },
      ],
    })
      .sort(sortFormatted)
      .skip(page * pageSize)
      .limit(pageSize);

    if (search) {
      const total = await Transaction.countDocuments({
        name: { $regex: search, $options: "i" },
      });
      res.status(200).json({
        transactions,
        total,
      });
    } else {
      const total = await Transaction.countDocuments({});

      res.status(200).json({
        transactions,
        total,
      });
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getGeography = async (req, res) => {
  try {
    const users = await User.find();

    const mappedLocations = users.reduce((acc, { country }) => {
      const countryISO3 = getCountryIso3(country);
      if (!acc[countryISO3]) {
        acc[countryISO3] = 0;
      }
      acc[countryISO3]++;
      return acc;
    }, {});

    const formattedLocations = Object.entries(mappedLocations).map(
      ([country, count]) => {
        return { id: country, value: count };
      }
    );

    res.status(200).json(formattedLocations);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getProductById = (req, res, next) => {
  getProductByIDSrv(req.params.id)
    .then((product) =>
      product
        ? res.status(201).json(product)
        : res.status(404).json({ message: "Product not found" })
    )
    .catch((err) =>
      res.status(500).json({
        message: err.message,
      })
    );
};

export const postProduct = (req, res, next) => {
  addProductSrv(req.body)
    .then(() =>
      res.status(201).json({
        message: "Product added successfully",
      })
    )
    .catch((err) =>
      res.status(500).json({
        message: err.message,
      })
    );
};

export const updateProduct = (req, res, next) => {
  updateProductSrv(req.params.id, req.body)
    .then((product) =>
      product
        ? res
            .status(201)
            .json({ product, message: "Product updated successfully" })
        : res.status(404).json({ message: "Product not found" })
    )
    .catch((err) =>
      res.status(500).json({
        message: err.message,
      })
    );
};

export const deleteProduct = async (req, res, next) => {
  deleteProductSrv(req.params.id)
    .then(() =>
      res.status(201).json({ message: "Product deleted successfully" })
    )
    .catch((err) =>
      res.status(500).json({
        message: err.message,
      })
    );
};

export const getTransactionById = (req, res, next) => {
  getTransactionByIDSrv(req.params.id)
    .then((transaction) =>
      transaction
        ? res.status(201).json(transaction)
        : res.status(404).json({ message: "Transaction not found" })
    )
    .catch((err) =>
      res.status(500).json({
        message: err.message,
      })
    );
};

export const postTransaction = (req, res, next) => {
  addTransactionSrv(req.body)
    .then(() =>
      res.status(201).json({
        message: "Transaction added successfully",
      })
    )
    .catch((err) =>
      res.status(500).json({
        message: err.message,
      })
    );
};

export const updateTransaction = (req, res, next) => {
  updateTransactionSrv(req.params.id, req.body)
    .then((transaction) =>
      transaction
        ? res
            .status(201)
            .json({ transaction, message: "Transaction updated successfully" })
        : res.status(404).json({ message: "Transaction not found" })
    )
    .catch((err) =>
      res.status(500).json({
        message: err.message,
      })
    );
};

export const deleteTransaction = async (req, res, next) => {
  deleteTransactionSrv(req.params.id)
    .then(() =>
      res.status(201).json({ message: "Transaction deleted successfully" })
    )
    .catch((err) =>
      res.status(500).json({
        message: err.message,
      })
    );
};
