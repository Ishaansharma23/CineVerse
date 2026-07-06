const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const sendAuthResponse = (res, user, statusCode) => {
  const token = generateToken(user._id);
  // generating cookie
  res.cookie('token' , token , { // 'token' -> cookie ka naam , token -> cookie ke andar store hone wali value hai.
    httpOnly: true,  // JavaScript cookie read nahi kar sakti
    secure: process.env.NODE_ENV === 'production', // Ye cookie sirf HTTPS request ke saath bhejna. in production m
    sameSite: 'strict', // Ye CSRF attack se bachata hai.
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  })

  res.status(statusCode).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
    },
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    if (role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Registration as an administrator is restricted.',
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      verificationStatus: role === 'owner' ? 'pending' : 'approved',
    });

    sendAuthResponse(res, user, 201);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isPasswordMatched = await user.matchPassword(password);

    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    sendAuthResponse(res, user, 200);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// "Mujhe current logged-in user ka data de do"
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

  const logoutUser = async (req , res) => {
  res.cookie('token', '', { // logout pr cookie '' krdi yani khali krdi 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Ye cookie sirf HTTPS request ke saath bhejna. in production m
      sameSite: 'strict', 
      expires: new Date(0),
    });

    res.status(200).json({
      success: true,
      message: 'Logged out',
    });
  }

const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updatePartnerVerification = async (req, res) => {
  try {
    const { userId, status } = req.body;

    if (!userId || !status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId or status. Status must be approved or rejected.',
      });
    }

    const partner = await User.findById(userId);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (partner.role !== 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Only partner/owner accounts can be verified.',
      });
    }

    partner.verificationStatus = status;
    await partner.save();

    res.status(200).json({
      success: true,
      message: `Partner account has been successfully ${status}!`,
      user: {
        id: partner._id,
        name: partner.name,
        email: partner.email,
        role: partner.role,
        verificationStatus: partner.verificationStatus,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  getAllUsersAdmin,
  updatePartnerVerification,
};