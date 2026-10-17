# Database structure

Firebase credentials and actual database operations are intentionally NOT included.

Suggested collections:

users/{uid}
  - name
  - email
  - role: "teacher" | "admin"
  - approvalStatus: "pending" | "approved" | "rejected"
  - planId
  - studentLimit
  - subscriptionStart
  - subscriptionExpiry

teachers/{uid}
  - profile fields
  - approvalStatus
  - planId
  - studentLimit
  - subscriptionExpiry

teachers/{uid}/students/{studentId}
teachers/{uid}/classes/{classId}
teachers/{uid}/subjects/{subjectId}
teachers/{uid}/exams/{examId}
teachers/{uid}/results/{resultId}

plans/{planId}
  - name
  - studentLimit
  - durationDays
  - price
  - active

payments/{paymentId}
  - teacherId
  - planId
  - amount
  - status
  - createdAt

Admins should be controlled by secure server-side rules/custom claims, not by trusting a role field from the client alone.