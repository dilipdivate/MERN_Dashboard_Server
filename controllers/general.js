import User from "../models/User.js";
import Role from "../models/Role.js";
import OverallStat from "../models/OverallStat.js";
import Transaction from "../models/Transaction.js";
import {
  authenticate,
  randomTokenString,
  hash,
  setTokenCookie,
  sendVerificationEmail,
  sendAlreadyRegisteredEmail,
  sendPasswordResetEmail,
} from "../services/user.service.js";

import {
  getCustomersSrv,
  getCustomerByIDSrv,
  addCustomerSrv,
  updateCustomerSrv,
  deleteCustomerSrv,
} from "../services/customer.service.js";

export const getUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json(users);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getUserByID = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// export const getUserByEmail = async (req, res) => {
//   try {
//     console.log("DDS:", req.params.email);
//     const { email } = req.params;
//     const user = await User.findOne({ email });

//     console.log("DDS:", user);
//     if (
//       !user ||
//       !user.isVerified ||
//       !bcrypt.compareSync(password, user.passwordHash)
//     ) {
//       throw "Email or password is incorrect";
//     }

//     // authentication successful so generate jwt and refresh tokens
//     const jwtToken = generateJwtToken(user);

//     const refreshToken = generateRefreshToken(user);

//     // save refresh token
//     await refreshToken.save();

//     setTokenCookie(res, refreshToken);
//     res.status(200).json(user);
//   } catch (error) {
//     res.status(404).json({ message: error.message });
//   }
// };

export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    authenticate({ email, password }).then(({ refreshToken, ...account }) => {
      setTokenCookie(res, refreshToken);
      res.json(account);
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const postUser = async (req, res) => {
  const origin = req.originalUrl;

  try {
    if (await User.findOne({ email: req.email })) {
      // send already registered error in email to prevent account enumeration
      console.log("coming here:", params.email);
      await sendAlreadyRegisteredEmail(req.email, origin);
    }

    if (req.roles) {
      const UserRoles = await Role.find({ name: { $in: req.roles } });
      // console.log(UserRoles);
      if (UserRoles.length !== 0) {
        req.roles = UserRoles.map((role) => role._id);
      } else {
        throw `Failed! - Role ${req.roles} does not exist!`;
      }
    } else {
      const UserRole = await Role.findOne({ name: "user" });
      req.roles = [UserRole._id];
    }

    // create account object
    const user = new User(req.body);

    user.verificationToken = randomTokenString(user.id);

    // hash password
    user.passwordHash = hash(req.body.password);

    // save account
    await user.save();

    // send email
    await sendVerificationEmail(user, origin);

    res.status(201).json({
      message:
        "Registration successful, please check your email for verification instructions",
    });
  } catch (error) {
    console.log("RRR:", error);
    res.status(404).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    // console.log("DILLREQ:", req.body);
    const user = await User.findByIdAndUpdate(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    // console.log("DILLREQ:", req.body);
    const user = await User.findByIdAndRemove(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({
      "resetToken.token": token,
      "resetToken.expires": { $gt: Date.now() },
    });

    if (!user) throw "Invalid token";

    // update password and remove reset token
    user.passwordHash = hash(password);
    user.passwordReset = Date.now();
    user.resetToken = undefined;
    await user.save();

    res
      .status(201)
      .json({ message: "Password reset successful, you can now login" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // always return ok response to prevent email enumeration

    if (!user) throw "Invalid Email";

    // create reset token that expires after 24 hours
    user.resetToken = {
      token: randomTokenString(user.id),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
    await user.save();

    // send email
    await sendPasswordResetEmail(user);
    res.status(201).json({
      message: "Please check your email for password reset instructions",
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    console.log("TOKEN", token);
    const user = await User.findOne({ verificationToken: token });

    console.log("TOKENUSER", user);
    if (!user) throw "Verification failed";

    user.verified = Date.now();
    user.verificationToken = undefined;
    await user.save();

    res
      .status(201)
      .json({ message: "Verification successful, you can now login" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const validateResetToken = async (req, res) => {
  try {
    const user = await User.findOne({
      "resetToken.token": token,
      "resetToken.expires": { $gt: Date.now() },
    });

    if (!user) throw "Invalid token";

    res.status(201).json({ message: "Token is valid" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    // console.log("DILLREQ:", req.body);
    const token = req.cookies.token;

    const refreshToken = await getRefreshToken(token);

    const { account } = refreshToken;

    // const jwtToken = generateJwtToken(account);
    // replace old refresh token with a new one and save

    const newRefreshToken = generateRefreshToken(account, ipAddress);

    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;

    refreshToken.replacedByToken = newRefreshToken.token;
    newRefreshToken.account = refreshToken.account;
    await refreshToken.save();
    await newRefreshToken.save();

    // generate new jwt
    const jwtToken = generateJwtToken(account);
    setTokenCookie(res, refreshToken);
    res.status(201).json(account);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const revokeToken = async (req, res) => {
  try {
    const token = req.body.token || req.cookies.token;

    if (!token) return res.status(400).json({ message: "Token is required" });

    // users can revoke their own tokens and admins can revoke any tokens

    const userRole = await Role.find({ name: { $in: req.user.role } });

    if (!req.user.ownsToken(token) && userRole !== CheckRole.Admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const refreshToken = await getRefreshToken(token);

    // revoke token and save
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    await refreshToken.save();

    res.status(201).json({ message: "Token revoked" });
  } catch (error) {
    res.status(404).json({ message: error.message });
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
