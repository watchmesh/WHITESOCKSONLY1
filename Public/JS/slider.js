// slider.js
document.addEventListener('DOMContentLoaded', () => {
    // Select necessary DOM elements
    const sliderImages = document.querySelector('.slider-images'); 
    const slides = document.querySelectorAll('.slide'); 
    const prev = document.getElementById('prev'); 
    const next = document.getElementById('next');
    
  
    let currentIndex = 0; // Current active slide
  
    // Function to update the slider's position
    function updateSlider() {
      sliderImages.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
  
    // Event listener for "Previous" button
    prev.addEventListener('click', () => {
      currentIndex--;
      if (currentIndex < 0) {
        currentIndex = slides.length - 1; // Wrap around to the last slide
      }
      updateSlider();
    });
  
    // Event listener for "Next" button
    next.addEventListener('click', () => {
      currentIndex++;
      if (currentIndex >= slides.length) {
        currentIndex = 0; // Wrap around to the first slide
      }
      updateSlider();
    });
  
    // Optional logs to confirm the slider found your elements
    console.log('Slider initialized');
    console.log('Number of slides:', slides.length);
  
    // Initialize the position (starts at slide 0)
    updateSlider();
  });
  