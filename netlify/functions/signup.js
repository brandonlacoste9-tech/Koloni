const bcrypt = require("bcryptjs");
const { supabase } = require("./config/supabase");

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    const { name, email, password } = JSON.parse(event.body);

    // Validate input
    if (!name || !email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Name, email, and password are required",
        }),
      };
    }

    if (password.length < 8) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Password must be at least 8 characters",
        }),
      };
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          message: "User with this email already exists",
        }),
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          tokens: 10,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: "User created successfully",
        userId: newUser.id,
        tokens: 10,
      }),
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
