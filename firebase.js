import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDKtmy1nAmtidzDjkCpxflvp4hpjlHf9eU",
    authDomain: "aceswebsite.firebaseapp.com",
    projectId: "aceswebsite",
    storageBucket: "aceswebsite.firebasestorage.app",
    messagingSenderId: "220508792496",
    appId: "1:220508792496:web:8abe967ad07f27aa873d75",
    measurementId: "G-0BP6QE745Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, app };
