// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Middleware to parse JSON for general endpoints
app.use(express.json());

// Middleware to parse raw body for webhook verification
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

/**
 * Create a Stripe Checkout Session using pre‑created price IDs.
 */
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { product } = req.body;

    // Map your products to their actual Stripe Price IDs
    const productPrices = {
      one_pair: 'price_1Qi6yw2Qdt70x3V6Oarrel3m',    // Replace with your live price ID
      two_pairs: 'price_1QiL1f2Qdt70x3V6poSusOvl'     // Replace with your live price ID
    };

    if (!productPrices[product]) {
      return res.status(400).json({ error: 'Invalid product selected' });
    }

    // Create the Checkout Session with dynamic success and cancel URLs
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: productPrices[product],
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel.html`,
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error('Error creating Checkout Session:', err);
    res.status(500).json({ error: 'Failed to create Checkout Session' });
  }
});

/**
 * Webhook to handle Stripe events.
 */
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      console.log('Checkout session completed. Session ID:', session.id);
      console.log('Line Items:', lineItems.data);
      // Fulfillment logic goes here

      res.status(200).send('Checkout session completed!');
    } catch (err) {
      console.error('Error retrieving line items:', err.message);
      res.status(500).send(`Error retrieving line items: ${err.message}`);
    }
  } else if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    console.log('Checkout session expired:', session.id);
    res.status(200).send('Checkout session expired.');
  } else {
    res.sendStatus(200);
  }
});

/**
 * Start the server.
 */
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
