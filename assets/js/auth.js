"use strict";

/* =========================================================
   GRADEFLOW AUTHENTICATION
   Complete JavaScript
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    /* =====================================================
       ELEMENTS
    ===================================================== */

    const authWrapper = document.querySelector(".auth-wrapper");

    const loginSwitch = document.getElementById("loginSwitch");
    const signupSwitch = document.getElementById("signupSwitch");

    const gotoSignup = document.getElementById("gotoSignup");
    const gotoLogin = document.getElementById("gotoLogin");

    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    const forgotPasswordButton =
        document.querySelector(".forgot-password");

    const forgotPasswordModal =
        document.getElementById("forgotPasswordModal");

    const closeForgotModal =
        document.getElementById("closeForgotModal");

    const backToLogin =
        document.getElementById("backToLogin");

    const forgotPasswordForm =
        document.getElementById("forgotPasswordForm");
    const otpSection =
        document.getElementById("otpSection");

    const passwordResetSection =
        document.getElementById("passwordResetSection");

    const forgotEmail =
        document.getElementById("forgotEmail");

    const otpCode =
        document.getElementById("otpCode");

    const newPassword =
        document.getElementById("newPassword");

    const confirmNewPassword =
        document.getElementById("confirmNewPassword");

    let forgotPasswordStep = 1;

    let generatedOTP = "";

    const loadingOverlay =
        document.getElementById("loadingOverlay");

    const authToast =
        document.getElementById("authToast");

    const toastTitle =
        document.getElementById("toastTitle");

    const toastMessage =
        document.getElementById("toastMessage");

    const closeToast =
        document.getElementById("closeToast");

    const passwordToggleButtons =
        document.querySelectorAll(".password-toggle");

    /* =====================================================
       STORAGE KEYS
    ===================================================== */

    const STORAGE_KEYS = {
        users: "gradeflow_users",
        currentUser: "gradeflow_current_user",
        rememberEmail: "gradeflow_remember_email"
    };

    let toastTimer = null;
    let switchingTimer = null;

    /* =====================================================
       UTILITY FUNCTIONS
    ===================================================== */

    function getUsers() {
        try {
            const storedUsers = localStorage.getItem(
                STORAGE_KEYS.users
            );

            const parsedUsers = storedUsers
                ? JSON.parse(storedUsers)
                : [];

            return Array.isArray(parsedUsers)
                ? parsedUsers
                : [];
        } catch (error) {
            console.error(
                "Could not read users from localStorage:",
                error
            );

            return [];
        }
    }

    function saveUsers(users) {
        try {
            localStorage.setItem(
                STORAGE_KEYS.users,
                JSON.stringify(users)
            );

            return true;
        } catch (error) {
            console.error(
                "Could not save users:",
                error
            );

            showToast(
                "Storage Error",
                "Account data could not be saved.",
                "error"
            );

            return false;
        }
    }

    function normalizeEmail(email) {
        return email.trim().toLowerCase();
    }

    function createUserId() {
        if (
            window.crypto &&
            typeof window.crypto.randomUUID === "function"
        ) {
            return window.crypto.randomUUID();
        }

        return `user-${Date.now()}-${Math.random()
            .toString(16)
            .slice(2)}`;
    }

    function escapeText(value) {
        return String(value).trim();
    }

    function isValidEmail(email) {
        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        return emailPattern.test(email);
    }

    function isValidName(name) {
        return name.trim().length >= 3;
    }

    function isValidPassword(password) {
        return password.length >= 6;
    }

    /* =====================================================
       PAGE SWITCHING
    ===================================================== */

    function startSwitchingAnimation() {
        authWrapper.classList.add("is-switching");

        window.clearTimeout(switchingTimer);

        switchingTimer = window.setTimeout(() => {
            authWrapper.classList.remove("is-switching");
        }, 450);
    }

    function showLogin() {
        startSwitchingAnimation();

        authWrapper.classList.remove("signup-mode");

        loginSwitch.classList.add("active");
        signupSwitch.classList.remove("active");

        loginForm.classList.add("active");
        signupForm.classList.remove("active");

        loginForm.setAttribute("aria-hidden", "false");
        signupForm.setAttribute("aria-hidden", "true");

        clearFormErrors(loginForm);
        clearFormErrors(signupForm);

        window.setTimeout(() => {
            document
                .getElementById("loginEmail")
                ?.focus();
        }, 460);
    }

    function showSignup() {
        startSwitchingAnimation();

        authWrapper.classList.add("signup-mode");

        signupSwitch.classList.add("active");
        loginSwitch.classList.remove("active");

        signupForm.classList.add("active");
        loginForm.classList.remove("active");

        signupForm.setAttribute("aria-hidden", "false");
        loginForm.setAttribute("aria-hidden", "true");

        clearFormErrors(loginForm);
        clearFormErrors(signupForm);

        window.setTimeout(() => {
            document
                .getElementById("signupName")
                ?.focus();
        }, 460);
    }

    loginSwitch.addEventListener("click", showLogin);
    signupSwitch.addEventListener("click", showSignup);

    gotoSignup.addEventListener("click", showSignup);
    gotoLogin.addEventListener("click", showLogin);

    /* =====================================================
       PASSWORD VISIBILITY
    ===================================================== */

    passwordToggleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const inputBox = button.closest(".input-box");
            const passwordInput =
                inputBox?.querySelector("input");

            if (!passwordInput) {
                return;
            }

            const isPassword =
                passwordInput.type === "password";

            passwordInput.type =
                isPassword ? "text" : "password";

            button.innerHTML = isPassword
                ? '<i data-lucide="eye-off"></i>'
                : '<i data-lucide="eye"></i>';

            button.setAttribute(
                "aria-label",
                isPassword
                    ? "Hide password"
                    : "Show password"
            );

            refreshIcons();
            passwordInput.focus();
        });
    });

    /* =====================================================
       FORM ERROR HANDLING
    ===================================================== */

    function showFieldError(input, message) {
        const inputGroup =
            input.closest(".input-group");

        if (!inputGroup) {
            return;
        }

        inputGroup.classList.add("error");

        let errorElement =
            inputGroup.querySelector(".input-error");

        if (!errorElement) {
            errorElement =
                document.createElement("small");

            errorElement.className = "input-error";
            inputGroup.appendChild(errorElement);
        }

        errorElement.textContent = message;

        input.setAttribute("aria-invalid", "true");
    }

    function clearFieldError(input) {
        const inputGroup =
            input.closest(".input-group");

        if (!inputGroup) {
            return;
        }

        inputGroup.classList.remove("error");

        const errorElement =
            inputGroup.querySelector(".input-error");

        errorElement?.remove();

        input.removeAttribute("aria-invalid");
    }

    function clearFormErrors(form) {
        const inputs = form.querySelectorAll("input");

        inputs.forEach((input) => {
            clearFieldError(input);
        });
    }

    document
        .querySelectorAll(".auth-form input, #forgotPasswordForm input")
        .forEach((input) => {
            input.addEventListener("input", () => {
                clearFieldError(input);
            });
        });

    /* =====================================================
       LOADING
    ===================================================== */

    function showLoading(message = "Processing your request...") {
        const loadingText =
            loadingOverlay.querySelector("p");

        if (loadingText) {
            loadingText.textContent = message;
        }

        loadingOverlay.classList.add("active");
        loadingOverlay.setAttribute("aria-hidden", "false");
    }

    function hideLoading() {
        loadingOverlay.classList.remove("active");
        loadingOverlay.setAttribute("aria-hidden", "true");
    }

    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(
        title,
        message,
        type = "success",
        duration = 3500
    ) {
        window.clearTimeout(toastTimer);

        toastTitle.textContent = title;
        toastMessage.textContent = message;

        authToast.classList.remove("error");

        const toastIcon =
            authToast.querySelector(".toast-icon");

        if (type === "error") {
            authToast.classList.add("error");

            toastIcon.innerHTML =
                '<i data-lucide="circle-alert"></i>';
        } else {
            toastIcon.innerHTML =
                '<i data-lucide="circle-check"></i>';
        }

        authToast.classList.add("active");

        refreshIcons();

        toastTimer = window.setTimeout(() => {
            hideToast();
        }, duration);
    }

    function hideToast() {
        authToast.classList.remove("active");
        window.clearTimeout(toastTimer);
    }

    closeToast.addEventListener("click", hideToast);

    /* =====================================================
       LOGIN
    ===================================================== */

    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        clearFormErrors(loginForm);

        const emailInput =
            document.getElementById("loginEmail");

        const passwordInput =
            document.getElementById("loginPassword");

        const rememberMe =
            document.getElementById("rememberMe");

        const email =
            normalizeEmail(emailInput.value);

        const password =
            passwordInput.value;

        let isValid = true;

        if (!email) {
            showFieldError(
                emailInput,
                "Email address is required."
            );

            isValid = false;
        } else if (!isValidEmail(email)) {
            showFieldError(
                emailInput,
                "Enter a valid email address."
            );

            isValid = false;
        }

        if (!password) {
            showFieldError(
                passwordInput,
                "Password is required."
            );

            isValid = false;
        }

        if (!isValid) {
            showToast(
                "Login Failed",
                "Please correct the highlighted fields.",
                "error"
            );

            return;
        }

        showLoading("Signing in to GradeFlow...");

        window.setTimeout(() => {
            const users = getUsers();

            const matchedUser = users.find((user) => {
                return (
                    user.email === email &&
                    user.password === password
                );
            });

            if (!matchedUser) {
                hideLoading();

                showFieldError(
                    emailInput,
                    "Email or password is incorrect."
                );

                showFieldError(
                    passwordInput,
                    "Email or password is incorrect."
                );

                showToast(
                    "Login Failed",
                    "Incorrect email address or password.",
                    "error"
                );

                return;
            }

            const sessionUser = {
                id: matchedUser.id,
                name: matchedUser.name,
                email: matchedUser.email,
                role: matchedUser.role,
                loginAt: new Date().toISOString()
            };

            localStorage.setItem(
                STORAGE_KEYS.currentUser,
                JSON.stringify(sessionUser)
            );

            if (rememberMe.checked) {
                localStorage.setItem(
                    STORAGE_KEYS.rememberEmail,
                    email
                );
            } else {
                localStorage.removeItem(
                    STORAGE_KEYS.rememberEmail
                );
            }

            hideLoading();

            showToast(
                `Welcome Back, ${matchedUser.name}! 👋`,
                "Great to see you again. Redirecting to your dashboard..."
            );

            loginForm.reset();

            window.setTimeout(() => {


                window.location.href =
                    "../dashboard/index.html";
            }, 900);
        }, 700);
    });


    /* =====================================================
       SIGNUP
    ===================================================== */

    signupForm.addEventListener("submit", (event) => {
        event.preventDefault();

        clearFormErrors(signupForm);

        const nameInput =
            document.getElementById("signupName");

        const emailInput =
            document.getElementById("signupEmail");

        const passwordInput =
            document.getElementById("signupPassword");

        const confirmPasswordInput =
            document.getElementById("confirmPassword");

        const acceptTerms =
            document.getElementById("acceptTerms");

        const name =
            escapeText(nameInput.value);

        const email =
            normalizeEmail(emailInput.value);

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;

        let isValid = true;

        if (!name) {
            showFieldError(
                nameInput,
                "Full name is required."
            );

            isValid = false;
        } else if (!isValidName(name)) {
            showFieldError(
                nameInput,
                "Name must contain at least 3 characters."
            );

            isValid = false;
        }

        if (!email) {
            showFieldError(
                emailInput,
                "Email address is required."
            );

            isValid = false;
        } else if (!isValidEmail(email)) {
            showFieldError(
                emailInput,
                "Enter a valid email address."
            );

            isValid = false;
        }

        if (!password) {
            showFieldError(
                passwordInput,
                "Password is required."
            );

            isValid = false;
        } else if (!isValidPassword(password)) {
            showFieldError(
                passwordInput,
                "Password must contain at least 6 characters."
            );

            isValid = false;
        }

        if (!confirmPassword) {
            showFieldError(
                confirmPasswordInput,
                "Please confirm your password."
            );

            isValid = false;
        } else if (password !== confirmPassword) {
            showFieldError(
                confirmPasswordInput,
                "Passwords do not match."
            );

            isValid = false;
        }

        if (!acceptTerms.checked) {
            showToast(
                "Terms Required",
                "You must accept the Terms and Privacy Policy.",
                "error"
            );

            isValid = false;
        }

        if (!isValid) {
            if (acceptTerms.checked) {
                showToast(
                    "Account Not Created",
                    "Please correct the highlighted fields.",
                    "error"
                );
            }

            return;
        }

        const users = getUsers();

        const emailAlreadyExists =
            users.some((user) => {
                return user.email === email;
            });

        if (emailAlreadyExists) {
            showFieldError(
                emailInput,
                "An account already exists with this email."
            );

            showToast(
                "Email Already Registered",
                "Use another email or sign in to your account.",
                "error"
            );

            return;
        }

        showLoading("Creating your GradeFlow account...");

        window.setTimeout(() => {
            const newUser = {
                id: createUserId(),
                name,
                email,
                password,

                /*
                   Future backend mein role aur status database
                   se control kiye ja sakte hain.
                */

                role: "teacher",
                status: "pending",
                createdAt: new Date().toISOString()
            };
            localStorage.setItem(
                "gradeflow_last_user",
                JSON.stringify(newUser)
            );

            users.push(newUser);

            const saved = saveUsers(users);

            hideLoading();

            if (!saved) {
                return;
            }

            showToast(
                "Account Created",
                "Your teacher account has been created successfully."
            );
            loadLastUser();

            signupForm.reset();

            document.getElementById("loginEmail").value =
                email;

            window.setTimeout(() => {
                showLogin();

                document
                    .getElementById("loginPassword")
                    ?.focus();
            }, 750);
        }, 700);
    });

    /* =====================================================
       FORGOT PASSWORD MODAL
    ===================================================== */

    function openForgotModal() {
        forgotPasswordModal.classList.add("active");

        forgotPasswordModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow = "hidden";

        const loginEmail =
            document.getElementById("loginEmail").value;

        const forgotEmail =
            document.getElementById("forgotEmail");

        if (loginEmail.trim()) {
            forgotEmail.value =
                normalizeEmail(loginEmail);
        }

        window.setTimeout(() => {
            forgotEmail.focus();
        }, 250);
    }

    function closeForgotPasswordModal() {
        forgotPasswordModal.classList.remove("active");

        forgotPasswordModal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow = "";

        forgotPasswordForm.reset();
        clearFormErrors(forgotPasswordForm);
    }

    forgotPasswordButton.addEventListener(
        "click",
        openForgotModal
    );

    closeForgotModal.addEventListener(
        "click",
        closeForgotPasswordModal
    );

    backToLogin.addEventListener(
        "click",
        closeForgotPasswordModal
    );

    forgotPasswordModal.addEventListener(
        "click",
        (event) => {
            if (event.target === forgotPasswordModal) {
                closeForgotPasswordModal();
            }
        }
    );

    forgotPasswordForm.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();
            /* ==========================================
   STEP 2 : VERIFY OTP
========================================== */

            if (forgotPasswordStep === 2) {

                if (otpCode.value.trim() !== generatedOTP) {

                    showFieldError(
                        otpCode,
                        "Invalid verification code."
                    );

                    showToast(
                        "Invalid OTP",
                        "Please enter the correct verification code.",
                        "error"
                    );

                    return;
                }
                /* ==========================================
   STEP 3 : UPDATE PASSWORD
========================================== */

                if (forgotPasswordStep === 3) {

                    if (!newPassword.value.trim()) {

                        showFieldError(
                            newPassword,
                            "Enter your new password."
                        );

                        return;
                    }

                    if (newPassword.value.length < 6) {

                        showFieldError(
                            newPassword,
                            "Password must contain at least 6 characters."
                        );

                        return;
                    }

                    if (newPassword.value !== confirmNewPassword.value) {

                        showFieldError(
                            confirmNewPassword,
                            "Passwords do not match."
                        );

                        return;
                    }

                    const users = getUsers();

                    const userIndex = users.findIndex((user) => {
                        return user.email === normalizeEmail(forgotEmail.value);
                    });

                    if (userIndex === -1) {
                        return;
                    }

                    users[userIndex].password = newPassword.value;

                    localStorage.setItem(
                        STORAGE_KEYS.users,
                        JSON.stringify(users)
                    );

                    showToast(
                        "Password Updated",
                        "Your password has been changed successfully."
                    );

                    closeForgotPasswordModal();

                    forgotPasswordForm.reset();

                    forgotPasswordStep = 1;

                    otpSection.classList.add("hidden");

                    passwordResetSection.classList.add("hidden");

                    forgotEmail.disabled = false;

                    return;
                }

                forgotPasswordStep = 3;

                otpSection.classList.add("hidden");

                passwordResetSection.classList.remove("hidden");

                showToast(
                    "OTP Verified",
                    "Create your new password."
                );

                return;
            }

            clearFormErrors(forgotPasswordForm);

            const emailInput =
                document.getElementById("forgotEmail");

            const email =
                normalizeEmail(emailInput.value);

            if (!email) {
                showFieldError(
                    emailInput,
                    "Email address is required."
                );

                return;
            }

            if (!isValidEmail(email)) {
                showFieldError(
                    emailInput,
                    "Enter a valid email address."
                );

                return;
            }

            showLoading("Checking your account...");

            window.setTimeout(() => {
                const users = getUsers();

                const userExists =
                    users.some((user) => {
                        return user.email === email;
                    });

                hideLoading();

                if (!userExists) {
                    showFieldError(
                        emailInput,
                        "No account was found with this email."
                    );

                    showToast(
                        "Account Not Found",
                        "No GradeFlow account uses this email.",
                        "error"
                    );

                    return;
                }
                generatedOTP = Math.floor(
                    100000 + Math.random() * 900000
                ).toString();

                console.log("Your OTP:", generatedOTP);

                forgotPasswordStep = 2;

                forgotEmail.disabled = true;

                otpSection.classList.remove("hidden");

                showToast(
                    "Verification Code Sent",
                    "A 6-digit verification code has been generated."
                );


            }, 650);
        }
    );

    /* =====================================================
       KEYBOARD ACCESSIBILITY
    ===================================================== */

    document.addEventListener("keydown", (event) => {
        if (
            event.key === "Escape" &&
            forgotPasswordModal.classList.contains("active")
        ) {
            closeForgotPasswordModal();
        }
    });

    /* =====================================================
       REMEMBERED EMAIL
    ===================================================== */

    function loadRememberedEmail() {
        const rememberedEmail =
            localStorage.getItem(
                STORAGE_KEYS.rememberEmail
            );

        if (!rememberedEmail) {
            return;
        }

        const loginEmail =
            document.getElementById("loginEmail");

        const rememberMe =
            document.getElementById("rememberMe");

        loginEmail.value = rememberedEmail;
        rememberMe.checked = true;
    }

    /* =====================================================
       ICON REFRESH
    ===================================================== */

    function refreshIcons() {
        if (
            window.lucide &&
            typeof window.lucide.createIcons === "function"
        ) {
            window.lucide.createIcons();
        }
    }

    /* =====================================================
       INITIAL STATE
    ===================================================== */
    function loadLastUser() {


        const authTitle = document.getElementById("authTitle");
        const authDescription = document.getElementById("authDescription");

        const lastUser = JSON.parse(
            localStorage.getItem("gradeflow_last_user")
        );

        if (!lastUser) {
            return;
        }

        authTitle.textContent = `Welcome Back, ${lastUser.name}! 👋`;

        authDescription.textContent =
            "Your GradeFlow workspace is ready. Sign in to continue where you left off and manage your students with confidence.";
    }
    function initializeAuthPage() {
        loginForm.setAttribute(
            "aria-hidden",
            "false"
        );

        signupForm.setAttribute(
            "aria-hidden",
            "true"
        );

        forgotPasswordModal.setAttribute(
            "aria-hidden",
            "true"
        );

        loadingOverlay.setAttribute(
            "aria-hidden",
            "true"
        );

        loadRememberedEmail();
        loadLastUser();
        refreshIcons();
    }

    initializeAuthPage();
});