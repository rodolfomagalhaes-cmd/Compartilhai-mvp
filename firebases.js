<!-- Firebase SDKs -->
<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
  } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
  import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp
  } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

  // 🔐 CONFIGURAÇÃO FIREBASE (MANTIVE GENÉRICA — SEUS DADOS JÁ DEVEM ESTAR AQUI)
  const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_AUTH_DOMAIN",
    projectId: "SEU_PROJECT_ID",
    storageBucket: "SEU_STORAGE_BUCKET",
    messagingSenderId: "SEU_MESSAGING_ID",
    appId: "SEU_APP_ID"
  };

  // Inicializa Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  /* ==========================
     FIREBASE READY (CORRIGE ERRO)
     ========================== */
  window.waitFirebaseReady = () => {
    return Promise.resolve();
  };

  /* ==========================
     AUTH API
     ========================== */
  window.AuthAPI = {
    login: (email, password) =>
      signInWithEmailAndPassword(auth, email, password),

    logout: () => signOut(auth),

    onChange: (cb) => onAuthStateChanged(auth, cb)
  };

  /* ==========================
     ITEMS API
     ========================== */
  window.ItemsAPI = {
    async addItem(data) {
      await addDoc(collection(db, "items"), {
        ...data,
        createdAt: serverTimestamp()
      });
    },

    async getItems() {
      const q = query(
        collection(db, "items"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
  };
</script>
