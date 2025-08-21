const { sql } = require('./db-setup');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Verify JWT token
  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'No token provided' })
    };
  }

  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.userId;
  } catch (error) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid token' })
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      const reviews = await sql`
        SELECT r.*, u.username, m.title as manga_title
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN manga m ON r.manga_id = m.id
        WHERE r.user_id = ${userId}
        ORDER BY r.created_at DESC
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, reviews })
      };

    } else if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      
      const result = await sql`
        INSERT INTO reviews (
          user_id, manga_id, title, content, rating, contains_spoilers
        ) VALUES (
          ${userId}, ${data.manga_id}, ${data.title}, 
          ${data.content}, ${data.rating}, ${data.contains_spoilers || false}
        )
        ON CONFLICT (user_id, manga_id) 
        DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          rating = EXCLUDED.rating,
          contains_spoilers = EXCLUDED.contains_spoilers
        RETURNING *
      `;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, review: result[0] })
      };
    }

  } catch (error) {
    console.error('Reviews error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};