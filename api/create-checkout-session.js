const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Secure Stripe key

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { product } = req.body;

    // Define product prices
    const products = {
      one_pair: { name: '1 Pair of Socks', price: 600 },   // £6 in pence
      two_pairs: { name: '2 Pairs of Socks', price: 1000 },  // £10 in pence
    };

    if (!products[product]) {
      return res.status(400).json({ error: 'Invalid product' });
    }

    // Create Stripe Checkout session
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
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cancel.html`,
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
