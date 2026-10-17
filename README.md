# GradeFlow

GradeFlow is a React, Vite, and Tailwind application backed by Firebase Authentication and Cloud Firestore.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and enter your Firebase web app configuration.
3. Install dependencies and start Vite:

```bash
npm install
npm run dev
```

## Firebase setup

- Enable Email/Password and Google sign-in in Firebase Authentication.
- Create a Cloud Firestore database.
- Deploy the Firestore security rules from this repository:

```bash
npx firebase-tools deploy --only firestore:rules
```

- Create the admin account using the email configured as the admin in `src/firebase/firebase.js` and `firestore.rules`.
- Add your Vercel preview and production domains to Firebase Authentication's authorized domains.

The `VITE_FIREBASE_*` values are browser configuration, so Vite includes them in the client bundle. Keep `.env` out of GitHub; add the same variables in Vercel Project Settings → Environment Variables.

## Deploy through GitHub and Vercel

1. Push this project to a GitHub repository. Do not commit `.env` or `node_modules`.
2. In Vercel, import the GitHub repository.
3. Use the Vite defaults: install command `npm install`, build command `npm run build`, and output directory `dist`.
4. Add all required `VITE_FIREBASE_*` values to Vercel for Preview and Production, then deploy.
5. Add the Vercel domains to Firebase Authentication's authorized domains.

`vercel.json` rewrites application routes to `index.html`, so React Router paths such as `/teacher` and `/admin` work on refresh and direct visits.

## Useful commands

```bash
npm run dev      # local development
npm run build    # production build
npm run preview  # preview the production build locally
```
