// api/webhook.js
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }
  
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
      return res.status(200).send('Checkout session completed!');
    } catch (err) {
      console.error('Error retrieving line items:', err.message);
      return res.status(500).send(`Error retrieving line items: ${err.message}`);
    }
  } else if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    console.log('Checkout session expired:', session.id);
    return res.status(200).send('Checkout session expired.');
  } else {
    return res.sendStatus(200);
  }
};
