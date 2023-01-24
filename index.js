import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.js";
import clientRoutes from "./routes/client.js";
import generalRoutes from "./routes/general.js";
import managementRoutes from "./routes/management.js";
import salesRoutes from "./routes/sales.js";
import connectDB from "./config/db.js";
import { errorHandler } from "./config/errorHandler.js";
import cookieParser from "cookie-parser";
// data imports 1
import User from "./models/User.js";
import Product from "./models/Product.js";
import ProductStat from "./models/ProductStat.js";
import Transaction from "./models/Transaction.js";
import OverallStat from "./models/OverallStat.js";
import AffiliateStat from "./models/AffiliateStat.js";
import {
  dataUser,
  dataProduct,
  dataProductStat,
  dataTransaction,
  dataOverallStat,
  dataAffiliateStat,
} from "./data/index.js";

/* CONFIGURATION */
dotenv.config();

//connect to database
await connectDB();

// Middleware

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// 3. Logger
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// 4. Cors
const corsOptions = {
  origin: [
    "http://localhost:3000",
    // "https://dilip-next-graphql-mongodb.herokuapp.com",
  ],
  credentials: true,
};
app.use(cors(corsOptions));

/* ROUTES */
app.use("/client", clientRoutes);
app.use("/auth", authRoutes);
app.use("/general", generalRoutes);
app.use("/management", managementRoutes);
app.use("/sales", salesRoutes);

// Testing - Health Check
app.get("/healthChecker", (req, res, next) => {
  res.status(200).json({
    status: "success",
    message: "Health Check successful",
  });
});

/* ONLY ADD DATA ONE TIME */
// AffiliateStat.insertMany(dataAffiliateStat);
// OverallStat.insertMany(dataOverallStat);
// Product.insertMany(dataProduct);
// ProductStat.insertMany(dataProductStat);
// Transaction.insertMany(dataTransaction);
// User.insertMany(dataUser);

/* ONLY ADD DATA ONE TIME */
// AffiliateStat.insertMany(dataAffiliateStat);
// OverallStat.insertMany(dataOverallStat);
// Product.insertMany(dataProduct);
// ProductStat.insertMany(dataProductStat);
// Transaction.insertMany(dataTransaction);

// UnKnown Routes
app.all("*", (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.statusCode = 404;
  next(err);
});

// global error handler
app.use(errorHandler);

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 5000;

app.listen(PORT, function (err) {
  if (err) {
    console.log(`${err} did not connect`);
    throw err;
  }

  console.log(`server is listening on ${PORT}...`);
});
