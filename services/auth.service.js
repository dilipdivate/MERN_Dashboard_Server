import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Role from "../models/Role.js";
import User from "../models/User.js";
import RefreshToken from "../models/refresh-token.js";
import sendEmail from "../config/send-email.js";

import dotenv from "dotenv";
dotenv.config();

export const signinSrv = async ({ email, password }) => {
  const user = await User.findOne({ email });

  console.log(password);

  console.log(user);

  if (
    !user ||
    !user.verified ||
    !bcrypt.compareSync(password, user.passwordHash)
  ) {
    throw "Email or password is incorrect";
  }

  // authentication successful so generate jwt and refresh tokens
  const accessToken = generateJwtToken(user);
  const oldToken = await RefreshToken.findOne({ user: user.id });

  if (oldToken) {
    await RefreshToken.deleteMany({ user: user.id });
  }

  const refreshToken = generateRefreshToken(user);
  // save refresh token
  await refreshToken.save();

  // res.cookie(
  //   "refresh_token",
  //   saveInRefreshToken.token,
  //   refreshTokenCookieOptions
  // );
  // res.cookie("access_token", jwtToken, accessTokenCookieOptions);

  // res.cookie("logged_in", true, {
  //   ...accessTokenCookieOptions,
  //   httpOnly: false,
  // });

  // return basic details and tokens

  return {
    ...basicDetails(user),
    accessToken,
    refreshToken: refreshToken.token,
  };
};

export const registerSrv = async (req) => {
  const origin = process.env.backend_url;

  if (await User.findOne({ email: req.email })) {
    // send already registered error in email to prevent account enumeration
    // console.log("coming here:", params.email);
    await sendAlreadyRegisteredEmail(req.email, origin);

    throw "User is already registered";
  }

  console.log("ret2:");
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
  const user = new User(req);

  // create reset token that expires after 24 hours
  user.verificationToken = {
    token: randomTokenString(user.id),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  // hash password
  user.passwordHash = hash(req.password);

  // save account
  await user.save();

  // send email
  await sendVerificationEmail(user, origin);
  return user.verificationToken.token;
};

export const resetPasswordSrv = async ({ token, password }) => {
  const user = await User.findOne({
    "resetToken.token": token,
    "resetToken.expires": { $gt: Date.now() },
  });

  console.log(user);
  if (!user) throw "Invalid token";

  // update password and remove reset token
  user.passwordHash = hash(password);
  user.passwordReset = Date.now();
  user.resetToken = undefined;
  await user.save();
};

export const changePasswordSrv = async ({
  email,
  oldPassword,
  newPassword,
}) => {
  const user = await User.findOne({
    email,
  });

  console.log(user);
  if (
    !user ||
    !user.verified ||
    !bcrypt.compareSync(oldPassword, user.passwordHash)
  ) {
    throw "Email or password is incorrect";
  }

  // update password
  user.passwordHash = hash(newPassword);

  await user.save();
};

export const forgotPasswordSrv = async ({ email }) => {
  const origin = process.env.backend_url;
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
  await sendPasswordResetEmail(user, origin);
  return user.resetToken.token;
};

export const verifyEmailSrv = async ({ token }) => {
  console.log(token);
  // const user = await User.findOne({ verificationToken: token });
  const user = await User.findOne({
    "verificationToken.token": token,
    "verificationToken.expires": { $gt: Date.now() },
  });

  console.log("TOKENUSER", user);
  if (!user) throw "Verification failed";

  user.verified = Date.now();

  user.verificationToken = undefined;
  await user.save();
};

export const validateResetTokenSrv = async ({ token }) => {
  const user = await User.findOne({
    "resetToken.token": token,
    "resetToken.expires": { $gt: Date.now() },
  });

  if (!user) throw "Invalid token";
};

export const refreshTokenSrv = async () => {
  const token = req.cookies.token || req.headers.cookie.access_token;
  const refresh_token =
    req.cookies.refresh_token || req.headers.cookie.refresh_token;

  // const token = req.headers.cookie.access_token;
  // const refresh_token = req.headers.cookie.refresh_token;

  console.log(token, refreshToken);
  // Validate the Refresh token

  const decoded = jwt.verify(refresh_token, process.env.refreshTokenPublicKey);
  const message = "Could not refresh access token";
  if (!decoded) {
    throw message;
  }
  // Check if the user has a valid session
  const session = await RefreshToken.findOne({ token: decoded.token });
  if (!session) {
    throw message;
  }

  // Check if the user exist
  const userExist = await findUserById(JSON.parse(session)._id);

  if (!userExist) {
    throw message;
  }

  // Sign new access token
  const refreshToken = await getRefreshToken(token);

  const { user } = refreshToken;

  // const jwtToken = generateJwtToken(account);
  // replace old refresh token with a new one and save

  const newRefreshToken = generateRefreshToken(user);

  refreshToken.revoked = Date.now();
  // refreshToken.revokedByIp = ipAddress;

  refreshToken.replacedByToken = newRefreshToken.token;
  newRefreshToken.user = refreshToken.user;
  await refreshToken.save();
  await newRefreshToken.save();

  // generate new jwt
  const accessToken = generateJwtToken(user);
};

export const revokeTokenSrv = async ({ token }) => {
  // const user = await RefreshToken.findOne({ token });

  // users can revoke their own tokens and admins can revoke any tokens
  // console.log(user);
  // const userRole = await Role.find({ name: { $in: user.role } });
  // console.log(userRole);
  // if (!req.user.ownsToken(token) && userRole !== CheckRole.Admin) {
  //   return res.status(401).json({ message: "Unauthorized" });
  // }

  const refreshToken = await getRefreshToken(token);

  // revoke token and save
  refreshToken.revoked = Date.now();
  await refreshToken.save();
};

async function getRefreshToken(token) {
  // const refreshToken = await RefreshToken.findOne({ token }).populate(
  //   'AccountCollection'
  // );

  const refreshToken = await RefreshToken.findOne({ token });

  if (!refreshToken || !refreshToken.isActive) throw "Invalid token";
  return refreshToken;
}

export function hash(password) {
  return bcrypt.hashSync(password, 12);
}

export function setTokenCookie(res, token) {
  // create cookie with refresh token that expires in 7 days
  const cookieOptions = {
    httpOnly: false,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
  // res.cookie('refreshToken', token, cookieOptions);
  res.cookie("token", token, cookieOptions);
}

export async function sendVerificationEmail(user, origin) {
  console.log("RTY", user);
  let message;

  if (origin) {
    // const verifyUrl = `${origin}/verifyEmail`;
    const verifyUrl = `${origin}/verifyEmail?token=${user.verificationToken.token}`;
    console.log("SDFG:", verifyUrl);
    message = `<p>Please click the below link to verify your email address:</p>
                 <p><a href="${verifyUrl}">Verify Email</a></p>`;
  } else {
    message = `<p>Please use the below token to verify your email address with the <code>/auth/verify-email</code> api route:</p>
                 <p><code>${user.verificationToken.token}</code></p>`;
  }

  await sendEmail({
    to: user.email,
    subject: "Dashboard App - Verify Email",
    html: `<h4>Verify Email</h4>
             <p>Thanks for registering!</p>
             ${message}`,
  });
}

export async function sendAlreadyRegisteredEmail(email, origin) {
  let message;

  if (origin) {
    message = `<p>If you don't know your password please visit the <a href="${origin}/forgotPassword">forgot password</a> page.</p>`;
  } else {
    message = `<p>If you don't know your password you can reset it via the <code>/forgotPassword</code> api route.</p>`;
  }

  console.log("Message:", message);
  await sendEmail({
    to: email,
    subject: "Dashboard App - Email Already Registered",
    html: `<h4>Email Already Registered</h4>
             <p>Your email <strong>${email}</strong> is already registered.</p>
             ${message}`,
  });
}

export async function sendPasswordResetEmail(user, origin) {
  let message;
  if (origin) {
    const resetUrl = `${origin}/resetPassword?token=${user.resetToken.token}`;
    message = `<p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                 <p><a href="${resetUrl}">${resetUrl}</a></p>`;
  } else {
    message = `<p>Please use the below token to reset your password with the <code>/resetPassword</code> api route:</p>
                 <p><code>${user.resetToken.token}</code></p>`;
  }

  await sendEmail({
    to: user.email,
    subject: "Dashboard App - Reset Password",
    html: `<h4>Reset Password Email</h4>
             ${message}`,
  });
}

export const signOutUser = async (req, res, getAuthUser) => {
  console.log("Signout User: ", getAuthUser);
  const user = await checkIsLoggedIn(req, getAuthUser);

  // console.log(user);
  await RefreshToken.deleteOne({ _id: user.id });

  return true;
};

function generateJwtToken(user) {
  // create a jwt token containing the user id that expires in 15 minutes
  return jwt.sign({ email: user.email }, process.env.secret, {
    expiresIn: "95m",
  });
}

function generateRefreshToken(user) {
  // create a refresh token that expires in 7 days
  const refreshTkn = new RefreshToken({
    user: user,
    token: randomTokenString(user.id),
    // token: jwtToken,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return refreshTkn;
}

export function randomTokenString(id) {
  // return crypto.randomBytes(40).toString('hex');

  const randomToken = jwt.sign({ id: id }, process.env.secret);

  return randomToken;
}

function basicDetails(user) {
  const {
    _id,
    firstName,
    lastName,
    email,
    city,
    state,
    country,
    occupation,
    phoneNumber,
    transactions,
    role,
    roles,
    verificationToken,
    verified,
    resetToken,
    passwordReset,
    created,
    updated,
  } = user;

  return {
    _id,
    firstName,
    lastName,
    email,
    city,
    state,
    country,
    occupation,
    phoneNumber,
    transactions,
    role,
    roles,
    verificationToken,
    verified,
    resetToken,
    passwordReset,
    created,
    updated,
  };
}
