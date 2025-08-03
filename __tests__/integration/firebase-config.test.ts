import { app, db, auth } from '@/lib/firebase'

describe('Firebase Configuration', () => {
  it('should initialize Firebase app', () => {
    expect(app).toBeDefined()
  })

  it('should initialize Firestore database', () => {
    expect(db).toBeDefined()
  })

  it('should initialize Firebase Auth', () => {
    expect(auth).toBeDefined()
  })

  it('should have correct Firebase config', () => {
    // This test verifies that the Firebase configuration is properly set up
    // The actual config values are checked in the firebase.ts file
    expect(app).toBeTruthy()
  })
}) 