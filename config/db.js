import mongoose from "mongoose";
import dotenv from "dotenv";
import Role from "../models/Role.js";

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.set("strictQuery", false);

const initial = () => {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      // console.log('Dilip Count: ', count);
      new Role({
        name: "user",
      }).save((err) => {
        if (err) {
          // console.log('error', err);
        }

        console.log("added 'user' to roles collection");
      });

      new Role({
        name: "moderator",
      }).save((err) => {
        if (err) {
          // console.log('error', err);
        }

        console.log("added 'moderator' to roles collection");
      });

      new Role({
        name: "admin",
      }).save((err) => {
        if (err) {
          // console.log('error', err);
        }

        console.log("added 'admin' to roles collection");
      });
    }
  });
};
const connectDB = async () => {
  try {
    await mongoose
      .connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: "DashboardDB",
      })
      .then((data) => {
        console.log(
          `MongoDB Connected: ${data.connection.host} ${data.connection.port}`
        );
        initial();
      })
      .catch((error) => {
        console.log(error.code);
        handleError(error);
      });
  } catch (error) {
    console.log(error);
    handleError(error);
  }
};

mongoose.connection.on("error", (err) => {
  logError(err);
});

export default connectDB;
