import { auth, db } from '../../firebase.js';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Admin email(s) - add more emails here if needed
const ADMIN_EMAILS = ["admin@acesrscoe.com"];
const isAdminEmail = (email) => typeof email === 'string' && ADMIN_EMAILS.includes(email.toLowerCase());

// Login Handler — Admin Only
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('login-msg');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check admin by email
      if (isAdminEmail(user.email)) {
        // Auto-create admin doc in Firestore if it doesn't exist
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            name: user.displayName || "Admin",
            email: user.email,
            role: "admin",
            createdAt: new Date()
          });
        }

        msg.style.color = "#00ff88";
        msg.textContent = "Welcome, Admin! Redirecting...";
        setTimeout(() => window.location.href = 'admin.html', 1000);
      } else {
        await signOut(auth);
        msg.style.color = "#ff6b6b";
        msg.textContent = "Access Denied: You are not an admin.";
      }
    } catch (error) {
      msg.style.color = "#ff6b6b";
      if (error.code === 'auth/invalid-credential') {
        msg.textContent = "Invalid email or password.";
      } else {
        msg.textContent = error.message;
      }
    }
  });
}

// Redirect if already logged in as admin
onAuthStateChanged(auth, async (user) => {
  if (user && window.location.pathname.includes('login.html')) {
    if (isAdminEmail(user.email)) {
      window.location.href = 'admin.html';
    }
  }
});
