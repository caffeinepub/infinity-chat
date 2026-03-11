# Infinity Chat

## Current State
Groups are members-only. Users must be explicitly invited via `inviteToGroup` with a Principal ID before they can see or join a group. `getUserGroups` and `getGroupList` only return groups the caller is already a member of. There is no way to discover or self-join groups.

## Requested Changes (Diff)

### Add
- `getAllGroups` backend query: returns all groups (no membership check) so any logged-in user can discover them
- `joinGroup` backend function: lets any logged-in user add themselves to a group without needing an invite
- "Browse & Join" UI in the sidebar: lists all available groups with a Join button for groups the user hasn't joined yet

### Modify
- Sidebar group list: show two sections -- "Your Groups" (already joined) and "All Groups" (joinable)
- After joining a group, immediately switch to that group's chat

### Remove
- Nothing removed

## Implementation Plan
1. Add `getAllGroups` query to backend (no membership guard)
2. Add `joinGroup` shared function to backend (adds caller to members)
3. Update frontend sidebar to fetch all groups and show join buttons for unjoined ones
4. Auto-switch to group after joining
