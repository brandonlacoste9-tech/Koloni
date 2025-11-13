
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('./config/firebase');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, password } = JSON.parse(event..body);

    // Find the user by email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    if (snapshot.empty) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid credentials' }),
      };
    }

    const user = snapshot.docs[0].data();

    // Check the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid credentials' }),
      };
    }

    // Generate a JWT
    const token = jwt.sign({ id: snapshot.docs[0].id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ token }),
    };
  } catch (error) {
    console.error('Error logging in:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};