const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Use your Stripe secret key from .env
require('dotenv').config(); // Load .env variables for local development

const app = express();

// Middleware to parse JSON for general endpoints
app.use(express.json());

// Middleware to parse raw body for webhook verification
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

/**
 * Create a Stripe Checkout Session
 */
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    // Retrieve product details from request body
    const { product } = req.body;

    // Define product prices and details
    const products = {
      one_pair: { name: '1 Pair of Socks', price: 600 },   // £6 in pence
      seven_pairs: { name: '7 Pairs of Socks', price: 1000 } // £10 in pence
    };

    // Validate product
    if (!products[product]) {
      return res.status(400).json({ error: 'Invalid product selected' });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: products[product].name,
            },
            unit_amount: products[product].price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://whitesocksonly-1.vercel.app/success.html', // Redirect after success
      cancel_url: 'https://whitesocksonly-1.vercel.app/cancel.html',   // Redirect after cancel
    });

    // Send the session ID to the client
    res.json({ id: session.id });
  } catch (err) {
    console.error('Error creating Checkout Session:', err);
    res.status(500).json({ error: 'Failed to create Checkout Session' });
  }
});

/**
 * Webhook to handle Stripe events
 */
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Use your Webhook Secret from .env

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Retrieve final line items after checkout completes
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

      console.log('Session ID:', session.id);
      console.log('Line Items:', lineItems.data);

      // Example: Handle fulfillment logic (e.g., update database)
      lineItems.data.forEach(item => {
        console.log('Item:', item.description, 'Quantity:', item.quantity);
        // Add your inventory/order management logic here
      });

      res.status(200).send('Checkout session completed!');
    } catch (err) {
      console.error('Error retrieving line items:', err.message);
      res.status(500).send(`Error retrieving line items: ${err.message}`);
    }
  } else if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    console.log('Checkout session expired:', session.id);
    // Optionally, implement additional logic for expired sessions here
    res.status(200).send('Checkout session expired.');
  } else {
    // Return 200 for unhandled event types to avoid Stripe retries
    res.sendStatus(200);
  }
});

/**
 * Start the server
 */
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
