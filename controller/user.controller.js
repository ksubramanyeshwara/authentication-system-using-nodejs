import User from "../modal/User.model.js";

// default
import crypto from "crypto";

import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import responseHandler from "../utils/responseHandler.util.js";

const registerUser = async (req, res) => {
  // get data - email, password, name
  // Validate request body
  // check if user already exists
  // create a user in db
  // create a verification token
  // save token in db
  // send token as email to user
  // send success message to user

  // get data
  const { name, email, password } = req.body;

  // validate
  if (!name || !email || !password) {
    responseHandler(res, 400, "Name, email and password are required");
  }

  // check if user already exists
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // create a user in db, creates new document in existing collection
    const user = await User.create({
      name,
      email,
      password,
    });
    console.log(user);

    // check user registered or not
    if (!user) {
      return res.status(400).json({
        message: "User not registered",
      });
    }

    // create a verification token
    const token = crypto.randomBytes(32).toString("hex");
    console.log(token);

    // save token in db
    user.verificationToken = token;
    await user.save();

    // send token as email to
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOption = {
      from: process.env.MAILTRAP_SENDEREMAIL, // sender address
      to: user.email, // list of receivers
      subject: "Verify your email", // Subject line
      text: `Please click on the link ${process.env.BASE_URL}/api/v1.users/verify/${token}`, // plain text body as email
      html: `
      <h1>Hello ${user.name}</h1>
      <p>Thank you for registering.</p>`, // html body
    };

    await transporter.sendMail(mailOption);

    //send success message to user
    res.status(201).json({
      message: "User Registered Successfully",
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      message: "User Not Registered",
      error,
      success: false,
    });
  }
};

const verifyUser = async (req, res) => {
  // get token from url
  // validate the token
  // find user based on token
  // set isVerified to true
  // remove verification token
  // save
  // return response

  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      message: "Invalid Token",
    });
  }
  try {
    const user = await User.findOne({
      verificationToken: token,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid Token",
      });
    }

    user.isVerified = true;

    user.verificationToken = undefined;

    await user.save();

    res.status(201).json({
      message: "User verified successfully",
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      message: "An error occurred during verification",
      error,
    });
  }
};

const login = async (req, res) => {
  // get username and password
  // validate

  // convert the password into hash
  // compare user given email and hashed password with email and hashed password stored in db

  const { email, password } = req.body;

  if (!email || !password) {
    responseHandler(res, 400, "All fields are required");
  }

  try {
    // check if email exists or not

    const user = await User.findOne({ email });
    if (!user) {
      responseHandler(res, 400, "Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // if password doesn't match, send a message
      responseHandler(res, 400, "Invalid email or password");
    }

    // check user verified or not, if not send a message to verify

    // save the token in cookies in some cases
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    const cookieOPtions = {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    };

    // add token to cookie
    res.cookie("token", jwtToken, cookieOPtions);
    console.log("Login successful"); // Debugging log

    // send response
    responseHandler(res, 200, "Login successful", {
      jwtToken,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error during login:", error); // Debugging log
    responseHandler(res, 500, "An error occurred during login", error);
  }
};

const profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {}
};

const logoutUser = async (req, res) => {
  try {
    // clear the cookies
    res.clearCookie("token", {
      // clear the cookie immediately
      // expires: new Date(0),
    });
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {}
};

const forgotPassword = async (req, res) => {
  try {
    // get email
    const { name, email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    // find user based on email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Enter a valid email",
      });
    }

    // reset password token + reset expiry => Date.now() + 10 * 60 * 1000 => user.save() (using crypto)
    const token = crypto.randomBytes(32).toString("hex");
    console.log(token);

    // set token + expiry
    user.resetPasswordToken = token;
    user.resetPasswordExpiry = Date.now() + 10 * 60 * 1000;

    // save token + expiry in db
    await user.save();

    // send mail with token for reset password => design url
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOption = {
      from: process.env.MAILTRAP_SENDEREMAIL, // sender address
      to: user.email, // list of receivers
      subject: "Reset Your Password", // Subject line
      text: `Please click on the link ${process.env.BASE_URL}/api/v1.users/resetpassword/${token}`, // plain text body as email
      html: `
      <h1>Hello ${user.name}</h1>
      <p>Please click on the link ${process.env.BASE_URL}/api/v1.users/resetpassword/${token}</p>`, // html body
    };

    await transporter.sendMail(mailOption);

    console.log("Password reset link sent to your email");

    //send success message to user
    res.status(201).json({
      message: "Password reset link sent to your email",
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      message: "An error occurred during forgot password",
      error,
      success: false,
    });
  }
};

// new password
const resetPassword = async (req, res) => {
  console.log("Reset Password Route Hit");

  try {
    // collect token from params
    const { token } = req.params;
    console.log("Token from request:", token);
    // password from req.body
    const { password } = req.body;
    console.log("Password from request:", password);

    // validate input
    if (!token || !password) {
      return res.status(400).json({
        message: "Invalid Token",
      });
    }

    // find user
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    console.log("User from DB:", user);

    // validate user
    if (!user) {
      return res.status(400).json({
        message: "Invalid Token",
      });
    }

    // set password in user
    user.password = password;

    // resetToken, resetExpiry => empty
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;

    await user.save();

    res.status(201).json({
      message: "Password reset successful",
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      message: "An error occurred during reset password",
      error,
      success: false,
    });
  }
};

export {
  registerUser,
  verifyUser,
  login,
  profile,
  logoutUser,
  resetPassword,
  forgotPassword,
};
