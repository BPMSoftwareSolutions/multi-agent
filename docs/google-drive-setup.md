# Google Drive Setup

Use local-only credentials. Do not paste secrets into chat and do not commit them.

## Local Files

Create `.env.local` in the repo root with:

```env
GOOGLE_DRIVE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=your-client-secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3030/drive/auth/callback
```

`.env.local` is git-ignored.

OAuth tokens will be stored in:

```text
SQL Server table: studio.oauth_tokens
```

The current session pointer is stored in `studio.app_state` and sessions are stored in `studio.sessions`.

## Google Cloud Console

1. Create or select a Google Cloud project.
2. Enable the Google Drive API.
3. Configure the OAuth consent screen.
4. Create an OAuth Client ID of type `Web application`.
5. Add this authorized redirect URI:

```text
http://localhost:3030/drive/auth/callback
```

## Run

1. Start the app with `npm start`.
2. Open the UI.
3. Click `Connect Drive`.
4. Complete Google auth.
5. Resolve and import your folder path.

## Recommended Scope of Access

This app currently requests broad Drive access because it needs to browse, rename, and move files.

## Notes

1. Keep credentials in `.env.local` only.
2. Keep credentials in `.env.local` only.
3. If you rotate the client secret or want a clean reconnect, delete the `google-drive` row from `studio.oauth_tokens` and reconnect.