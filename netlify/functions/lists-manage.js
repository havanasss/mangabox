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
      const lists = await sql`
        SELECT l.*, COUNT(li.manga_id) as item_count
        FROM user_lists l
        LEFT JOIN list_items li ON l.id = li.list_id
        WHERE l.user_id = ${userId}
        GROUP BY l.id
        ORDER BY l.created_at DESC
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, lists })
      };

    } else if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      
      const result = await sql`
        INSERT INTO user_lists (
          user_id, name, description, is_public
        ) VALUES (
          ${userId}, ${data.name}, ${data.description}, 
          ${data.is_public !== false}
        ) RETURNING *
      `;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, list: result[0] })
      };
    }

  } catch (error) {
    console.error('Lists error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};