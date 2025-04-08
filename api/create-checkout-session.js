// WSO1/api/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Allow only POST requests.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { product } = req.body;
    
    // Map your product keys to their corresponding Stripe Price IDs.
    const productPrices = {
      '1-pair': 'price_1Qi6yw2Qdt70x3V6Oarrel3m',
      '2-pairs': 'price_1QiL1f2Qdt70x3V6poSusOvl'
    };

    // Validate the product selection.
    if (!productPrices[product]) {
      return res.status(400).json({ error: 'Invalid product selected' });
    }

    // Create a checkout session with Stripe.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: productPrices[product],
        quantity: 1,
      }],
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB']
      },
      mode: 'payment',
      // Dynamically set success and cancel URLs based on the request origin.
      success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel.html`,
    });

    return res.status(200).json({ id: session.id });
  } catch (err) {
    console.error('Error creating Checkout Session:', err);
    return res.status(500).json({ error: err.message });
  }
};
