import User from "../models/User.js";
import Role from "../models/Role.js";
import OverallStat from "../models/OverallStat.js";
import Transaction from "../models/Transaction.js";
import jwt from "jsonwebtoken";

import {
  getCustomersSrv,
  getCustomerByIDSrv,
  addCustomerSrv,
  updateCustomerSrv,
  deleteCustomerSrv,
} from "../services/customer.service.js";

export const getUserFromToken = async (req, res, next) => {
  const defaultReturnObject = { authenticated: false, user: null };

  try {
    const token = String(req?.cookies?.token);
    const decoded = jwt.verify(token, process.env.secret);
    console.log("REQ2:", decoded);
    const getUserResponse = await User.findOne({ email: decoded.email });
    console.log(getUserResponse);
    const user = getUserResponse;
    if (!user) {
      res.status(400).json(defaultReturnObject);
      return;
    }
    delete user.password;
    res.status(200).json({
      // authenticated: true,
      status: "success",
      user,
    });
  } catch (err) {
    console.log("POST auth/me, Something Went Wrong", err);
    res.status(400).json(defaultReturnObject);
  }
};

export const getCustomers = async (req, res) => {
  getCustomersSrv()
    .then((customers) => {
      console.log(customers);
      customers
        ? res.status(200).json(customers)
        : res.status(404).json({ message: "No Users found" });
    })
    .catch((err) =>
      res.status(500).json({
        message: err.message,
      })
    );
};

export const getCustomerById = (req, res, next) => {
  getCustomerByIDSrv(req.params.id)
    .then((customer) =>
      customer
        ? res.status(201).json(customer)
        : res.status(404).json({ message: "Customer not found" })
    )
    .catch((err) =>
      res.status(500).json({
        message: err.message,
      })
    );
};

export const postCustomer = (req, res, next) => {
  addCustomerSrv(req.body)
    .then((customer) =>
      res.status(201).json({
        customer,
        message: "Customer added successfully",
      })
    )

    .catch((err) =>
      res.status(500).json({
        message: err.message,
      })
    );
};

export const updateCustomer = (req, res, next) => {
  updateCustomerSrv(req.params.id, req.body)
    .then((customer) =>
      customer
        ? res
            .status(201)
            .json({ customer, message: "Customer updated successfully" })
        : res.status(404).json({ message: "Customer not found" })
    )
    .catch((err) =>
      res.status(500).json({
        message: err.message,
      })
    );
};

export const deleteCustomer = async (req, res, next) => {
  deleteCustomerSrv(req.params.id)
    .then(() =>
      res.status(201).json({ message: "Customer deleted successfully" })
    )
    .catch((err) =>
      res.status(500).json({
        message: err.message,
      })
    );
};

export const getDashboardStats = async (req, res) => {
  try {
    // hardcoded values
    const currentMonth = "November";
    const currentYear = 2021;
    const currentDay = "2021-11-15";

    /* Recent Transactions */
    const transactions = await Transaction.find()
      .limit(50)
      .sort({ createdOn: -1 });

    /* Overall Stats */
    const overallStat = await OverallStat.find({ year: currentYear });

    const {
      totalCustomers,
      yearlyTotalSoldUnits,
      yearlySalesTotal,
      monthlyData,
      salesByCategory,
    } = overallStat[0];

    const thisMonthStats = overallStat[0].monthlyData.find(({ month }) => {
      return month === currentMonth;
    });

    const todayStats = overallStat[0].dailyData.find(({ date }) => {
      return date === currentDay;
    });

    res.status(200).json({
      totalCustomers,
      yearlyTotalSoldUnits,
      yearlySalesTotal,
      monthlyData,
      salesByCategory,
      thisMonthStats,
      todayStats,
      transactions,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
