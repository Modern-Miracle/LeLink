import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { azureExternalUsersService } from '@/lib/services/azure-external-users';

/**
 * GET /api/admin/external-users
 * Lists all external users in Azure AD B2C (for admin/debugging purposes)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[EXTERNAL_USERS_API] Starting external users list request...');
    
    // Validate session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('[EXTERNAL_USERS_API] No authenticated session');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For now, allow any authenticated user to list (in production, restrict to admins)
    console.log('[EXTERNAL_USERS_API] Authenticated user:', session.user.id);

    // List external users
    const externalUsers = await azureExternalUsersService.listExternalUsers();
    
    console.log('[EXTERNAL_USERS_API] Found', externalUsers.length, 'external users');

    return NextResponse.json({
      success: true,
      data: {
        users: externalUsers,
        count: externalUsers.length,
      },
      message: 'External users retrieved successfully',
    });

  } catch (error) {
    console.error('[EXTERNAL_USERS_API] Error listing external users:', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve external users' },
      { status: 500 }
    );
  }
}