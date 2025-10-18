# Username Signup TODO

## Current Situation
The signup form (`apps/web/src/app/(auth)/signup/page.tsx`) currently only captures:
- Email
- Password
- Name

The `username` field is NOT captured during signup, so users must set it in their profile page after registering.

## To Fix This (Future Enhancement)

### 1. Add Username Field to Signup Form
In `apps/web/src/app/(auth)/signup/page.tsx`, add:
```tsx
const [username, setUsername] = useState('');
```

### 2. Add Input Field to Form
```tsx
<input
  type="text"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  placeholder="Choose a username"
  required
/>
```

### 3. Check Username Uniqueness Before Signup
```tsx
// Check if username is already taken
const { data: existingUser } = await supabase
  .from('profiles')
  .select('id')
  .eq('username', username)
  .single();

if (existingUser) {
  setMessage('Username is already taken');
  return;
}
```

### 4. Save Username in Profile
```tsx
await supabase.from('profiles').upsert({
  id: data.user.id,
  name: name,
  username: username,  // Add this
  onboarding_complete: true,
});
```

## Current Workaround
Users can set their username in the profile page (`/profile`) after signing up. The username field:
- Is editable in the profile
- Has uniqueness validation
- Shows error if username is already taken
