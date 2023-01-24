import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minlength: [3, "Minimum name length is 6 characters!"],
    },
    lastName: {
      type: String,
      // required: true,
      minlength: [3, "Minimum name length is 6 characters!"],
    },
    email: {
      type: String,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/],
      required: [true, "Email is required?"],
      max: 50,
      unique: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      min: 5,
    },
    city: String,
    state: String,
    country: String,
    occupation: String,
    phoneNumber: {
      type: String,
      // validate: {
      //   validator: function (v) {
      //     return /\d{3}-\d{3}-\d{4}/.test(v);
      //   },
      //   message: (props) => `${props.value} is not a valid phone number!`,
      // },
      required: [true, "User phone number required"],
    },
    transactions: Array,
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "admin",
    },
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoleCollection",
        //  default: "admin",
      },
    ],

    // verificationToken: String,
    verificationToken: {
      token: String,
      expires: Date,
    },
    verified: Date,
    resetToken: {
      token: String,
      expires: Date,
    },
    passwordReset: Date,
    created: { type: Date, default: Date.now },
    updated: Date,
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
export default User;
