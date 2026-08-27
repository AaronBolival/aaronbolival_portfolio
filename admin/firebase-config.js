import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgB3u4g28nmAYmoHX7AF-vjzqIGZu9dp4",
  authDomain: "portfolio-b581f.firebaseapp.com",
  databaseURL: "https://portfolio-b581f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "portfolio-b581f",
  storageBucket: "portfolio-b581f.firebasestorage.app",
  messagingSenderId: "581306962417",
  appId: "1:581306962417:web:da115e1dc4192ba6443450",
  measurementId: "G-LTTFKVJ06S"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
