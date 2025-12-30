// firebases.js (SEM <script> aqui dentro)

// ✅ Sua config (NÃO deixe com "SUA_API_KEY")
// Cole sua config real aqui
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_ID",
  appId: "SEU_APP_ID"
};

let _readyResolve, _readyReject;
const _readyPromise = new Promise((res, rej) => {
  _readyResolve = res;
  _readyReject = rej;
});

// ✅ Função que o site está esperando existir
window.waitFirebaseReady = () => _readyPromise;

// Carrega os módulos do Firebase e expõe APIs no window
(async () => {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    const {
      getAuth,
      onAuthStateChanged,
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signOut
    } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");

    const {
      getFirestore,
      collection,
      addDoc,
      getDocs,
      query,
      orderBy,
      serverTimestamp
    } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    window.AuthAPI = {
      login: (email, password) => signInWithEmailAndPassword(auth, email, password),
      create: (email, password) => createUserWithEmailAndPassword(auth, email, password),
      logout: () => signOut(auth),
      onChange: (cb) => onAuthStateChanged(auth, cb),
      _auth: auth
    };

    window.ItemsAPI = {
      addItem: async (data) => {
        await addDoc(collection(db, "items"), {
          ...data,
          createdAt: serverTimestamp()
        });
      },
      getItems: async () => {
        const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      },
      _db: db
    };

    _readyResolve(true);
  } catch (e) {
    console.error("Erro carregando Firebase:", e);
    _readyReject(e);
  }
})();
