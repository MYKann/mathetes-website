console.log("JavaScript is connected!");

// Utility Functions
const getCart = () => JSON.parse(localStorage.getItem("cart")) || [];
const saveCart = (cart) => localStorage.setItem("cart", JSON.stringify(cart));
const updateCartCount = () => {
    const cart = getCart();
    const cartCount = document.getElementById("cart-count");
    if (cartCount) cartCount.innerText = cart.length;
};

// Cart Functions
const cartActions = {
    addItem: (name, price) => {
        const cart = getCart();
        const existingItemIndex = cart.findIndex(item => item.name === name);
        
        if (existingItemIndex !== -1) {
            // Update quantity if item exists
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push({ name, price: parseFloat(price), quantity: 1 });
        }

        saveCart(cart);
        updateCartCount();
        alert(`${name} added to cart!`);
    },

    displayCart: () => {
        const cartItemsContainer = document.getElementById("cart-items");
        const cartTotalContainer = document.getElementById("cart-total");
        const clearCartButton = document.getElementById("clear-cart");
        const cart = getCart();

        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = cart.length
                ? cart.map((item, index) => `<p>${item.name} - $${item.price.toFixed(2)} x ${item.quantity} <button class="remove-item" data-index="${index}">Remove</button></p>`).join('')
                : "<p>Your cart is empty.</p>";

            cartTotalContainer.innerText = cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
            cartActions.attachRemoveItemListeners();
        }

        if (clearCartButton) {
            clearCartButton.onclick = () => {
                localStorage.removeItem("cart");
                cartActions.displayCart();
                updateCartCount();
            };
        }
    },

    attachRemoveItemListeners: () => {
        document.querySelectorAll(".remove-item").forEach(button => {
            button.onclick = function () {
                const cart = getCart();
                cart.splice(this.dataset.index, 1);
                saveCart(cart);
                cartActions.displayCart();
                updateCartCount();
            };
        });
    }
};

// Checkout Functions
const handleCheckoutFormSubmission = () => {
    const checkoutForm = document.getElementById("checkout-form");
    if (!checkoutForm) return;

    checkoutForm.onsubmit = (event) => {
        event.preventDefault();
        const cart = getCart();
        if (!cart.length) return alert("Your cart is empty!");

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const address = document.getElementById("address").value.trim();
        const cardNumber = document.getElementById("card-number").value.trim();
        const expiry = document.getElementById("expiry").value.trim();
        const cvv = document.getElementById("cvv").value.trim();

        if (![name, email, address, cardNumber, expiry, cvv].every(Boolean)) return alert("Please fill all fields.");
        if (!/^\d{16}$/.test(cardNumber)) return alert("Invalid card number.");
        if (!/^\d{3}$/.test(cvv)) return alert("Invalid CVV.");
        if (!/^\d{2}\/\d{2}$/.test(expiry)) return alert("Invalid expiry format (MM/YY).");

        document.getElementById("loading-spinner").style.display = "block";

        setTimeout(() => {
            const orderDetails = {
                customer: { name, email, address },
                items: cart,
                total: parseFloat(document.getElementById("checkout-total").innerText),
                date: new Date().toISOString()
            };

            // Save order to database (mocked with localStorage here)
            const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
            orderHistory.push(orderDetails);
            localStorage.setItem("orderHistory", JSON.stringify(orderHistory));

            localStorage.removeItem("cart");
            window.location.href = "order-confirmation.html";
        }, 2000);
    };
};

// Paystack Integration
const payWithPaystack = () => {
    const email = document.getElementById("email").value.trim();
    const totalAmount = parseFloat(document.getElementById("checkout-total").innerText) * 100; // Convert to pesewas
    if (!email || totalAmount <= 0) return alert("Invalid payment details.");
    document.getElementById("loading-spinner").style.display = "block";

    PaystackPop.setup({
        key: "your-public-key-here", // Replace with backend fetched key
        email,
        amount: totalAmount,
        currency: "GHS",
        ref: "MAT-" + Math.floor(Math.random() * 1000000),
        callback: (response) => {
            alert("Payment Successful! Reference: " + response.reference);
            localStorage.removeItem("cart");
            window.location.href = "order-confirmation.html";
        },
        onClose: () => alert("Payment was not completed."),
    }).openIframe();
};

// Order History
const displayOrderHistory = () => {
    const orderHistoryContainer = document.getElementById("order-history");
    const orders = JSON.parse(localStorage.getItem("orderHistory")) || [];
    if (!orderHistoryContainer) return;
    orderHistoryContainer.innerHTML = orders.length
        ? orders.map(order => `<div><p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p><p><strong>Total:</strong> $${order.total.toFixed(2)}</p><hr></div>`).join('')
        : "<p>No past orders found.</p>";
};

// Initialize on Page Load
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".add-to-cart").forEach(button => {
        button.onclick = () => cartActions.addItem(button.dataset.name, button.dataset.price);
    });
    document.getElementById("paystack-btn")?.addEventListener("click", payWithPaystack);
    updateCartCount();
    cartActions.displayCart();
    handleCheckoutFormSubmission();
    displayOrderHistory();
});
