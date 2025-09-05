// scripts/test-firebase-connection.js
// Test Firebase connection and authentication setup

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0S70IlVSW8tzBnMHJTONdjd4PDnXpG7c",
  authDomain: "jcikl-account.firebaseapp.com",
  projectId: "jcikl-account",
  storageBucket: "jcikl-account.firebasestorage.app",
  messagingSenderId: "337297956797",
  appId: "1:337297956797:web:7cf09cb5972f5b83afbcd4",
};

async function testFirebaseConnection() {
  try {
    console.log('🔥 Testing Firebase connection...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    console.log('📊 Project ID:', firebaseConfig.projectId);
    console.log('🌐 Auth Domain:', firebaseConfig.authDomain);
    
    // Test Firestore connection (this will fail if permissions are not set correctly)
    try {
      console.log('📚 Testing Firestore connection...');
      const testCollection = collection(db, 'test');
      await getDocs(testCollection);
      console.log('✅ Firestore connection successful');
    } catch (error) {
      console.log('❌ Firestore connection failed:', error.message);
      console.log('💡 This is expected if authentication is required');
    }
    
    // Test authentication
    try {
      console.log('🔐 Testing authentication...');
      // Try to create a test user
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'testpassword123';
      
      console.log('👤 Creating test user:', testEmail);
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('✅ Test user created successfully:', userCredential.user.uid);
      
      // Clean up - delete the test user
      console.log('🧹 Cleaning up test user...');
      await userCredential.user.delete();
      console.log('✅ Test user deleted successfully');
      
    } catch (error) {
      console.log('❌ Authentication test failed:', error.message);
      console.log('💡 Error code:', error.code);
      
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️  Test user already exists, trying to sign in...');
        try {
          const signInResult = await signInWithEmailAndPassword(auth, 'test@example.com', 'testpassword123');
          console.log('✅ Sign in successful:', signInResult.user.uid);
        } catch (signInError) {
          console.log('❌ Sign in failed:', signInError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Firebase connection test failed:', error);
  }
}

// Run the test
testFirebaseConnection().then(() => {
  console.log('🏁 Firebase connection test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
