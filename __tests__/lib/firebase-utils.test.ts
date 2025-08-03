import { getUserByUid, getUsers, getTransactions, getAccounts, getProjects, getJournalEntries } from '@/lib/firebase-utils'
import { UserRoles } from '@/lib/data'

// Mock Firebase modules
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
}))

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
}))

describe('Firebase Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserByUid', () => {
    it('should return user profile when user exists', async () => {
      const mockUserProfile = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        role: UserRoles.ASSISTANT_VICE_PRESIDENT,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastLogin: '2024-01-01T00:00:00.000Z',
      }

      const { collection, query, where, getDocs } = require('firebase/firestore')
      collection.mockReturnValue('users-collection')
      query.mockReturnValue('users-query')
      where.mockReturnValue('users-where')
      getDocs.mockResolvedValue({
        empty: false,
        docs: [{
          id: 'test-uid',
          data: () => mockUserProfile,
        }],
      })

      const result = await getUserByUid('test-uid')

      expect(collection).toHaveBeenCalledWith({}, 'users')
      expect(query).toHaveBeenCalledWith('users-collection', 'users-where')
      expect(where).toHaveBeenCalledWith('uid', '==', 'test-uid')
      expect(result).toEqual(mockUserProfile)
    })

    it('should return null when user does not exist', async () => {
      const { collection, query, where, getDocs } = require('firebase/firestore')
      collection.mockReturnValue('users-collection')
      query.mockReturnValue('users-query')
      where.mockReturnValue('users-where')
      getDocs.mockResolvedValue({
        empty: true,
        docs: [],
      })

      const result = await getUserByUid('non-existent-uid')

      expect(result).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      const { collection, query, where, getDocs } = require('firebase/firestore')
      collection.mockReturnValue('users-collection')
      query.mockReturnValue('users-query')
      where.mockReturnValue('users-where')
      getDocs.mockRejectedValue(new Error('Firebase error'))

      await expect(getUserByUid('test-uid')).rejects.toThrow('Firebase error')
    })
  })

  describe('Collection Functions', () => {
    it('should get users successfully', async () => {
      const mockUsers = [
        { 
          id: '1', 
          uid: 'user1', 
          email: 'user1@example.com', 
          displayName: 'User 1', 
          role: UserRoles.ASSISTANT_VICE_PRESIDENT,
          createdAt: '2024-01-01T00:00:00.000Z',
          lastLogin: '2024-01-01T00:00:00.000Z',
        },
        { 
          id: '2', 
          uid: 'user2', 
          email: 'user2@example.com', 
          displayName: 'User 2', 
          role: UserRoles.VICE_PRESIDENT,
          createdAt: '2024-01-01T00:00:00.000Z',
          lastLogin: '2024-01-01T00:00:00.000Z',
        },
      ]

      const { collection, getDocs } = require('firebase/firestore')
      collection.mockReturnValue('users-collection')
      getDocs.mockResolvedValue({
        docs: mockUsers.map(user => ({
          id: user.id,
          data: () => user,
        })),
      })

      const result = await getUsers()

      expect(collection).toHaveBeenCalledWith({}, 'users')
      expect(result).toEqual(mockUsers)
    })

    it('should get transactions successfully', async () => {
      const mockTransactions = [
        { 
          id: '1', 
          amount: '+$100.00', 
          description: 'Transaction 1',
          date: '2024-01-01',
          account: 'Cash',
          debit: 100,
          credit: 0,
          status: 'Completed' as const,
          createdByUid: 'user1',
        },
        { 
          id: '2', 
          amount: '+$200.00', 
          description: 'Transaction 2',
          date: '2024-01-02',
          account: 'Bank',
          debit: 200,
          credit: 0,
          status: 'Completed' as const,
          createdByUid: 'user2',
        },
      ]

      const { collection, getDocs } = require('firebase/firestore')
      collection.mockReturnValue('transactions-collection')
      getDocs.mockResolvedValue({
        docs: mockTransactions.map(transaction => ({
          id: transaction.id,
          data: () => transaction,
        })),
      })

      const result = await getTransactions()

      expect(collection).toHaveBeenCalledWith({}, 'transactions')
      expect(result).toEqual(mockTransactions)
    })
  })
}) 