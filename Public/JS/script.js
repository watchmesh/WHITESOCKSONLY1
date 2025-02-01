// Initialize Stripe
const stripe = Stripe('pk_live_51KgsET2Qdt70x3V6rzTceZ77TfVvmPw0dNg5eDKy63atVITYYUBzGzuYbq29jfZ9DUxSWimtM7K61hdJ3CucWKKb00W7VCuZZp');

// Listen for the Buy Now button click
document.getElementById('checkout-button').addEventListener('click', () => {
  // Get the selected product value
  const selectedProduct = document.querySelector('input[name="product"]:checked').value;
document.getElementById('checkout-button').addEventListener('click', () => {
  const selected = document.querySelector('input[name="product"]:checked');
  if (!selected) {
    alert('Please select a product option');
    return;
  }
  // Fetch the Checkout Session from the backend
  fetch('/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ product: selectedProduct }), // Send selected product to backend
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      return response.json();
    })
    .then(session => {
      // Redirect to Stripe Checkout
      return stripe.redirectToCheckout({ sessionId: session.id });
    })
    .catch(error => {
      console.error('Error:', error);
      alert('There was an error. Please try again.');
    });
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https://*.stripe.com;"
  );
  next();
  });    
});
