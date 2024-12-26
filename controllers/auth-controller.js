const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const checkExistingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (checkExistingUser) {
      return res.status(400).json({
        success: false,
        messages: "user is already exists either with username or email",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newlyCreatedUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    await newlyCreatedUser.save();

    if (newlyCreatedUser) {
      return res.status(201).json({
        success: true,
        message: "user registered successfully.",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "unable to register user! please try again.",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "some error occured! please try again.",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user doesn't exists",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "invalid credentials",
      });
    }

    const accessToken = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "30m",
      }
    );
    res.status(200).json({
      success: true,
      message: "Logged in successful",
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "some error occured! please try again.",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.userInfo.userId;

    const { oldPassword, newPassword } = req.body;

    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password cannot be the same as the old password. Please choose a different password.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is not correct! Please try again.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = newHashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "password changed successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "some error occured! please try again.",
    });
  }
};

module.exports = { registerUser, loginUser, changePassword };
