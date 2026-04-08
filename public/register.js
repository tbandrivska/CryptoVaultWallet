class User {
    constructor(email, phoneNumber, password) {
        this.userId = Math.floor(Math.random() * 10000);
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.hashedPassword = btoa(password);
        this.createdAt = new Date().toISOString();
        this.mfaEnabled = false;
        this.mfaSecret = "";
        this.role = "Customer";
    }
}

class UserRegistry {
    constructor() {
        this.userList = [];
        this.userList.push(new User("test@example.com", "07700900000", "Password123"));
    }

    registerNewUser(email, phoneNumber, password) {
        let emailTaken = false;
        for (let i = 0; i < this.userList.length; i++) {
            if (this.userList[i].email === email) {
                emailTaken = true;
                break;
            }
        }

        if (emailTaken) {
            return { success: false, message: "Email is already registered." };
        }

        let newUser = new User(email, phoneNumber, password);
        this.userList.push(newUser);
        
        console.log("Database Mock Updated:", this.userList);
        return { success: true, message: "Account created successfully!" };
    }
}

const registry = new UserRegistry();

document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();

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

    let result = registry.registerNewUser(email, phone, password);

    if (result.success) {
        messageBox.classList.add('alert-success');
        messageBox.innerText = result.message;
        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);
    } else {
        messageBox.classList.add('alert-error');
        messageBox.innerText = result.message;
    }
});
