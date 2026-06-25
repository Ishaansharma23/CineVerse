const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  
  const token = req.cookies.token; // req.cookies = { token: "eyJ..." }
// token variable me JWT string aa jayegi

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password'); // password field mt bhejo -> .select wala (-) => exclude
    // (+) => ye ye fields laao 

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed',
    });
  }
};


const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if(!roles.includes(req.user.role)){ // Compares req.user.role with the allowed roles in the route("owner")
      return res.status(403).json({
        success: false,
        message : "you are not authorized to acess this resource",
      });
      }
      next();
    };
  };



module.exports = { protect  , authorizeRoles};