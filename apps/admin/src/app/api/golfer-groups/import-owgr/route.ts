import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST - Import golfers from OWGR website
export async function POST(request: NextRequest) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const { url, group_name, tournament_id } = body;

    if (!url || !group_name) {
      return NextResponse.json({ error: 'URL and group name are required' }, { status: 400 });
    }

    // Fetch the OWGR page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch OWGR page' }, { status: 500 });
    }

    const html = await response.text();
    
    // Parse golfer names from HTML using regex
    // OWGR pages typically have player names in specific patterns
    const golfers: { first_name: string; last_name: string }[] = [];
    
    // Pattern 1: Look for table rows with player names
    // Common format: <td>Scheffler, Scottie</td> or <td>Tiger Woods</td>
    const tdRegex = /<td[^>]*>([A-Z][a-zA-Z\s'\-]+,?\s*[A-Z][a-zA-Z\s'\-]+)<\/td>/g;
    let match;
    
    while ((match = tdRegex.exec(html)) !== null) {
      const name = match[1].trim();
      // Skip if it looks like a number, date, or country
      if (!/^\d|^[A-Z]{2,3}$|^\d{4}/.test(name)) {
        const parsed = parseName(name);
        if (parsed) {
          golfers.push(parsed);
        }
      }
    }

    // Pattern 2: Look for links with player names
    if (golfers.length === 0) {
      const linkRegex = /<a[^>]*>([A-Z][a-zA-Z\s'\-]+,?\s*[A-Z][a-zA-Z\s'\-]+)<\/a>/g;
      while ((match = linkRegex.exec(html)) !== null) {
        const name = match[1].trim();
        if (!/^\d|^[A-Z]{2,3}$|^\d{4}/.test(name)) {
          const parsed = parseName(name);
          if (parsed) {
            golfers.push(parsed);
          }
        }
      }
    }

    // Pattern 3: Look for div or span elements with player names
    if (golfers.length === 0) {
      const divRegex = /<(?:div|span)[^>]*class="[^"]*player[^"]*"[^>]*>([A-Z][a-zA-Z\s'\-]+,?\s*[A-Z][a-zA-Z\s'\-]+)<\/(?:div|span)>/gi;
      while ((match = divRegex.exec(html)) !== null) {
        const name = match[1].trim();
        if (!/^\d|^[A-Z]{2,3}$|^\d{4}/.test(name)) {
          const parsed = parseName(name);
          if (parsed) {
            golfers.push(parsed);
          }
        }
      }
    }

    if (golfers.length === 0) {
      return NextResponse.json({ 
        error: 'No golfers found on this page. Please check the URL or contact support.' 
      }, { status: 400 });
    }

    // Create unique golfers list (avoid duplicates)
    const uniqueGolfers = Array.from(
      new Map(golfers.map(g => [`${g.first_name}|${g.last_name}`, g])).values()
    );

    const adminClient = createAdminClient();

    // Create the group
    const slug = group_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: group, error: groupError } = await adminClient
      .from('golfer_groups')
      .insert({
        name: group_name,
        slug: `${slug}-${Date.now()}`, // Add timestamp to avoid conflicts
        description: `Imported from OWGR: ${url}`,
        color: '#10b981', // Green for imported groups
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Insert golfers (or get existing)
    const golferIds: string[] = [];
    
    for (const golfer of uniqueGolfers) {
      // Try to find existing golfer by name
      const { data: existing } = await adminClient
        .from('golfers')
        .select('id')
        .eq('first_name', golfer.first_name)
        .eq('last_name', golfer.last_name)
        .limit(1)
        .single();

      if (existing) {
        golferIds.push(existing.id);
      } else {
        // Create new golfer
        const { data: newGolfer, error: golferError } = await adminClient
          .from('golfers')
          .insert({
            first_name: golfer.first_name,
            last_name: golfer.last_name,
          })
          .select('id')
          .single();

        if (!golferError && newGolfer) {
          golferIds.push(newGolfer.id);
        }
      }
    }

    // Add golfers to group
    const members = golferIds.map(id => ({
      group_id: group.id,
      golfer_id: id,
    }));

    await adminClient
      .from('golfer_group_members')
      .insert(members);

    // If tournament_id provided, assign group to tournament
    if (tournament_id) {
      await adminClient
        .from('tournament_golfer_groups')
        .insert({
          tournament_id,
          group_id: group.id,
        });
    }

    return NextResponse.json({
      success: true,
      group_id: group.id,
      group_name: group.name,
      golfers_count: golferIds.length,
    });

  } catch (error: any) {
    console.error('OWGR import error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import golfers' }, { status: 500 });
  }
}

// Helper function to parse golfer names
function parseName(text: string): { first_name: string; last_name: string } | null {
  // Remove extra whitespace and numbers (like rankings)
  const cleaned = text.replace(/^\d+\.\s*/, '').trim();
  
  if (!cleaned || cleaned.length < 3) return null;

  // Pattern 1: "Last Name, First Name" (common in OWGR)
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      return {
        first_name: parts[1],
        last_name: parts[0],
      };
    }
  }

  // Pattern 2: "First Last" or "First Middle Last"
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) {
    // Take first part as first name, rest as last name
    return {
      first_name: parts[0],
      last_name: parts.slice(1).join(' '),
    };
  }

  return null;
}
