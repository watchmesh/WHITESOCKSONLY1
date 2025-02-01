require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Load Stripe with secret key

const app = express();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Webhook secret

// Middleware for parsing JSON in normal routes
app.use(express.json());

// Middleware for verifying raw body on webhook route
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

// Serve static files from the "Public" folder
console.log('Serving static files from:', path.join(__dirname, 'Public'));
app.use(express.static('Public'));

// Serve the main page (index.html) from the Public folder
app.get('/', (req, res) => {
  const resolvedPath = path.join(__dirname, 'Public', 'index.html');
  console.log('Resolved Path for index.html:', resolvedPath);
  res.sendFile(resolvedPath);
});

/**
 * CREATE A CHECKOUT SESSION
 */
app.post('/create-checkout-session', async (req, res) => {
  try {
    console.log('Product received:', req.body.product);

    // Determine the Stripe Price ID based on the selected product
    let priceId;
    if (req.body.product === '1-pair') {
      priceId = 'price_1Qi6yw2Qdt70x3V6Oarrel3m'; // Replace with your actual Stripe Price ID
    } else if (req.body.product === '2-pairs') {
      priceId = 'price_1QiL1f2Qdt70x3V6poSusOvl'; // Replace with your actual Stripe Price ID
    } else {
      return res.status(400).json({ error: 'Invalid product selection' });
    }

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // Use Stripe Price ID
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://whitesocksonly-1.vercel.app/success.html',
      cancel_url: 'https://whitesocksonly-1.vercel.app/cancel.html',
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * SUCCESS & CANCEL PAGES
 */
app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'success.html'));
});

app.get('/cancel', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'cancel.html'));
});

/**
 * WEBHOOK ENDPOINT
 */
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      // Retrieve complete session details
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items.data.price.product']
      });

      // Implement your fulfillment logic here
      console.log('Payment succeeded:', fullSession);
    } catch (err) {
      console.error('Error processing webhook:', err);
      return res.status(500).send('Webhook processing failed');
    }
  }

  res.status(200).end();
});

/**
 * START THE SERVER
 */
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
