import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { action } = await request.json();
    const params = await context.params;
    const userId = params.id;

    if (!action || !['ban', 'unban'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "ban" or "unban"' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    if (action === 'ban') {
      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: 'none', // Indefinite ban
      });

      if (error) {
        console.error('Error banning user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'User account disabled successfully',
        banned: true 
      });
    } else {
      // Unban user
      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: '0s', // Remove ban
      });

      if (error) {
        console.error('Error unbanning user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'User account enabled successfully',
        banned: false 
      });
    }
  } catch (err) {
    console.error('Error toggling user status:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
