import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAhquETMotIDH3sR6rjgUah4Z6qUc3UVwg",
  authDomain: "presupuesto-c4520.firebaseapp.com",
  projectId: "presupuesto-c4520",
  storageBucket: "presupuesto-c4520.appspot.com",
  messagingSenderId: "1036352315256",
  appId: "1:1036352315256:web:d797799177ecef2627b28d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };