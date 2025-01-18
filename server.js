require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Securely load Stripe Secret Key

const app = express();

// Middleware to serve static files
app.use(express.static('public'));

// Middleware to parse JSON requests
app.use(express.json());

// Route to serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route to create a Stripe Checkout session
app.post('/create-checkout-session', async (req, res) => {
  const { product } = req.body;

  let priceId;

  if (product === '1-pair') {
    priceId = 'price_1Qi6yw2Qdt70x3V6Oarrel3m'; // 1 Pair (£6)
  } else if (product === '2-pairs') {
    priceId = 'price_1QiL1f2Qdt70x3V6poSusOvl'; // 2 Pairs (£10)
  } else {
    return res.status(400).send('Invalid product selection');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:4242/success',
      cancel_url: 'http://localhost:4242/cancel',
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    res.status(500).send(`Error creating checkout session: ${error.message}`);
  }
});

// Route for success page
app.get('/success', (req, res) => {
  console.log('Success page accessed');
  res.sendFile(path.join(__dirname, 'public/success.html'));
});

// Route for cancel page
app.get('/cancel', (req, res) => {
  console.log('Cancel page accessed');
  res.sendFile(path.join(__dirname, 'public/cancel.html'));
});

// Start the server
app.listen(4242, () => {
  console.log('Server running on http://localhost:4242');
});
