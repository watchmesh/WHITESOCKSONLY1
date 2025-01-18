/*****************************************************
 * server.js
 * 
 * 1) Install dependencies:
 *      npm install express stripe body-parser
 * 
 * 2) Replace the placeholders below:
 *    - 'YOUR_SECRET_KEY' with your Stripe secret key
 *    - 'whsec_...' with your webhook signing secret
 * 
 * 3) Start server:
 *      node server.js
 *****************************************************/

const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')('YOUR_SECRET_KEY'); 
// ^^^ Replace with your real secret key from the Stripe Dashboard

const app = express();

/**
 * 1) We parse JSON for /create-checkout-session
 *    so we can handle request bodies in JSON (if needed)
 */
app.use(express.json());

/**
 * 2) For the /webhook endpoint, Stripe needs the raw body
 *    (not JSON-parsed) to verify the signature.
 */
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

/**
 * 3) Create a Checkout Session with adjustable_quantity
 */
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],

      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Your Product',
            },
            unit_amount: 5000, // e.g. $50.00 in cents
          },
          // Enable adjustable quantity
          adjustable_quantity: {
            enabled: true,
            minimum: 1,
            maximum: 10,
          },
          quantity: 1,
        },
      ],

      mode: 'payment',
      success_url: 'https://your-site.com/success',
      cancel_url: 'https://your-site.com/cancel',
    });

    // Send the session ID back to the client
    res.json({ id: session.id });
  } catch (err) {
    console.error('Error creating Checkout Session:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * 4) Webhook endpoint to handle checkout.session.completed
 *    This is where you can fetch the *final* line items
 *    after the customer adjusts quantities during checkout.
 */

// Replace with the webhook signing secret you find in Stripe Dashboard
const endpointSecret = 'whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXX';

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
      // Retrieve final line items (quantity, etc.) after checkout completes
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

      // Fulfill the purchase in your own system
      // e.g., update DB, send confirmation emails, etc.
      console.log('Session ID:', session.id);
      console.log('Line Items:', lineItems);

      // Example of how you'd process them:
      // lineItems.data.forEach(item => {
      //   console.log('Item Description:', item.description);
      //   console.log('Quantity Purchased:', item.quantity);
      //   // Handle your inventory or order logic here...
      // });

      res.status(200).send('Checkout session completed!');
    } catch (err) {
      console.error('Error retrieving line items:', err.message);
      return res.status(400).send(`Error retrieving line items: ${err.message}`);
    }
  } else {
    // Return a 200 for all other event types to avoid retries
    res.sendStatus(200);
  }
});

/**
 * 5) Start the server
 */
app.listen(4242, () => {
  console.log('Server running on http://localhost:4242');
});
