const { sql } = require('./db-setup');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.title || !data.author) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Title and author are required' })
      };
    }

    // Insert manga
    const result = await sql`
      INSERT INTO manga (
        title, original_title, author, artist, publisher, 
        year, type, genres, description, cover_url, 
        volumes_total, status
      ) VALUES (
        ${data.title}, ${data.original_title}, ${data.author}, 
        ${data.artist}, ${data.publisher}, ${data.year}, 
        ${data.type}, ${data.genres || []}, ${data.description}, 
        ${data.cover_url}, ${data.volumes_total}, ${data.status || 'ongoing'}
      ) RETURNING *
    `;

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        data: result[0]
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