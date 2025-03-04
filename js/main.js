// Add dark mode toggle
const darkModeToggle = document.createElement('button');
darkModeToggle.innerHTML = '🌓';
darkModeToggle.className = 'fixed top-4 right-4 bg-gray-200 dark:bg-gray-600 p-2 rounded-full';
document.body.appendChild(darkModeToggle);

darkModeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});
