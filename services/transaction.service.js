import Transaction from "../models/Transaction.js";

export const getTransaction = async (id) => {
  const transaction = await Transaction.findById(id);
  if (!transaction) throw "Transaction not found";
  return transaction;
};

export const getTransactionByIDSrv = async (id) => {
  const transaction = await getTransaction(id);
  return transactionDetails(transaction);
};

export const addTransactionSrv = async (req) => {
  if (await Transaction.findOne({ userId: req.userId, cost: req.cost })) {
    throw `Transaction ${req.userId} with ${req.cost} already exist!`;
  }

  // create transaction object
  const transaction = new Transaction(req);

  // save transaction
  await transaction.save();

  return transactionDetails(transaction);
};

export const updateTransactionSrv = async (id, req) => {
  const transaction = await getTransaction(id);

  // copy params to account and save
  Object.assign(transaction, req);
  transaction.updated = Date.now();
  await transaction.save();

  return transactionDetails(transaction);
};

export const deleteTransactionSrv = async (id) => {
  console.log(id);
  const transaction = await getTransaction(id);

  await transaction.remove();
};

function transactionDetails(transaction) {
  const { _id, userId, cost, products } = transaction;

  return {
    _id,
    userId,
    cost,
    products,
  };
}
