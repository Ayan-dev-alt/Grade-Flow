# Firebase data and access

The app uses Firebase Authentication for email/password and Google sign-in, and Cloud Firestore for teacher profiles, student records, complaints, notifications, support conversations, and admin-managed teacher plans.

## Configure the Firebase web app

Copy `.env.example` to `.env` and set the `VITE_FIREBASE_*` values from the Firebase Console. These are browser app configuration values; do not put service-account credentials or private keys in the Vite environment.

In Firebase Authentication, enable Email/Password and Google providers. Add every local, preview, and production hostname to Authentication's authorized domains. Create a Firestore database and deploy the root `firestore.rules` file.

## Firestore collections

- `users/{uid}` stores the teacher account profile and current access status.
- `teacherData/{uid}` stores that teacher's class name, subjects, students, and marks.
- `complaints/{id}` stores teacher-submitted complaints.
- `notifications/{id}` stores admin announcements; `teacherInbox/{uid}/notifications/{id}` stores each teacher's inbox copy.
- `supportThreads/{uid}` and its `messages` subcollection store deactivated-account support conversations.
- `plans/{id}` stores plans managed by the admin dashboard. Plans are currently informational; payments and automatic student-limit enforcement are not enabled.

The admin account is identified by the email configured in both `src/firebase/firebase.js` and `firestore.rules`. Keep those values in sync. Firestore rules, rather than hidden UI controls, enforce access to the data.
