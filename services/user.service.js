import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Role from "../models/Role.js";
import User from "../models/User.js";
import RefreshToken from "../models/refresh-token.js";
import sendEmail from "../config/send-email.js";

import dotenv from "dotenv";
dotenv.config();

export function hash(password) {
  return bcrypt.hashSync(password, 12);
}

export function setTokenCookie(res, token) {
  // create cookie with refresh token that expires in 7 days
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
  // res.cookie('refreshToken', token, cookieOptions);
  res.cookie("token", token, cookieOptions);
}

export async function sendVerificationEmail(user, origin) {
  console.log("RTY", user);
  let message;

  if (origin) {
    const verifyUrl = `${origin}/verify-email?token=${user.verificationToken}`;
    console.log("SDFG:", verifyUrl);
    message = `<p>Please click the below link to verify your email address:</p>
                 <p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
  } else {
    message = `<p>Please use the below token to verify your email address with the <code>/user/verify-email</code> api route:</p>
                 <p><code>${user.verificationToken}</code></p>`;
  }

  await sendEmail({
    to: user.email,
    subject: "Sign-up Verification API - Verify Email",
    html: `<h4>Verify Email</h4>
             <p>Thanks for registering!</p>
             ${message}`,
  });
}

export async function sendAlreadyRegisteredEmail(email, origin) {
  let message;

  if (origin) {
    message = `<p>If you don't know your password please visit the <a href="${origin}/user/forgot-password">forgot password</a> page.</p>`;
  } else {
    message = `<p>If you don't know your password you can reset it via the <code>/user/forgot-password</code> api route.</p>`;
  }

  console.log("Message:", message);
  await sendEmail({
    to: email,
    subject: "Sign-up Verification API - Email Already Registered",
    html: `<h4>Email Already Registered</h4>
             <p>Your email <strong>${email}</strong> is already registered.</p>
             ${message}`,
  });
}

export async function sendPasswordResetEmail(user, origin) {
  let message;
  if (origin) {
    const resetUrl = `${origin}/user/reset-password?token=${user.resetToken.token}`;
    message = `<p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                 <p><a href="${resetUrl}">${resetUrl}</a></p>`;
  } else {
    message = `<p>Please use the below token to reset your password with the <code>/user/reset-password</code> api route:</p>
                 <p><code>${user.resetToken.token}</code></p>`;
  }

  await sendEmail({
    to: user.email,
    subject: "Sign-up Verification API - Reset Password",
    html: `<h4>Reset Password Email</h4>
             ${message}`,
  });
}

export const authenticate = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (
    !user
    // ||
    // !user.isVerified ||
    // !bcrypt.compareSync(password, user.passwordHash)
  ) {
    throw "Email or password is incorrect";
  }

  // authentication successful so generate jwt and refresh tokens
  const jwtToken = generateJwtToken(user);

  const refreshToken = generateRefreshToken(user);

  // save refresh token
  await refreshToken.save();

  // return basic details and tokens
  return {
    ...basicDetails(user),
    jwtToken,
    refreshToken: refreshToken.token,
    // refreshToken: jwtToken,
  };
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
    verificationToken,
    verified,
    resetToken,
    passwordReset,
    created,
    updated,
  } = user;

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
    verificationToken,
    verified,
    resetToken,
    passwordReset,
    created,
    updated,
  };
}
