import Product from "../models/Product.js";

export const getProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw "Product not found";
  return product;
};

export const getProductByIDSrv = async (id) => {
  const product = await getProduct(id);
  return productDetails(product);
};

export const addProductSrv = async (req) => {
  if (await Product.findOne({ name: req.name })) {
    throw `Product ${req.name} already exist!`;
  }

  // create product object
  const product = new Product(req);

  // save product
  await product.save();

  return productDetails(product);
};

export const updateProductSrv = async (id, req) => {
  const product = await getProduct(id);

  // copy params to account and save
  Object.assign(product, req);
  product.updated = Date.now();
  await product.save();

  return productDetails(product);
};

export const deleteProductSrv = async (id) => {
  console.log(id);
  const product = await getProduct(id);

  await product.remove();
};

function productDetails(product) {
  const { _id, name, price, description, category, rating, supply } = product;

  return {
    _id,
    name,
    price,
    description,
    category,
    rating,
    supply,
  };
}
