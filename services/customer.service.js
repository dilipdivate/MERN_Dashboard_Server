import { response } from "express";
import User from "../models/User.js";

export const getCustomersSrv = async () => {
  const customers = await User.find({ role: "user" }).select("-password");
  console.log(customers);
  return customers;
};

export const getCustomer = async (id) => {
  const customer = await User.findById(id);
  if (!customer) throw "User not found";
  return customer;
};

export const getCustomerByIDSrv = async (id) => {
  const customer = await getCustomer(id);
  return customerDetails(customer);
};

export const addCustomerSrv = async (req) => {
  if (await User.findOne({ name: req.name })) {
    throw new Error(`User ${req.name} already exist!`);
  }

  console.log("Aftr", req);
  // create customer object
  const customer = new User(req);

  // save customer
  await customer.save();

  return customerDetails(customer);
};

export const updateCustomerSrv = async (id, req) => {
  const customer = await getCustomer(id);

  // copy params to account and save
  Object.assign(customer, req);
  customer.updated = Date.now();
  await customer.save();

  return customerDetails(customer);
};

export const deleteCustomerSrv = async (id) => {
  const customer = await getCustomer(id);

  await customer.remove();
};

function customerDetails(customer) {
  const {
    _id,
    name,
    email,
    city,
    state,
    country,
    occupation,
    phoneNumber,
    transactions,
    role,
    roles,
  } = customer;

  return {
    _id,
    name,
    email,
    city,
    state,
    country,
    occupation,
    phoneNumber,
    transactions,
    role,
    roles,
  };
}
