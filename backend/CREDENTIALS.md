# Credentials Setup

## Gmail API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Download credentials and save as `credentials.json` in this directory
6. Run the application to generate `token.json`

## Required Files

- `credentials.json` - OAuth client credentials from Google Cloud
- `token.json` - Generated automatically after first authentication

## Environment Variables

Create a `.env` file if needed for additional configuration:
```
FLASK_ENV=development
PORT=5000
```

## Security Notes

- Never commit `credentials.json` or `token.json` to git
- These files are already in `.gitignore`
