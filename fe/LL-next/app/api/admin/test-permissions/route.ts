import { NextRequest, NextResponse } from 'next/server';
import { azureExternalUsersService } from '@/lib/services/azure-external-users';

/**
 * GET /api/admin/test-permissions
 * Test Azure Graph API permissions (no auth required for testing)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[PERMISSIONS_TEST] Testing Azure Graph API permissions...');
    
    // Test listing users (requires User.Read.All or User.ReadWrite.All)
    try {
      const users = await azureExternalUsersService.listExternalUsers();
      console.log('[PERMISSIONS_TEST] Successfully listed users, count:', users.length);
      
      return NextResponse.json({
        success: true,
        permissions: {
          'User.Read.All': true,
          'User.ReadWrite.All': true,
        },
        data: {
          userCount: users.length,
          users: users.slice(0, 3), // Show first 3 users for testing
        },
        message: 'Permissions test successful',
      });
      
    } catch (error: any) {
      console.error('[PERMISSIONS_TEST] Permission test failed:', error.message);
      
      return NextResponse.json({
        success: false,
        permissions: {
          'User.Read.All': false,
          'User.ReadWrite.All': false,
        },
        error: error.message,
        details: error.response?.data || 'No additional details',
        message: 'Permissions test failed - check Azure app registration',
      }, { status: 403 });
    }

  } catch (error: any) {
    console.error('[PERMISSIONS_TEST] Unexpected error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Unexpected error during permissions test',
    }, { status: 500 });
  }
}