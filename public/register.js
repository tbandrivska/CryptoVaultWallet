document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();

    let username = document.getElementById('username').value;
    let email = document.getElementById('email').value;
    let phone = document.getElementById('phone').value;
    let password = document.getElementById('password').value;
    let confirmPassword = document.getElementById('confirmPassword').value;
    let messageBox = document.getElementById('messageBox');

    messageBox.className = "alert";
    
    let passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    
    if (password !== confirmPassword) {
        messageBox.classList.add('alert-error');
        messageBox.innerText = "Passwords do not match.";
        return;
    }

    if (!passwordRegex.test(password)) {
        messageBox.classList.add('alert-error');
        messageBox.innerText = "Password must be at least 8 characters with 1 uppercase and 1 number.";
        return;
    }

    let userData = {
        username: username,
        email: email,
        phoneNumber: phone,
        password: password
    };

    let serverURL = "http://localhost:3000/api/users/register"; 

    fetch(serverURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) { 
            messageBox.classList.add('alert-success');
            messageBox.innerText = "Account created successfully!";
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } else {
            messageBox.classList.add('alert-error');
            messageBox.innerText = data.message || "Registration failed on the server.";
        }
    })
    .catch(error => {
        messageBox.classList.add('alert-error');
        messageBox.innerText = "Could not connect to the server. Make sure the backend is running!";
        console.error("Fetch error:", error);
    });
});
