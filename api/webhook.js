// api/webhook.js

import Stripe from 'stripe';
import getRawBody from 'raw-body';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Disable automatic body parsing so we can access the raw request body.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  let buf;
  try {
    buf = await getRawBody(req);
  } catch (err) {
    console.error('Error reading request body:', err);
    return res.status(500).send('Internal Server Error');
  }

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      console.log('Checkout session completed. Session ID:', session.id);
      console.log('Line Items:', lineItems.data);
      // Place your fulfillment logic here, e.g. updating orders, sending emails, etc.
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
    // For other event types, just acknowledge receipt.
    res.status(200).send('Event received');
  }
}
