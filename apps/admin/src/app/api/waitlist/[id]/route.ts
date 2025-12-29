import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE - Remove waitlist entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('[DELETE Waitlist] Attempting to delete ID:', id);

    const { data, error } = await supabase
      .from('waitlist')
      .delete()
      .eq('id', id)
      .select();
    
    console.log('[DELETE Waitlist] Result:', { data, error });

    if (error) throw error;

    return NextResponse.json({ success: true, deleted: data });
  } catch (error: any) {
    console.error('DELETE waitlist entry error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete entry' },
      { status: 500 }
    );
  }
}
