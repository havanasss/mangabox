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
    const method = event.httpMethod;
    
    if (method === 'GET') {
      // Get user collection with economic data
      const collection = await sql`
        SELECT 
          uc.*,
          m.title, m.author, m.cover_url, m.publisher, m.year,
          m.volumes_total as total_volumes
        FROM user_collection uc
        JOIN manga m ON uc.manga_id = m.id
        WHERE uc.user_id = ${userId}
        ORDER BY uc.created_at DESC
      `;

      // Calculate totals
      const totals = await sql`
        SELECT 
          COALESCE(SUM(owned_volumes), 0) as total_volumes,
          COALESCE(SUM(owned_volumes * cover_price), 0) as total_cover_value,
          COALESCE(SUM(owned_volumes * paid_price), 0) as total_paid_value
        FROM user_collection
        WHERE user_id = ${userId}
      `;

      const economicData = totals[0];
      economicData.total_savings = economicData.total_cover_value - economicData.total_paid_value;
      economicData.savings_percentage = economicData.total_cover_value > 0 
        ? ((economicData.total_savings / economicData.total_cover_value) * 100).toFixed(2)
        : 0;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          collection,
          economicData
        })
      };

    } else if (method === 'POST') {
      const data = JSON.parse(event.body);
      
      // First check if manga exists, if not create it
      let mangaId = data.manga_id;
      
      if (!mangaId && data.title) {
        // Create new manga entry
        const newManga = await sql`
          INSERT INTO manga (
            title, author, publisher, year, type, 
            genres, description, cover_url, volumes_total
          ) VALUES (
            ${data.title}, ${data.author}, ${data.publisher}, 
            ${data.year}, ${data.type}, ${data.genres || []}, 
            ${data.description}, ${data.cover_url}, ${data.total_volumes}
          ) RETURNING id
        `;
        mangaId = newManga[0].id;
      }

      // Add to collection
      const result = await sql`
        INSERT INTO user_collection (
          user_id, manga_id, owned_volumes, volumes_list,
          cover_price, paid_price, condition, collection_status,
          purchase_date, purchase_notes
        ) VALUES (
          ${userId}, ${mangaId}, ${data.owned_volumes}, ${data.volumes_list},
          ${data.cover_price}, ${data.paid_price}, ${data.condition},
          ${data.collection_status}, ${data.purchase_date}, ${data.purchase_notes}
        )
        ON CONFLICT (user_id, manga_id) 
        DO UPDATE SET
          owned_volumes = EXCLUDED.owned_volumes,
          volumes_list = EXCLUDED.volumes_list,
          cover_price = EXCLUDED.cover_price,
          paid_price = EXCLUDED.paid_price,
          condition = EXCLUDED.condition,
          collection_status = EXCLUDED.collection_status,
          purchase_date = EXCLUDED.purchase_date,
          purchase_notes = EXCLUDED.purchase_notes
        RETURNING *
      `;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          data: result[0]
        })
      };

    } else if (method === 'DELETE') {
      const { manga_id } = event.queryStringParameters;
      
      await sql`
        DELETE FROM user_collection 
        WHERE user_id = ${userId} AND manga_id = ${manga_id}
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

  } catch (error) {
    console.error('Collection error:', error);
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