# Ngrok — expose the local API to a phone

Use this when the phone cannot open `http://<PC-IP>:4000/api/health` (same Wi‑Fi still fails). The API is on **port 4000**, not 3000.

## One-time

```powershell
winget install ngrok.ngrok
```

Reopen the terminal, then:

```powershell
ngrok config add-authtoken YOUR_TOKEN
```

Get the token at https://dashboard.ngrok.com

## Each session (3 terminals)

**1. API**

```powershell
cd C:\Users\tamas\SAFICK\backend
npm run dev
```

Wait for `Safick backend running on http://localhost:4000`.

**2. Ngrok**

```powershell
ngrok http 4000
```

Copy the **https** URL (example: `https://abc123.ngrok-free.app`).

**3. App**

In `frontend/.env` set the live URL (not a comment):

```
EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app
```

No trailing slash. No `:4000` on the ngrok host.

```powershell
cd C:\Users\tamas\SAFICK\frontend
npx expo start --dev-client --tunnel -c
```

## Check

On the **phone browser**: `https://abc123.ngrok-free.app/api/health`

You want `"status":"ok"`. Then sign-in and For You can work.

Keep ngrok running. The free URL changes each restart — update `.env` and run Expo with `-c` again.
