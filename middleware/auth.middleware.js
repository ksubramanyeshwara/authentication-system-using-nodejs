import jwt from "jsonwebtoken";

export const isLoggedIn = async (req, res, next) => {
  // get token from cookies
  try {
    console.log("Cookies:", req.cookies); // Debugging log
    const token = req.cookies?.token;
    console.log(`Token Found`, token ? "Yes" : "No");

    // validate the token
    if (!token) {
      console.log(`No token found in Cookies`);
      return res.status(401).json({
        success: false,
        message: "Authentiocatio Failed",
      });
    }

    // get the data using token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`Decoded Token`, decodedToken);

    // pass the decoded token to req.user
    req.user = decodedToken;

    next();
  } catch (error) {
    console.error("Error in isLoggedIn middleware:", error); // Debugging log

    return res.status(500).json({
      success: false,
      message: "Internal Server error",
    });
  }
};
