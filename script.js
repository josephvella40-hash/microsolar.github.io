function switchTab(tabId, event) {
    // Hide all tab contents
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    // Deactivate all tabs
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Show the selected tab content
    document.getElementById(tabId).classList.add('active');

    // Activate the selected tab button
    if (event && event.currentTarget) {
        // If coming from a nav tab
        if (event.currentTarget.classList.contains('nav-tab')) {
            event.currentTarget.classList.add('active');
        } else {
            // Find the corresponding nav tab
            const targetTab = Array.from(tabs).find(t => t.innerText.toLowerCase().includes(tabId.toLowerCase()));
            if (targetTab) targetTab.classList.add('active');
        }
    } else {
        // Find the corresponding nav tab by text or id
        const targetTab = Array.from(tabs).find(t => t.getAttribute('onclick').includes(tabId));
        if (targetTab) targetTab.classList.add('active');
    }
}

function runCalculation() {
    const billInput = document.getElementById('monthly-bill');
    const bill = parseFloat(billInput.value);
    const resultsArea = document.getElementById('results-area');
    const resultText = document.getElementById('result-text');

    if (isNaN(bill) || bill <= 0) {
        alert("Please enter a valid monthly bill amount.");
        return;
    }

    // Logic: Yearly savings approx 25% of annual bill for a standard balcony system in Malta
    const yearlySavings = (bill * 12) * 0.25;
    
    resultText.innerText = `Estimated Yearly Savings: €${yearlySavings.toFixed(2)}`;
    resultsArea.style.display = "block";
    
    // Smooth scroll to results
    resultsArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function submitForm() {
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const message = document.getElementById('contact-message').value;
    const feedback = document.getElementById('form-feedback');

    if (!name || !email || !message) {
        feedback.innerText = "Please fill in all required fields.";
        feedback.className = "feedback error";
        return;
    }

    if (!validateEmail(email)) {
        feedback.innerText = "Please enter a valid email address.";
        feedback.className = "feedback error";
        return;
    }

    // Simulate submission
    feedback.innerText = "Sending...";
    feedback.className = "feedback";

    setTimeout(() => {
        feedback.innerText = "Thank you! We'll be in touch shortly.";
        feedback.className = "feedback success";
        
        // Clear form
        document.getElementById('contact-name').value = '';
        document.getElementById('contact-email').value = '';
        document.getElementById('contact-message').value = '';
    }, 1500);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Background Animation (Slow zoom)
window.onload = () => {
    const bg = document.querySelector('.background-image');
    if (bg) {
        bg.style.transform = "scale(1.1)";
    }
};
