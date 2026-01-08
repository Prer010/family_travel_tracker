// GSAP Animations for Modals

/**
 * Animate edit modal entrance
 */
function animateEditModal() {
    gsap.from('#editModal .modal-content', {
        y: 40,
        opacity: 0,
        duration: 1.0,
        ease: 'power3.out'
    });
}

/**
 * Animate rename modal entrance
 */
function animateRenameModal() {
    gsap.from('#renameModal .modal-content', {
        y: 40,
        opacity: 0,
        duration: 1.0,
        ease: 'power3.out'
    });
}
