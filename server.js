require('dotenv').config(); // Load .env variables

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

// Load Stripe with your secret key from .env
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Webhook secret from .env
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// For normal JSON parsing on routes (like /create-checkout-session)
app.use(express.json());

// For the /webhook endpoint, we need the raw body to verify signatures
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

// Serve static files from the "Public" folder
// (Rename to "public" or keep it "Public"—just be consistent in folder naming)
app.use(express.static('Public'));

/**
 * Show the main page.
 * If your index.html is inside Public, you could just rely on express.static
 * But if it's outside, adjust this path:
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * CREATE A CHECKOUT SESSION
 * (Adapted from your second snippet)
 */
app.post('/create-checkout-session', async (req, res) => {
  const { product } = req.body; // "1-pair" or "2-pairs" from the frontend

  let priceId;
  if (product === '1-pair') {
    // Replace with your real price ID from the Stripe Dashboard
    priceId = 'price_1Qi6yw2Qdt70x3V6Oarrel3m';
  } else if (product === '2-pairs') {
    priceId = 'price_1QiL1f2Qdt70x3V6poSusOvl';
  } else {
    return res.status(400).send('Invalid product selection');
  }

  try {
    // Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Your Product Name',
            },
            unit_amount: 1000, // 10 GBP in pence
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://watchmesh.github.io/WHITESOCKSONLY1/success.html', // Update this
      cancel_url: 'https://watchmesh.github.io/WHITESOCKSONLY1/cancel.html',   // Update this
    });
    

    // Send back the session ID so the frontend can redirect
    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    res.status(500).send(`Error: ${error.message}`);
  }
});

/**
 * SUCCESS & CANCEL PAGES
 * (Assuming success.html and cancel.html are in the Public folder)
 */
app.get('/success', (req, res) => {
  console.log('Success page accessed');
  res.sendFile(path.join(__dirname, 'Public/success.html'));
});

app.get('/cancel', (req, res) => {
  console.log('Cancel page accessed');
  res.sendFile(path.join(__dirname, 'Public/cancel.html'));
});

/**
 * WEBHOOK ENDPOINT (from Stripe sample)
 */
app.post('/webhook', (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const checkoutSessionCompleted = event.data.object;
      // Here’s where you’d fulfill the order, update DB, send emails, etc.
      console.log('Checkout session completed:', checkoutSessionCompleted.id);
      break;
    }
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.expired':
      // Handle those if you need to
      console.log(`Unhandled checkout event type: ${event.type}`);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a 200 to acknowledge receipt of the event
  response.send();
});

/**
 * START THE SERVER
 */
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
