// Initialize Stripe with your live publishable key
const stripe = Stripe('pk_live_51KgsET2Qdt70x3V6rzTceZ77TfVvmPw0dNg5eDKy63atVITYYUBzGzuYbq29jfZ9DUxSWimtM7K61hdJ3CucWKKb00W7VCuZZp');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded, initializing Stripe checkout...');
  const checkoutButton = document.getElementById('checkout-button');

  if (checkoutButton) {
    console.log('Checkout button found, adding event listener...');
    checkoutButton.addEventListener('click', () => {
      console.log('Checkout button clicked');
      const selected = document.querySelector('input[name="product"]:checked');
      if (!selected) {
        alert('Please select a product option');
        return;
      }
      const selectedProduct = selected.value;
      console.log('Selected product:', selectedProduct);
      checkoutButton.disabled = true;
      checkoutButton.textContent = 'Processing...';

      console.log('Sending request to backend endpoint...');
      fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: selectedProduct }),
      })
      .then(response => {
        console.log('Response status:', response.status);
        return response.text();
      })
      .then(text => {
        console.log('Raw response:', text);
        try {
          return JSON.parse(text);
        } catch (err) {
          throw new Error('Invalid JSON returned: ' + text);
        }
      })
      .then(session => {
        console.log('Session created, redirecting to Stripe checkout...');
        return stripe.redirectToCheckout({ sessionId: session.id });
      })
      .catch(error => {
        console.error('Error in checkout process:', error);
        alert('There was an error: ' + error.message);
        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Buy Now';
      });
    });
  } else {
    console.error('Checkout button not found');
  }
});
