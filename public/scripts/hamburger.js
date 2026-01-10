// Hamburger Menu Functionality
document.addEventListener('DOMContentLoaded', function () {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const hamburgerMenu = document.getElementById('hamburgerMenu');
  const hamburgerClose = document.getElementById('hamburgerClose');

  // Open hamburger menu
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', function () {
      hamburgerMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  // Close hamburger menu
  function closeMenu() {
    hamburgerMenu.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (hamburgerClose) {
    hamburgerClose.addEventListener('click', closeMenu);
  }

  if (hamburgerMenu) {
    hamburgerMenu.addEventListener('click', function (e) {
      if (e.target === hamburgerMenu) {
        closeMenu();
      }
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && hamburgerMenu.classList.contains('active')) {
      closeMenu();
    }
  });
});