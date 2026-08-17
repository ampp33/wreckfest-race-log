# External API: submitting races programmatically

Wreckfest Race Log doesn't run a custom backend — the "API" is a direct
call to a Supabase Postgres RPC function over PostgREST. Any external tool
(written in any language) can POST a completed race directly to this
endpoint using only a per-user API key generated from **Settings → API
Keys** in the app. No Supabase session/login is required — the API key
*is* the auth.

The function is named with a `_wf1` suffix since a sibling project
(Wreckfest 2 Race Log) exposes the equivalent endpoint for Wreckfest 2 as
`insert_race_with_api_key_wf2` — don't drop the suffix when wiring up a
client.

## Endpoint

```
POST {SUPABASE_URL}/rest/v1/rpc/insert_race_with_api_key_wf1
```

`{SUPABASE_URL}` is the same value the web app uses (`VITE_SUPABASE_URL`
in `.env`).

## Headers

| Header          | Value                                                              | Required |
|-----------------|---------------------------------------------------------------------|----------|
| `apikey`        | the Supabase **anon/publishable** key (`VITE_SUPABASE_ANON_KEY`)    | yes |
| `Content-Type`  | `application/json`                                                   | yes |
| `Authorization` | —                                                                    | **not required** — this RPC doesn't use a Supabase session. The `api_key` field in the body is the real per-user credential. |

The `apikey` header just identifies the Supabase *project*; it's the
public anon key baked into the deployed site and is not a secret.
Per-user authorization happens entirely inside the function via
`api_key`.

## Request body

All fields are passed as named fields in a JSON object (PostgREST RPC
convention — field names must exactly match the SQL parameter names):

| Field                | Type    | Required | Notes |
|----------------------|---------|----------|-------|
| `api_key`            | string  | yes      | Raw key shown once at creation time in the app. Not the anon key. |
| `track`              | string  | yes      | Matched case-insensitively against the track's exact display name. |
| `variant`            | string  | yes      | Matched case-insensitively against the variation's exact display name, scoped to the resolved track. |
| `vehicle`            | string  | yes      | Case-insensitive match against the vehicle's name. Pass `""` or `null` if unknown — the race is still recorded with no vehicle. |
| `performance_index`  | integer | yes      | Must be `>= 0`. |
| `place`              | integer | yes      | Finishing position. |
| `lap_time_ms`        | integer | yes      | Best lap time in milliseconds. |
| `total_time_ms`      | integer | yes      | Total race time in milliseconds. |
| `suspension`         | integer | no       | Tuning dial position. |
| `gear_ratio`         | integer | no       | Tuning dial position. |
| `differential`       | integer | no       | Tuning dial position. |
| `brake_balance`      | integer | no       | Tuning dial position. |
| `notes`              | string  | no       | Free-form notes stored on the race. |
| `lap_count`          | integer | no       | Number of laps in the race. Defaults to the length of `lap_times_ms` when omitted. |
| `lap_times_ms`       | array   | no       | JSON array of per-lap times in milliseconds, in lap order — first entry is lap 1, second is lap 2, and so on (e.g. `[19160, 18994, 19340]`). Stored as a JSON object on the race and charted in the race's expand drawer on the track page. |

If all four tuning fields are provided, they're combined server-side into
a single `tuning` code as `suspension*1000 + gear_ratio*100 +
differential*10 + brake_balance` (e.g. `3, 2, 4, 1` → `3241`). If any are
omitted, `tuning` is left `null`.

The race's timestamp is always set to the server's current time — there
is no way to submit a backdated race through this endpoint.

### Example request

```bash
curl -X POST "{SUPABASE_URL}/rest/v1/rpc/insert_race_with_api_key_wf1" \
  -H "apikey: {SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "PASTE_YOUR_RAW_API_KEY_HERE",
    "track": "Bloomfield Speedway",
    "variant": "Figure 8",
    "vehicle": "RoadSlayer",
    "performance_index": 163,
    "suspension": 3,
    "gear_ratio": 2,
    "differential": 4,
    "brake_balance": 1,
    "place": 1,
    "lap_time_ms": 19160,
    "total_time_ms": 42154,
    "lap_count": 3,
    "lap_times_ms": [19160, 18994, 19340]
  }'
```

## Responses

All responses are `HTTP 200` with a JSON body describing success/failure
(the function never raises a Postgres error for expected failure cases —
only truly unexpected conditions would surface as a non-200 PostgREST
error).

**Success:**
```json
{ "success": true, "race_id": "b3f1... (uuid)" }
```

**Invalid API key** (key doesn't exist, was deleted, or is malformed):
```json
{ "success": false, "error": "Invalid API key" }
```

**Unknown track/variant:**
```json
{ "success": false, "error": "Track/variant not found: Bloomfield Speedway/Figure 8" }
```

**Negative performance index:**
```json
{ "success": false, "error": "performance_index must be >= 0" }
```

**`lap_times_ms` sent as something other than a JSON array:**
```json
{ "success": false, "error": "lap_times_ms must be a JSON array" }
```

**Negative lap count:**
```json
{ "success": false, "error": "lap_count must be >= 0" }
```

**Unknown vehicle name:** not an error — the race is still inserted with
`vehicle_id = null`.

## Known gaps (v1)

- No duplicate-submission protection — calling this twice with identical
  data inserts two races.
- No public "list valid track/variant/vehicle names" endpoint — the
  calling tool is expected to already know what to send.
- Track/variant matching is **exact name only** (case-insensitive, no
  fuzzy matching).
