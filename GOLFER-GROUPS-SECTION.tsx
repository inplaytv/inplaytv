/**
 * GOLFER GROUPS SECTION FOR TOURNAMENT EDIT PAGE
 * 
 * Add this section to tournaments/[id]/page.tsx AFTER the competitions section
 * 
 * Required State (add to component):
 * - const [golferGroups, setGolferGroups] = useState<GolferGroup[]>([]);
 * - const [tournamentGroups, setTournamentGroups] = useState<TournamentGolferGroup[]>([]);
 * - const [selectedGroupId, setSelectedGroupId] = useState('');
 * 
 * Required Interfaces (add to file):
 * interface GolferGroup {
 *   id: string;
 *   name: string;
 *   slug: string;
 *   description: string | null;
 *   color: string;
 *   member_count?: number;
 * }
 * 
 * interface TournamentGolferGroup {
 *   group_id: string;
 *   golfer_groups: GolferGroup;
 *   added_at: string;
 * }
 * 
 * Required API calls (add to fetchData function):
 * const [groupsRes, tournamentGroupsRes] = await Promise.all([
 *   fetch('/api/golfer-groups'),
 *   fetch(`/api/tournaments/${params.id}/golfer-groups`),
 * ]);
 * if (groupsRes.ok) setGolferGroups(await groupsRes.json());
 * if (tournamentGroupsRes.ok) setTournamentGroups(await tournamentGroupsRes.json());
 */

// ADD THIS SECTION AFTER COMPETITIONS:

{/* Golfer Groups Section */}
<div style={{
  background: 'rgba(30, 30, 35, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  padding: '1.5rem',
  marginBottom: '1.5rem',
}}>
  <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem' }}>
    Golfer Groups
  </h2>

  {/* Add Group Dropdown */}
  <div style={{ marginBottom: '1.5rem' }}>
    <label style={{
      display: 'block',
      marginBottom: '0.5rem',
      fontSize: '0.875rem',
      color: 'rgba(255,255,255,0.8)',
    }}>
      Add Golfer Group
    </label>
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      <select
        value={selectedGroupId}
        onChange={(e) => setSelectedGroupId(e.target.value)}
        style={{
          flex: 1,
          padding: '0.625rem',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '4px',
          color: '#fff',
        }}
      >
        <option value="">Select a group...</option>
        {golferGroups
          .filter(g => !tournamentGroups.find(tg => tg.group_id === g.id))
          .map(group => (
            <option key={group.id} value={group.id}>
              {group.name} ({group.member_count || 0} golfers)
            </option>
          ))}
      </select>
      <button
        type="button"
        onClick={async () => {
          if (!selectedGroupId) {
            alert('Please select a group');
            return;
          }
          try {
            const res = await fetch(`/api/tournaments/${params.id}/golfer-groups`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ group_id: selectedGroupId }),
            });
            if (res.ok) {
              setSelectedGroupId('');
              // Refresh data
              const groupsRes = await fetch(`/api/tournaments/${params.id}/golfer-groups`);
              if (groupsRes.ok) setTournamentGroups(await groupsRes.json());
            } else {
              alert('Failed to add group');
            }
          } catch (err) {
            alert('Error adding group');
          }
        }}
        disabled={!selectedGroupId}
        style={{
          padding: '0.625rem 1.25rem',
          background: selectedGroupId ? '#10b981' : 'rgba(255,255,255,0.1)',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: selectedGroupId ? 'pointer' : 'not-allowed',
          opacity: selectedGroupId ? 1 : 0.5,
        }}
      >
        Add Group
      </button>
    </div>
  </div>

  {/* Assigned Groups List */}
  <div>
    <h3 style={{
      fontSize: '0.875rem',
      fontWeight: 600,
      color: 'rgba(255,255,255,0.7)',
      marginBottom: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      Assigned Groups ({tournamentGroups.length})
    </h3>

    {tournamentGroups.length === 0 ? (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '0.875rem',
      }}>
        No golfer groups assigned yet. Add groups above.
      </div>
    ) : (
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {tournamentGroups.map((tg) => (
          <div
            key={tg.group_id}
            style={{
              padding: '1rem',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: tg.golfer_groups.color,
              }} />
              <div>
                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                  {tg.golfer_groups.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  {tg.golfer_groups.member_count || 0} golfers
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!confirm(`Remove "${tg.golfer_groups.name}" from this tournament?`)) return;
                try {
                  const res = await fetch(
                    `/api/tournaments/${params.id}/golfer-groups?group_id=${tg.group_id}`,
                    { method: 'DELETE' }
                  );
                  if (res.ok) {
                    const groupsRes = await fetch(`/api/tournaments/${params.id}/golfer-groups`);
                    if (groupsRes.ok) setTournamentGroups(await groupsRes.json());
                  } else {
                    alert('Failed to remove group');
                  }
                } catch (err) {
                  alert('Error removing group');
                }
              }}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
```