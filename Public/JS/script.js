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
      
      // Map product selection to Stripe Price IDs
      const productPrices = {
        '1-pair': 'price_1Qi6yw2Qdt70x3V6Oarrel3m',
        '2-pairs': 'price_1QiL1f2Qdt70x3V6poSusOvl'
      };
      
      const selectedProduct = selected.value;
      console.log('Selected product:', selectedProduct);
      
      checkoutButton.disabled = true;
      checkoutButton.textContent = 'Processing...';

      // Create Stripe checkout session directly on client side
      stripe.redirectToCheckout({
        lineItems: [{
          price: productPrices[selectedProduct],
          quantity: 1
        }],
        mode: 'payment',
        successUrl: window.location.origin + '/success.html',
        cancelUrl: window.location.origin + '/cancel.html',
        shippingAddressCollection: {
          allowedCountries: ['US', 'CA', 'GB']
        }
      }).then(function(result) {
        if (result.error) {
          console.error('Error in checkout process:', result.error);
          alert('There was an error: ' + result.error.message);
          checkoutButton.disabled = false;
          checkoutButton.textContent = 'Buy Now';
        }
      });
    });
  } else {
    console.error('Checkout button not found');
  }
});