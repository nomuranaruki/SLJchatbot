import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// Mock user data for development
const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-15T10:30:00Z',
    status: 'active',
    documentsCount: 15,
    chatSessionsCount: 45
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face',
    createdAt: '2024-01-05T00:00:00Z',
    lastLogin: '2024-01-15T14:20:00Z',
    status: 'active',
    documentsCount: 8,
    chatSessionsCount: 23
  },
  {
    id: '3',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b9bde2e0?w=32&h=32&fit=crop&crop=face',
    createdAt: '2024-01-10T00:00:00Z',
    lastLogin: '2024-01-14T09:15:00Z',
    status: 'active',
    documentsCount: 12,
    chatSessionsCount: 31
  },
  {
    id: '4',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    role: 'user',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
    createdAt: '2024-01-12T00:00:00Z',
    lastLogin: '2024-01-13T16:45:00Z',
    status: 'inactive',
    documentsCount: 3,
    chatSessionsCount: 7
  }
]

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    let filteredUsers = mockUsers

    // Apply filters
    if (search) {
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role)
    }

    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status)
    }

    // Pagination
    const offset = (page - 1) * limit
    const paginatedUsers = filteredUsers.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit)
      },
      stats: {
        totalUsers: mockUsers.length,
        activeUsers: mockUsers.filter(u => u.status === 'active').length,
        adminUsers: mockUsers.filter(u => u.role === 'admin').length,
        regularUsers: mockUsers.filter(u => u.role === 'user').length
      }
    })
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { userId, updates } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // In a real implementation, this would update the database
    const userIndex = mockUsers.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user (mock implementation)
    if (updates.role) mockUsers[userIndex].role = updates.role
    if (updates.status) mockUsers[userIndex].status = updates.status

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: mockUsers[userIndex]
    })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const userIndex = mockUsers.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove user (mock implementation)
    const deletedUser = mockUsers.splice(userIndex, 1)[0]

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser
    })
  } catch (error) {
    console.error('User deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
