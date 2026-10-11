import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "bustling-maker-8j9st",
  appId: "1:715779716151:web:045421793af14dedf33bb2",
  apiKey: "AIzaSyDAGYp7Yy_cNIn_p9qmbw7HdDV0T4oXN0Y",
  authDomain: "bustling-maker-8j9st.firebaseapp.com",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-squlp10a13-f24e2ea2-bcbd-41c7-a546-24f57fd74b75");

async function test() {
  try {
    console.log("Writing...");
    await setDoc(doc(db, 'class_fund', 'test'), { hello: 'world' });
    console.log("Reading...");
    const snap = await getDoc(doc(db, 'class_fund', 'test'));
    console.log("Result:", snap.data());
    process.exit(0);
  } catch(e) {
    console.error("Error:", e);
    process.exit(1);
  }
}
test();
