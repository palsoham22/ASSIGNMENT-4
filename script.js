const EMAILJS_PUBLIC_KEY = 'tSOJmKzB0j27nrfYC';
const EMAILJS_SERVICE_ID = 'service_2s5f5ib';
const EMAILJS_TEMPLATE_ID = 'template_1m89jx9';
const EMAILJS_NEWSLETTER_TEMPLATE_ID = 'template_ncbnmu8';

function scrollToServices() {
    document.getElementById("services").scrollIntoView({ behavior: "smooth" });
}

let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    updateCartDisplay();
    setupEventListeners();
    updateBookNowFormState();

    if (typeof emailjs !== 'undefined') {
        try {
            emailjs.init(EMAILJS_PUBLIC_KEY);
            console.log('✅ EmailJS initialized');
        } catch (err) {
            console.warn('⚠ EmailJS init failed:', err);
        }
    } else {
        console.warn('⚠ EmailJS library not found. Add the EmailJS script in your HTML.');
    }
});

function setupEventListeners() {
    document.querySelectorAll('.service-button').forEach(button => {
        button.addEventListener('click', function () {
            const serviceItem = this.closest('.service-item');
            if (!serviceItem) return;
            const serviceId = serviceItem.dataset.id;
            const serviceName = serviceItem.dataset.name;
            const servicePrice = parseFloat(serviceItem.dataset.price);

            if (this.classList.contains('remove')) {
                removeFromCart(serviceId);
            } else {
                addToCart(serviceId, serviceName, servicePrice);
            }
        });
    });

    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmission);

        bookingForm.addEventListener('pointerdown', function (e) {
            if (cart.length !== 0) return; // only when cart is empty

            const clickedInsideInput = !!e.target.closest('input, .form-group, .form-row, label');
            if (clickedInsideInput) {
                const warning = document.getElementById('booknow-warning');
                if (!warning) return;

                warning.classList.add('active');

                if (bookingForm._warningTimeout) clearTimeout(bookingForm._warningTimeout);
                bookingForm._warningTimeout = setTimeout(() => {
                    warning.classList.remove('active');
                }, 3200);
            }
        });
    } else {
        console.warn('⚠ Booking form with id="booking-form" not found.');
    }

    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            subscribeNewsletter();
        });
    }
}

function addToCart(id, name, price) {
    if (!cart.find(item => item.id === id)) {
        cart.push({ id, name, price });
        updateCartDisplay();
        updateServiceButtons();
        updateBookNowFormState();
    }
}

function removeFromCart(id) {
    const index = cart.findIndex(item => item.id === id);
    if (index > -1) {
        cart.splice(index, 1);
        updateCartDisplay();
        updateServiceButtons();
        updateBookNowFormState();
    }
}

function updateServiceButtons() {
    document.querySelectorAll('.service-item').forEach(item => {
        const serviceId = item.dataset.id;
        const button = item.querySelector('.service-button');
        if (!button) return;
        const inCart = cart.some(c => c.id === serviceId);

        if (inCart) {
            button.textContent = 'Remove Item ⊖';
            button.className = 'service-button remove';
        } else {
            button.textContent = 'Add Item ⊕';
            button.className = 'service-button add';
        }
    });
}

function updateCartDisplay() {
    const cartTableBody = document.querySelector('.cart-table tbody');
    const totalPriceElement = document.querySelector('.total-price');
    const emptyCartElement = document.getElementById('empty-cart');
    const cartTable = document.getElementById('cart-table');

    if (!cartTableBody || !totalPriceElement) return;

    cartTableBody.innerHTML = '';

    if (cart.length === 0) {
        if (emptyCartElement) emptyCartElement.style.display = 'block';
        if (cartTable) cartTable.style.display = 'none';
        totalPriceElement.textContent = '₹0.00';
    } else {
        if (emptyCartElement) emptyCartElement.style.display = 'none';
        if (cartTable) cartTable.style.display = 'table';

        cart.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>₹${item.price.toFixed(2)}</td>
            `;
            cartTableBody.appendChild(row);
        });

        const total = cart.reduce((sum, i) => sum + i.price, 0);
        totalPriceElement.textContent = `₹${total.toFixed(2)}`;
    }
}

function updateBookNowFormState() {
    const bookForm = document.getElementById('booking-form');
    const bookButton = bookForm ? bookForm.querySelector('.book-button') : null;
    const inputs = bookForm ? bookForm.querySelectorAll('input') : [];
    const warning = document.getElementById('booknow-warning');
    if (!bookForm || !bookButton || !warning) return;

    if (cart.length === 0) {
        bookButton.disabled = true;
        inputs.forEach(input => input.disabled = true);
        warning.classList.remove('active');
    } else {
        bookButton.disabled = false;
        inputs.forEach(input => input.disabled = false);
        warning.classList.remove('active');
    }
}

async function handleBookingSubmission(e) {
    e.preventDefault();

    const fullNameEl = document.getElementById('full-name');
    const emailEl = document.getElementById('email');
    const phoneEl = document.getElementById('phone');

    if (!fullNameEl || !emailEl || !phoneEl) {
        alert('⚠ Booking form inputs not found. Check IDs.');
        return;
    }

    const fullName = fullNameEl.value.trim();
    const email = emailEl.value.trim();
    const phone = phoneEl.value.trim();

    if (!fullName || !email || !phone) {
        alert('⚠ Please fill in all required fields.');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('⚠ Invalid email address.');
        return;
    }

    if (phone.replace(/\D/g, '').length < 10) {
        alert('⚠ Invalid phone number.');
        return;
    }

    if (cart.length === 0) {
        alert('⚠ Please add services to your cart before booking.');
        return;
    }

    const bookButton = e.target.querySelector('.book-button');
    const originalText = bookButton ? bookButton.textContent : 'Book now';
    if (bookButton) {
        bookButton.disabled = true;
        bookButton.textContent = 'Processing...';
    }

    const bookingMessage = document.getElementById('booking-message');

    try {
        const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
        const cartItemsText = cart.map(item => `${item.name}: ₹${item.price.toFixed(2)}`).join(', ');

        if (typeof emailjs !== 'undefined') {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                to_email: email,
                to_name: fullName,
                cart_items: cartItemsText,
                total_amount: `₹${totalAmount.toFixed(2)}`,
                from_name: 'Laundry Services'
            });
            console.log('✅ Booking email sent to', email);
        } else {
            console.warn('⚠ EmailJS not loaded; skipping send.');
            await new Promise(res => setTimeout(res, 800));
        }

        if (bookingMessage) {
            bookingMessage.textContent = '✅ Email has been sent successfully!';
            bookingMessage.className = 'booking-message success';
            bookingMessage.style.display = 'block';
        }

        e.target.reset();
        cart = [];
        updateCartDisplay();
        updateServiceButtons();
        updateBookNowFormState();

        setTimeout(() => {
            if (bookingMessage) bookingMessage.style.display = 'none';
        }, 5000);

    } catch (err) {
        console.error('❌ Error while sending booking email:', err);
        if (bookingMessage) {
            bookingMessage.textContent = '❌ Booking failed. Please try again.';
            bookingMessage.className = 'booking-message error';
            bookingMessage.style.display = 'block';
        }
    } finally {
        if (bookButton) {
            bookButton.disabled = false;
            bookButton.textContent = originalText;
        }
    }
}

function subscribeNewsletter() {
    const nameEl = document.getElementById('newsletter-name');
    const emailEl = document.getElementById('newsletter-email');
    if (!nameEl || !emailEl) {
        alert('⚠ Newsletter inputs not found.');
        return;
    }

    const name = nameEl.value.trim();
    const email = emailEl.value.trim();

    if (!name || !email) {
        alert('⚠ Please fill in all fields.');
        return;
    }

    if (typeof emailjs !== 'undefined') {
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_NEWSLETTER_TEMPLATE_ID, {
            to_email: email,
            to_name: name,
            from_name: 'Laundry Services'
        }).then(() => {
            alert('✅ Successfully subscribed to newsletter!');
        }, (err) => {
            console.error('❌ Newsletter subscription failed:', err);
            alert('❌ Subscription failed. Please try again.');
        });
    } else {
        alert('✅ Successfully subscribed to newsletter!');
    }
    nameEl.value = '';
    emailEl.value = '';
}
