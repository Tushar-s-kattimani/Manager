import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc } from 'firebase/firestore';

const newConfig = {
  apiKey: "AIzaSyDiKwvM0UBrMQLgxlXnIgJONi3B55Pwb4s",
  authDomain: "studio-9395478922-e9cc8.firebaseapp.com",
  projectId: "studio-9395478922-e9cc8",
  storageBucket: "studio-9395478922-e9cc8.firebasestorage.app",
  messagingSenderId: "315051266084",
  appId: "1:315051266084:web:b2c3da69113984d0dcc8b1"
};

const newApp = initializeApp(newConfig, "NEW");
const newDb = getFirestore(newApp);

const USER_EMAIL = 'tusharshivakumarkattimani@gmail.com';
const USER_PATH = `users/${USER_EMAIL}`;

async function migrateData() {
  console.log('Starting migration within NEW project (root to email-scoped)...');
  
  const collectionsToMigrate = ['vehicles', 'shops', 'transactions'];

  for (const colName of collectionsToMigrate) {
    console.log(`Fetching ${colName} from root...`);
    try {
      const snapshot = await getDocs(collection(newDb, colName));
      
      if (snapshot.empty) {
        console.log(`No data found in root collection: ${colName}`);
        continue;
      }

      console.log(`Found ${snapshot.size} documents in ${colName}. Writing to ${USER_PATH}/${colName}...`);
      
      let count = 0;
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        await setDoc(doc(newDb, `${USER_PATH}/${colName}`, docSnap.id), data);
        count++;
      }
      console.log(`Successfully migrated ${count} documents for ${colName}!`);
    } catch (err) {
      console.error(`Failed to migrate ${colName}:`, err.message);
    }
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrateData().catch(console.error);
