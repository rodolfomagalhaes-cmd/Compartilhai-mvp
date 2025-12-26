// firebases.js — Firebase compat (HTML puro)
// MVP SEM FOTO (não usa Storage). + waitFirebaseReady() para evitar travar as telas.

const firebaseConfig = {
  apiKey: "AIzaSyCUPov_9w1wa1sg-an76PEexvKnoqMijo0",
  authDomain: "compartilhai-mvp.firebaseapp.com",
  projectId: "compartilhai-mvp",
  storageBucket: "compartilhai-mvp.firebasestorage.app",
  messagingSenderId: "327553407150",
  appId: "1:327553407150:web:88e2c9c05ac681948a353f"
};

window.__FIREBASE_READY__ = false;

// ✅ Função que o seu HTML está tentando chamar
window.waitFirebaseReady = function waitFirebaseReady(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const t = setInterval(() => {
      if (window.__FIREBASE_READY__ === true) {
        clearInterval(t);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(t);
        reject(new Error("Firebase não ficou pronto a tempo (timeout)."));
      }
    }, 50);
  });
};

(function loadFirebaseCompat(){
  const urls = [
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js",
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"
  ];

  function loadScript(src){
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  (async () => {
    try{
      for (const u of urls) await loadScript(u);

      if (!firebase.apps?.length) firebase.initializeApp(firebaseConfig);

      const auth = firebase.auth();
      const db = firebase.firestore();

      window.auth = auth;
      window.db = db;

      window.AuthAPI = {
        onChange(cb){ return auth.onAuthStateChanged(cb); },
        async logout(){ await auth.signOut(); }
      };

      window.ItemsAPI = {
        // ✅ MVP: grava SEM foto
        async addItem({ name, category, pricePerDay, notes, ownerUid }) {
          await db.collection("items").add({
            name: String(name || "").trim(),
            category: String(category || "Outros").trim(),
            pricePerDay: Number(pricePerDay || 0),
            notes: String(notes || "").trim(),
            ownerUid: ownerUid || null,
            createdAt: Date.now()
          });
          return true;
        },

        // ✅ MVP: lista sem orderBy (evita travar por índice/campo)
        async listItems() {
          const snap = await db.collection("items").get();
          return snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
        }
      };

      window.__FIREBASE_READY__ = true;
      console.log("✅ Firebase OK (MVP sem foto)");
    } catch(err){
      window.__FIREBASE_READY__ = false;
      console.error("❌ Firebase falhou:", err);
    }
  })();
})();
