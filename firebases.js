// firebases.js (compat) - HTML puro (sem import/export)

const firebaseConfig = {
  apiKey: "AIzaSyCUPov_9w1wa1sg-an76PEexvKnoqMijo0",
  authDomain: "compartilhai-mvp.firebaseapp.com",
  projectId: "compartilhai-mvp",
  storageBucket: "compartilhai-mvp.firebasestorage.app",
  messagingSenderId: "327553407150",
  appId: "1:327553407150:web:88e2c9c05ac681948a353f"
};

window.__FIREBASE_READY__ = false;

// ✅ Função global (resolve seu erro "waitFirebaseReady is not a function")
window.waitFirebaseReady = function waitFirebaseReady(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const timer = setInterval(() => {
      if (window.__FIREBASE_READY__ && window.auth && window.db) {
        clearInterval(timer);
        resolve(true);
        return;
      }
      if (Date.now() - t0 > timeoutMs) {
        clearInterval(timer);
        reject(new Error("Firebase não ficou pronto (timeout)."));
      }
    }, 100);
  });
};

// Evita carregar duas vezes (se você abrir várias páginas)
if (!window.__FIREBASE_LOADING__) {
  window.__FIREBASE_LOADING__ = true;

  (function loadFirebaseCompat() {
    const urls = [
      "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
      "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js",
      "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"
      // ⚠️ Sem Storage no MVP (pra não pedir upgrade e não travar upload)
    ];

    function loadScript(src) {
      return new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    (async () => {
      try {
        for (const u of urls) await loadScript(u);

        // init apenas 1x
        if (!firebase.apps || !firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }

        const auth = firebase.auth();
        const db = firebase.firestore();

        window.auth = auth;
        window.db = db;

        // ===== APIs globais =====
        window.AuthAPI = {
          onChange(cb) {
            return auth.onAuthStateChanged(cb);
          },
          async loginOrCreate(email, password) {
            try {
              return await auth.signInWithEmailAndPassword(email, password);
            } catch (err) {
              if (err && (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential")) {
                return await auth.createUserWithEmailAndPassword(email, password);
              }
              throw err;
            }
          },
          async logout() {
            await auth.signOut();
          }
        };

        // Foto padrão (sem upload)
        const DEFAULT_PHOTO_URL =
          "data:image/svg+xml;charset=utf-8," +
          encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
            <rect width="100%" height="100%" fill="#0f1833"/>
            <text x="50%" y="50%" fill="#ffffff" font-family="Arial" font-size="34" text-anchor="middle" dominant-baseline="middle">
              Item (sem foto)
            </text>
          </svg>`);

        window.ItemsAPI = {
          async addItem({ name, category, pricePerDay, notes, ownerUid }) {
            const doc = {
              name: String(name || "").trim(),
              category: String(category || "").trim(),
              pricePerDay: Number(pricePerDay),
              notes: String(notes || "").trim(),
              photoUrl: DEFAULT_PHOTO_URL,
              ownerUid: String(ownerUid || ""),
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection("items").add(doc);
          },

          async listItems() {
            // Se createdAt estiver vazio em alguns docs, orderBy pode falhar em certos casos.
            // Então tentamos com orderBy e fazemos fallback.
            try {
              const snap = await db.collection("items").orderBy("createdAt", "desc").get();
              return snap.docs.map(d => ({ id: d.id, ...d.data() }));
            } catch (err) {
              const snap = await db.collection("items").get();
              return snap.docs.map(d => ({ id: d.id, ...d.data() }));
            }
          }
        };

        window.__FIREBASE_READY__ = true;
        console.log("✅ Firebase pronto (SEM Storage) e APIs disponíveis");
      } catch (err) {
        console.error("❌ Erro iniciando Firebase:", err);
        window.__FIREBASE_READY__ = false;
      }
    })();
  })();
}