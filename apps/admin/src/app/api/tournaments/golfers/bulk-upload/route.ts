import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface CsvRow {
  name: string;
  country?: string;
  dg_id?: string;
  pga_tour_id?: string;
}

/**
 * POST /api/tournaments/golfers/bulk-upload
 * Bulk upload golfers from CSV file
 * 
 * CSV Format: name,country,dg_id,pga_tour_id
 * Example:
 *   Scottie Scheffler,USA,12345,67890
 *   Rory McIlroy,NIR,12346,67891
 */
export async function POST(request: NextRequest) {
  try {
    await assertAdminOrRedirect();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tournamentId = formData.get('tournament_id') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Read CSV file
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must have header row and at least one data row' },
        { status: 400 }
      );
    }

    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIndex = headers.indexOf('name');
    const countryIndex = headers.indexOf('country');
    const dgIdIndex = headers.indexOf('dg_id');
    const pgaIdIndex = headers.indexOf('pga_tour_id');

    if (nameIndex === -1) {
      return NextResponse.json(
        { error: 'CSV must have a "name" column' },
        { status: 400 }
      );
    }

    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = line.split(',').map(v => v.trim());
      
      const name = values[nameIndex];
      if (!name) continue;

      rows.push({
        name,
        country: countryIndex >= 0 ? values[countryIndex] : undefined,
        dg_id: dgIdIndex >= 0 ? values[dgIdIndex] : undefined,
        pga_tour_id: pgaIdIndex >= 0 ? values[pgaIdIndex] : undefined,
      });
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No valid golfer data found in CSV' },
        { status: 400 }
      );
    }

    console.log(`📊 Processing ${rows.length} golfers from CSV...`);

    // Process each golfer
    const adminClient = createAdminClient();
    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        // Check if golfer exists
        let existingGolfer = null;
        
        if (row.dg_id) {
          const { data } = await adminClient
            .from('golfers')
            .select('id')
            .eq('dg_id', row.dg_id)
            .single();
          existingGolfer = data;
        }

        if (!existingGolfer) {
          const { data } = await adminClient
            .from('golfers')
            .select('id')
            .eq('name', row.name)
            .single();
          existingGolfer = data;
        }

        let golferId: string;

        if (existingGolfer) {
          golferId = existingGolfer.id;
        } else {
          // Create new golfer
          const { data: newGolfer, error: createError } = await adminClient
            .from('golfers')
            .insert({
              name: row.name,
              country: row.country || null,
              dg_id: row.dg_id || null,
              pga_tour_id: row.pga_tour_id || null,
            })
            .select('id')
            .single();

          if (createError) {
            throw createError;
          }

          golferId = newGolfer!.id;
        }

        // Link to tournament
        const { error: linkError } = await adminClient
          .from('tournament_golfers')
          .insert({
            tournament_id: tournamentId,
            golfer_id: golferId,
            status: 'confirmed',
          });

        if (linkError) {
          // If duplicate, skip
          if (linkError.code === '23505') {
            console.log(`⚠️ Skipping ${row.name}: already in tournament`);
            skipped++;
          } else {
            throw linkError;
          }
        } else {
          console.log(`✅ Added ${row.name}`);
          added++;
        }

      } catch (error: any) {
        console.error(`❌ Error processing ${row.name}:`, error);
        errors.push(`${row.name}: ${error.message}`);
        skipped++;
      }
    }

    console.log(`✅ Bulk upload complete: ${added} added, ${skipped} skipped`);

    return NextResponse.json({
      success: true,
      added,
      skipped,
      total: rows.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('Error bulk uploading golfers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload golfers' },
      { status: 500 }
    );
  }
}
