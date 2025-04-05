// api/create-checkout-session.js
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }
  
  console.log('Received request to create checkout session:', req.body);
  
  const { product } = req.body;
  // Map your products to their actual Stripe Price IDs
  const productPrices = {
    one_pair: 'price_1Qi6yw2Qdt70x3V6Oarrel3m',
    two_pairs: 'price_1QiL1f2Qdt70x3V6poSusOvl'
  };

  if (!productPrices[product]) {
    console.error('Invalid product selected:', product);
    return res.status(400).json({ error: 'Invalid product selected' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: productPrices[product],
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Use req.headers.origin so that it works in production (on Vercel)
      success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel.html`,
    });

    console.log('Checkout session created successfully:', session.id);
    return res.status(200).json({ id: session.id });
  } catch (err) {
    console.error('Error creating Checkout Session:', err);
    return res.status(500).json({ error: 'Failed to create Checkout Session' });
  }
};
