/* firebases.js (com S) */
/* Firebase Auth + Firestore + helpers globais */

(() => {
  // ===============================
  // 1) CONFIG
  // ===============================
  if (!window.FIREBASE_CONFIG) {
    console.error("FIREBASE_CONFIG não definido");
    return;
  }

  const firebaseConfig = window.FIREBASE_CONFIG;

  // ===============================
  // 2) LOAD FIREBASE (CDN)
  // ===============================
  let app = null;
  let auth = null;
  let db = null;

  let readyResolve;
  let readyReject;

  const readyPromise = new Promise((res, rej) => {
    readyResolve = res;
    readyReject = rej;
  });

  window.waitFirebaseReady = () => readyPromise;

  async function loadFirebase() {
    try {
      if (!window.firebase) {
        await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
        await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
        await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
      }

      const {
        initializeApp,
        getApps
      } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");

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
        where,
        orderBy,
        serverTimestamp
      } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

      app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);

      // ===============================
      // 3) API GLOBAL
      // ===============================
      window.AuthAPI = {
        login: (email, password) =>
          signInWithEmailAndPassword(auth, email, password),

        register: (email, password) =>
          createUserWithEmailAndPassword(auth, email, password),

        logout: () => signOut(auth),

        onChange: (cb) => onAuthStateChanged(auth, cb),

        getUser: () => auth.currentUser
      };

      window.ItemsAPI = {
        addItem: async (data) => {
          const user = auth.currentUser;
          if (!user) throw new Error("Usuário não logado");

          await addDoc(collection(db, "items"), {
            ...data,
            userId: user.uid,
            createdAt: serverTimestamp()
          });
        },

        listItems: async () => {
          const q = query(
            collection(db, "items"),
            orderBy("createdAt", "desc")
          );
          const snap = await getDocs(q);
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      };

      readyResolve(true);
    } catch (err) {
      console.error("Erro ao carregar Firebase:", err);
      readyReject(err);
    }
  }

  loadFirebase();
})();
