import User from "../models/User.js";

import jwt from "jsonwebtoken";
import {
  signinSrv,
  registerSrv,
  resetPasswordSrv,
  changePasswordSrv,
  forgotPasswordSrv,
  verifyEmailSrv,
  validateResetTokenSrv,
  refreshTokenSrv,
  revokeTokenSrv,
  setTokenCookie,
} from "../services/auth.service.js";

import RefreshToken from "../models/refresh-token.js";

// Cookie options
const accessTokenCookieOptions = {
  expires: new Date(Date.now() + process.env.accessTokenExpiresIn * 60 * 1000),
  maxAge: process.env.accessTokenExpiresIn * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

const refreshTokenCookieOptions = {
  expires: new Date(Date.now() + process.env.refreshTokenExpiresIn * 60 * 1000),
  maxAge: process.env.refreshTokenExpiresIn * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const signInHandler = async (req, res, next) => {
  const { email, password } = req.body;

  signinSrv({ email, password })
    .then(({ accessToken, refreshToken }) => {
      setTokenCookie(res, accessToken);
      // Send Access Token in Cookie
      res.cookie("access_token", accessToken, accessTokenCookieOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenCookieOptions);
      res.cookie("logged_in", true, {
        ...accessTokenCookieOptions,
        httpOnly: false,
      });
      console.log("coming from here");
      res.status(200).json(accessToken);
    })
    .catch((err) => {
      next(err);
    });
};

export const signOutHandler = async (req, res, next) => {
  console.log("Final:", res.cookies);
  console.log("Final2:", res.headers);
  // res.cookie("access_token", "", { maxAge: 1 });
  // res.cookie("refresh_token", "", { maxAge: 1 });
  // res.cookie("token", "", { maxAge: -1 });
  // res.cookie("logged_in", "", { maxAge: 1 });
  // res.cookies("access_token", "", { maxAge: -1 });
  // res.cookies("token", "", { maxAge: -1 });
  // res.cookies("refresh_token", "", { maxAge: -1 });
  // res.cookies("logged_in", "", { maxAge: -1 });
};

export const registerHandler = async (req, res, next) => {
  console.log(req.body);
  registerSrv(req.body)
    .then((verificationToken) => {
      res.status(201).json({
        verificationToken,
        message:
          "Registration successful, please check your email for verification instructions",
      });
    })
    .catch((err) => {
      next(err);
    });
};

export const resetPasswordHandler = async (req, res, next) => {
  const { password } = req.body;

  const { token } = req.params;
  resetPasswordSrv({ password, token })
    .then(() => {
      res
        .status(201)
        .json({ message: "Password reset successful, you can now login" });
    })
    .catch((err) => {
      next(err);
    });
};

export const changePasswordHandler = async (req, res, next) => {
  const { email, oldPassword, newPassword } = req.body;

  console.log(req.body);
  changePasswordSrv({ email, oldPassword, newPassword })
    .then(() => {
      res.status(201).json({
        message:
          "Password changed successful, you can now login with new Password",
      });
    })
    .catch((err) => {
      next(err);
    });
};

export const forgotPasswordHandler = async (req, res, next) => {
  console.log(req.body);
  const { email } = req.body;
  forgotPasswordSrv({ email })
    .then((token) => {
      console.log(token);
      res.status(201).json({
        token,
        message: "Please check your email for password reset instructions",
      });
    })
    .catch((err) => {
      next(err);
    });
};

export const verifyEmailHandler = async (req, res, next) => {
  const { token } = req.query;
  verifyEmailSrv({ token })
    .then(() => {
      res
        .status(201)
        .json({ message: "Verification successful, you can now login" });
    })
    .catch((err) => {
      next(err);
    });
};

export const validateResetTokenHandler = async (req, res, next) => {
  const { token } = req.query;
  validateResetTokenSrv({ token })
    .then(() => {
      res.status(201).json({ message: "Token is valid" });
    })
    .catch((err) => {
      next(err);
    });
};

export const refreshTokenHandler = async (req, res, next) => {
  refreshTokenSrv()
    .then(({ accessToken, refreshToken }) => {
      // Send the access token as cookie
      setTokenCookie(res, accessToken);
      res.cookie("access_token", accessToken, accessTokenCookieOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenCookieOptions);
      res.cookie("logged_in", true, {
        ...accessTokenCookieOptions,
        httpOnly: false,
      });
      res.status(200).json(accessToken);
    })
    .catch((err) => {
      next(err);
    });

  try {
    // console.log("DILLREQ:", req.body);
    // Get the refresh token from cookie
  } catch (error) {
    // next(err);
    res.status(404).json({ message: error });
  }
};

export const revokeTokenHandler = async (req, res, next) => {
  const token = req.cookies.refresh_token || req.headers.cookie.refresh_token;
  if (!token) return res.status(400).json({ message: "Token is required" });

  revokeTokenSrv({ token })
    .then(() => {
      res.status(201).json({ message: "Token revoked" });
    })
    .catch((err) => {
      next(err);
    });
};

export const deserializeUser = async (req, res, next) => {
  try {
    // Get the token
    let access_token;
    let refresh_token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      access_token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.access_token) {
      access_token = req.cookies.access_token;
      refresh_token = req.cookies.refresh_token;
    }

    // console.log("Deserialize::", access_token);
    if (!access_token) {
      res.status(401).json({ message: "You are not logged in" });
    }

    // Validate Access Token

    const decoded = jwt.verify(access_token, process.env.secret);
    const decoded2 = jwt.verify(refresh_token, process.env.secret);

    // console.log(decoded2);

    if (!decoded2) {
      res.status(401).json({ message: "You are not logged in" });
    }

    // console.log("SESSSION", decoded2);
    // Check if user has a valid session
    const session = await RefreshToken.findOne({ user: decoded2.id });

    // console.log("SESON", session);
    if (!session) {
      res.status(401).json({ message: "User session has expired" });
    }

    await RefreshToken.deleteMany({ user: decoded2.id });

    // Check if user still exist
    const user = await User.findOne({ email: decoded.email });

    // console.log(user);

    if (!user) {
      res.status(401).json({ message: "User with that token no longer exist" });
    }

    // This is really important (Helps us know if the user is logged in from other controllers)
    // You can do: (req.user or res.locals.user)
    res.locals.user = user;

    next();
  } catch (err) {
    console.log("ERROR is comg here", err);
    next(err);
  }
};

// export const getUserFromToken = async (req, res, next) => {
//   const defaultReturnObject = { authenticated: false, user: null };

//   try {
//     // console.log("0:", req.headers.cookie[0]);
//     // console.log("1:", req.headers.cookie[1]);
//     // console.log("2:", req.headers.cookie[2]);
//     // console.log("3:", req.cookies.access_token);
//     // console.log(req);
//     // console.log(req?.headers?.authorization);

//     // const token =
//     //   String(req?.headers?.cookie?.split("token=")[1]) ||
//     //   String(req?.headers?.authorization?.replace("Bearer ", ""));
//     // console.log("REQ:", token);
//     // const decoded = jwt.verify(token, process.env.secret);
//     // console.log("REQ2:", decoded);
//     // const getUserResponse = await User.findById(decoded.id);

//     const token = String(req?.cookies?.token);
//     const decoded = jwt.verify(token, process.env.secret);
//     console.log("REQ2:", decoded);
//     const getUserResponse = await User.findOne({ email: decoded.email });
//     console.log(getUserResponse);
//     const user = getUserResponse;
//     if (!user) {
//       res.status(400).json(defaultReturnObject);
//       return;
//     }
//     delete user.password;
//     res.status(200).json({
//       // authenticated: true,
//       status: "success",
//       user,
//     });
//   } catch (err) {
//     console.log("POST auth/me, Something Went Wrong", err);
//     res.status(400).json(defaultReturnObject);
//   }
// };
