require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON payloads
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Initialize DB tables if they don't exist
const initDb = async () => {
  try {
    // Create items table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert some sample data if table is empty
    const result = await pool.query('SELECT COUNT(*) FROM items');
    if (parseInt(result.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO items (name, description) VALUES
        ('Item 1', 'Description for item 1'),
        ('Item 2', 'Description for item 2'),
        ('Item 3', 'Description for item 3')
      `);
      console.log('Sample data inserted');
    }
    
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});

// FizzBuzz endpoint
app.get('/fizzbuzz/:count', (req, res) => {
  const count = parseInt(req.params.count) || 100;
  const result = [];
  
  for (let i = 1; i <= count; i++) {
    if (i % 15 === 0) {
      result.push("FizzBuzz");
    } else if (i % 3 === 0) {
      result.push("Fizz");
    } else if (i % 5 === 0) {
      result.push("Buzz");
    } else {
      result.push(i.toString());
    }
  }
  
  res.json({
    count,
    result
  });
});

// Random quotes endpoint
app.get('/quotes/random', (req, res) => {
  const quotes = [
    { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "If life were predictable it would cease to be life, and be without flavor.", author: "Eleanor Roosevelt" },
    { text: "Spread love everywhere you go. Let no one ever come to you without leaving happier.", author: "Mother Teresa" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
    { text: "Whoever is happy will make others happy too.", author: "Anne Frank" },
    { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
    { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" }
  ];
  
  // Get a random quote
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];
  
  // Add a deployment timestamp to verify version
  res.json({
    quote: randomQuote,
    version: "1.0",
    deployedAt: new Date().toISOString()
  });
});

// Get all items
app.get('/api/items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get item by ID
app.get('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching item:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new item
app.post('/api/items', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, '0.0.0.0', async () => {
  console.log(`Server running on port ${port}`);
  
  // Initialize database on startup
  await initDb();
}); 