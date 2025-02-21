import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import Filter from 'bad-words';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

export const detectEvilUsers = onDocumentCreated("messages/{msgId}", async (event) => {
  const filter = new Filter();
  const { text, uid } = event.data.data();

  if (filter.isProfane(text)) {
    const cleaned = filter.clean(text);
    await event.data.ref.update({text: `🤐 I got BANNED ${cleaned}`});
    await db.collection("banned").doc(uid).set({});
  }

  const userRef = db.collection("users").doc(uid);
  const userData = (await userRef.get()).data() || { msgCount: 0 };

  if (userData.msgCount >= 7) {
    await db.collection("banned").doc(uid).set({});
  } else {
    await userRef.set({msgCount: (userData.msgCount || 0) + 1});
  }
});
