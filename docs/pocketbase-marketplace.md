# PocketBase marketplace schema

Phase 2 can run in demo mode with browser `localStorage`. Set `NEXT_PUBLIC_POCKETBASE_URL` to use PocketBase for shared persistence.

## Collections

### `tappers`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | text | yes | Tapper display name |
| `photo` | file | no | One image |
| `district` | select/text | yes | Kerala district |
| `years_experience` | number | yes | 0–40 |
| `tapping_systems` | json or multi-select | yes | Conventional, rain-guard, S/2 d2, etc. |
| `trees_per_day` | number | yes | Typical daily capacity |
| `availability` | select | yes | `available_now`, `available_from`, `not_available` |
| `available_from` | date | no | Only for `available_from` |
| `languages` | json or multi-select | yes | Malayalam, Tamil, English |
| `bio` | text | no | Keep to 100 characters in UI |
| `contact_number` | text | yes | Revealed after match |
| `edit_token` | text | yes | UUID/token generated client-side |

Suggested API rules for a prototype:

```txt
list/search: availability != "not_available"
view: true
create: true
update: edit_token = @request.data.edit_token
delete: false
```

For a public demo, prefer a backend proxy for updates so `edit_token` is never part of a public rule expression.

### `matches`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `tapper_id` | relation/text | yes | Matched tapper record id |

Suggested API rules:

```txt
list/search: false
view: false
create: true
update/delete: false
```

## Deployment notes

PocketBase needs durable filesystem storage for SQLite and uploaded profile photos. Render free web services can sleep and may not provide durable disk semantics suitable for production records. For a LinkedIn/demo build, the frontend still works without PocketBase using seed tappers plus browser-local profiles. For real shared persistence, attach a persistent disk or move records to an always-durable free database/storage provider.
