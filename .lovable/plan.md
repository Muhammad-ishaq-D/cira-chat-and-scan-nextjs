

## Plan: Freemium "Ask Cira" Flow + Build Fix

### Problem Summary
1. **Build error**: `shenai-sdk` fails to install from local path (cache issue)
2. **Feature request**: Convert the app to freemium — anyone can use Cira without login, with device-based credit limits

### Changes

#### 1. Fix shenai-sdk build error
The local `file:./shenai-sdk` dependency fails bun install. Fix by ensuring the package resolves correctly — likely need to clear the lockfile entry or adjust the dependency reference. Will delete `bun.lock`/`bun.lockb` and reinstall.

#### 2. Home page: "Try a free scan" → "Ask Cira"
- In `src/pages/Index.tsx`, change button text from "Try a free scan →" to "Ask Cira →"
- Change `handleAskCira` to navigate to `/free-chat` instead of `/login`
- Update subtitle hints (remove "Camera only", add "No signup needed")

#### 3. Create `/free-chat` page (new file: `src/pages/FreeChat.tsx`)
A standalone chat page that works without authentication:
- **Based on existing `Chat.tsx`** but stripped of login requirements (no `getToken()` gating, no `ProtectedRoute`)
- **Device-based credits** tracked via `localStorage`:
  - `cira_free_credits` — starts at 100,000, decremented per API call
  - `cira_free_scans` — starts at 1, decremented on scan use
  - Generate a unique `cira_device_id` (UUID) stored in localStorage for tracking
- **All 4 modes available**: Quick Assessment, Detailed Assessment, Vital Scan + Assessment, Just Chat
- **Sidebar** shows:
  - Chat history (local only, stored in localStorage)
  - A prominent "Login to save your data" button that navigates to `/login`
  - Warning text: "Chat history and scan data are not saved without an account"
- **API calls**: Send `deviceId` header instead of JWT Bearer token; backend can use this for rate limiting. If the backend requires auth, fall back to an anonymous/guest token approach
- **Credit exhaustion**: When credits hit 0, show upgrade/login prompt

#### 4. Register route in `App.tsx`
- Add `<Route path="/free-chat" element={<FreeChat />} />` (no `ProtectedRoute` wrapper)

#### 5. Adjust `VitalsScan.tsx` for guest access
- Allow navigation to `/vitals-scan` without login when coming from free-chat
- Check `cira_free_scans` in localStorage; if 0, block and show "Login to get more scans"
- After scan, redirect back to `/free-chat` with vitals in sessionStorage (existing pattern)

### Technical Notes
- Device credits use localStorage keys with a generated device UUID to prevent trivial resets
- The free chat API calls will include a `X-Device-Id` header so the backend can enforce server-side limits too
- Chat history for free users is stored only in localStorage (not persisted to backend)
- The existing `Chat.tsx` (authenticated) remains unchanged for logged-in users

