const jwt = require("jsonwebtoken");
const { supabase } = require("../config/supabase");

async function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "access") {
      throw new Error("Invalid token type");
    }

    // Get fresh user data from Supabase
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", decoded.id)
      .single();

    if (error || !user) {
      throw new Error("User not found");
    }

    return {
      userId: decoded.id,
      email: decoded.email,
      userData: user,
    };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token expired");
    }
    throw new Error("Invalid token");
  }
}

module.exports = { verifyToken };
