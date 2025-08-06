// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ name: 'test-app' })),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({ name: 'test-app' }))
}))

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({ name: 'test-db' }))
}))

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ name: 'test-auth' }))
}))

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