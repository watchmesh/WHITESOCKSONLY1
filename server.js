// server.js
require('dotenv').config(); // Load variables from .env

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Use the secret key from the environment
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
// Serve static files (HTML, CSS, JS) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Logging middleware (optional)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create checkout session endpoint
// This route is available at http://localhost:3000/api/create-checkout-session
app.post('/api/create-checkout-session', (req, res) => {
  console.log('Received request to create checkout session:', req.body);
  
  const { product } = req.body;
  let priceId;
  
  if (product === '1-pair') {
    priceId = 'price_1Qi6yw2Qdt70x3V6Oarrel3m';
    console.log('Selected 1-pair product with price ID:', priceId);
  } else if (product === '2-pairs') {
    priceId = 'price_1QiL1f2Qdt70x3V6poSusOvl';
    console.log('Selected 2-pairs product with price ID:', priceId);
  } else {
    console.error('Invalid product selected:', product);
    return res.status(400).json({ error: 'Invalid product selected' });
  }
  
  console.log('Creating checkout session with Stripe...');
  stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    // Enable shipping address collection for allowed countries.
    shipping_address_collection: {
      allowed_countries: ['US', 'CA', 'GB'] // Adjust as needed.
    },
    mode: 'payment',
    success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.headers.origin}/cancel.html`,
  })
  .then(session => {
    console.log('Checkout session created successfully:', session.id);
    res.json({ id: session.id });
  })
  .catch(error => {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server time: ${new Date().toISOString()}`);
});
