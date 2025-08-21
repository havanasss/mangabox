const { sql } = require('./db-setup');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { id, search, limit = 20, offset = 0 } = event.queryStringParameters || {};

    let result;

    if (id) {
      // Get single manga
      result = await sql`
        SELECT * FROM manga WHERE id = ${id}
      `;
    } else if (search) {
      // Search manga
      result = await sql`
        SELECT * FROM manga 
        WHERE title ILIKE ${'%' + search + '%'} 
        OR author ILIKE ${'%' + search + '%'}
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // Get all manga with pagination
      result = await sql`
        SELECT * FROM manga 
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result
      })
    };

  } catch (error) {
    console.error('Database error:', error);
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