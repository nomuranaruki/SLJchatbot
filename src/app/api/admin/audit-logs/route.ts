import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// Mock audit log data
const mockAuditLogs = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    userId: '2',
    userName: 'John Doe',
    action: 'DOCUMENT_UPLOAD',
    resource: 'Document',
    resourceId: 'doc-123',
    details: 'Uploaded: Company Policy.pdf',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    status: 'SUCCESS'
  },
  {
    id: '2',
    timestamp: '2024-01-15T10:25:00Z',
    userId: '3',
    userName: 'Jane Smith',
    action: 'CHAT_SESSION',
    resource: 'ChatHistory',
    resourceId: 'chat-456',
    details: 'Started chat session with 5 messages',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    status: 'SUCCESS'
  },
  {
    id: '3',
    timestamp: '2024-01-15T10:20:00Z',
    userId: '2',
    userName: 'John Doe',
    action: 'GOOGLE_DRIVE_SYNC',
    resource: 'Integration',
    resourceId: 'gdrive-sync',
    details: 'Synced 3 documents from Google Drive',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    status: 'SUCCESS'
  },
  {
    id: '4',
    timestamp: '2024-01-15T10:15:00Z',
    userId: '4',
    userName: 'Bob Wilson',
    action: 'LOGIN_ATTEMPT',
    resource: 'Authentication',
    resourceId: 'auth-login',
    details: 'Failed login attempt - invalid credentials',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)',
    status: 'FAILED'
  },
  {
    id: '5',
    timestamp: '2024-01-15T10:10:00Z',
    userId: '1',
    userName: 'Admin User',
    action: 'USER_ROLE_CHANGE',
    resource: 'User',
    resourceId: 'user-789',
    details: 'Changed user role from user to admin',
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    status: 'SUCCESS'
  },
  {
    id: '6',
    timestamp: '2024-01-15T10:05:00Z',
    userId: '3',
    userName: 'Jane Smith',
    action: 'SLACK_NOTIFICATION',
    resource: 'Integration',
    resourceId: 'slack-notif',
    details: 'Sent chat summary to #general channel',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    status: 'SUCCESS'
  },
  {
    id: '7',
    timestamp: '2024-01-15T10:00:00Z',
    userId: '2',
    userName: 'John Doe',
    action: 'DOCUMENT_DELETE',
    resource: 'Document',
    resourceId: 'doc-111',
    details: 'Deleted: Old Report.pdf',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    status: 'SUCCESS'
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
    const limit = parseInt(searchParams.get('limit') || '20')
    const action = searchParams.get('action') || ''
    const status = searchParams.get('status') || ''
    const userId = searchParams.get('userId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    let filteredLogs = [...mockAuditLogs]

    // Apply filters
    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action)
    }

    if (status) {
      filteredLogs = filteredLogs.filter(log => log.status === status)
    }

    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId)
    }

    if (dateFrom) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(dateFrom)
      )
    }

    if (dateTo) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(dateTo)
      )
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Pagination
    const offset = (page - 1) * limit
    const paginatedLogs = filteredLogs.slice(offset, offset + limit)

    // Calculate statistics
    const stats = {
      totalEvents: filteredLogs.length,
      successfulEvents: filteredLogs.filter(log => log.status === 'SUCCESS').length,
      failedEvents: filteredLogs.filter(log => log.status === 'FAILED').length,
      uniqueUsers: Array.from(new Set(filteredLogs.map(log => log.userId))).length,
      topActions: getTopActions(filteredLogs),
      recentActivity: filteredLogs.slice(0, 5)
    }

    return NextResponse.json({
      success: true,
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total: filteredLogs.length,
        totalPages: Math.ceil(filteredLogs.length / limit)
      },
      stats
    })
  } catch (error) {
    console.error('Audit logs API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getTopActions(logs: any[]) {
  const actionCounts: { [key: string]: number } = {}
  
  logs.forEach(log => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
  })

  return Object.entries(actionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([action, count]) => ({ action, count }))
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { action, resource, resourceId, details, status = 'SUCCESS' } = await request.json()

    if (!action || !resource) {
      return NextResponse.json(
        { error: 'Action and resource are required' },
        { status: 400 }
      )
    }

    // Create new audit log entry
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userId: session.user.id,
      userName: session.user.name || 'Unknown User',
      action,
      resource,
      resourceId: resourceId || '',
      details: details || '',
      ipAddress: '127.0.0.1', // In real implementation, extract from request
      userAgent: 'Mock User Agent', // In real implementation, extract from headers
      status
    }

    // Add to mock data (in real implementation, save to database)
    mockAuditLogs.unshift(newLog)

    return NextResponse.json({
      success: true,
      message: 'Audit log created successfully',
      log: newLog
    })
  } catch (error) {
    console.error('Create audit log error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
