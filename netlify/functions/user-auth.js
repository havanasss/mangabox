const { sql } = require('./db-setup');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { action, username, email, password } = JSON.parse(event.body);

    if (action === 'register') {
      // Check if user exists
      const existing = await sql`
        SELECT id FROM users WHERE email = ${email} OR username = ${username}
      `;

      if (existing.length > 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'User already exists' })
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = await sql`
        INSERT INTO users (username, email, password_hash)
        VALUES (${username}, ${email}, ${hashedPassword})
        RETURNING id, username, email
      `;

      // Generate token
      const token = jwt.sign(
        { userId: result[0].id, username: result[0].username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          token,
          user: result[0]
        })
      };

    } else if (action === 'login') {
      // Find user
      const users = await sql`
        SELECT id, username, email, password_hash 
        FROM users 
        WHERE email = ${email} OR username = ${email}
      `;

      if (users.length === 0) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      const user = users[0];

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        })
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action' })
    };

  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};