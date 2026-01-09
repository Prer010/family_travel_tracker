// Hamburger Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const hamburgerMenu = document.getElementById('hamburgerMenu');
  const hamburgerClose = document.getElementById('hamburgerClose');
  
  // Open hamburger menu
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', function() {
      hamburgerMenu.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent body scroll
    });
  }
  
  // Close hamburger menu
  function closeMenu() {
    hamburgerMenu.classList.remove('active');
    document.body.style.overflow = ''; // Restore body scroll
  }
  
  if (hamburgerClose) {
    hamburgerClose.addEventListener('click', closeMenu);
  }
  
  // Close menu when clicking outside the menu content
  if (hamburgerMenu) {
    hamburgerMenu.addEventListener('click', function(e) {
      if (e.target === hamburgerMenu) {
        closeMenu();
      }
    });
  }
  
  // Close menu on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && hamburgerMenu.classList.contains('active')) {
      closeMenu();
    }
  });
});
