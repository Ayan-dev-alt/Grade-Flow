import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
} from "firebase/auth";
import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp,
    collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, getDoc, getDocs, where,
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

function resolveTeacherStatus(profile = {}) {
    if (profile.isActive === false || profile.active === false) return "suspended";
    const raw = String(profile.status || profile.approvalStatus || "pending").toLowerCase();
    if (["approved", "active"].includes(raw)) return "approved";
    if (["suspended", "inactive", "disabled", "rejected"].includes(raw)) return "suspended";
    return "pending";
}

export function getFriendlyErrorMessage(error, fallback = "Something went wrong. Please try again.") {
    const code = error?.code || "";
    const messages = {
        "auth/invalid-email": "That email address is not valid. Check it and try again.",
        "auth/user-not-found": "We couldn't find an account with that email. Check the address or choose Sign up to create an account.",
        "auth/wrong-password": "That password doesn't match this account. Try again or use Forgot password.",
        "auth/invalid-credential": "The email or password is incorrect. Check your details, or choose Continue with Google if you created your account with Google.",
        "auth/email-already-in-use": "An account already uses this email. Sign in instead, or choose Continue with Google if you registered with Google.",
        "auth/weak-password": "Choose a stronger password with at least 6 characters.",
        "auth/too-many-requests": "Too many attempts were made. Wait a few minutes, then try again.",
        "auth/network-request-failed": "We couldn't connect to the sign-in service. Check your internet connection and try again.",
        "auth/operation-not-allowed": "This sign-in method is disabled. Ask the administrator to enable it in Firebase Authentication.",
        "auth/unauthorized-domain": "This website isn't authorized for Firebase sign-in. Ask the administrator to add this domain in Firebase Authentication.",
        "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups for this site, then try again.",
        "auth/popup-closed-by-user": "Google sign-in was closed before it finished. Choose Continue with Google to try again.",
        "auth/cancelled-popup-request": "Another sign-in window is already open. Finish it or close it, then try again.",
        "permission-denied": "You don't have permission to do that. Check that you are signed in with the right account, then try again. Contact the administrator if this continues.",
        "unavailable": "The database is temporarily unavailable. Check your connection and try again in a moment.",
        "deadline-exceeded": "The request took too long. Check your connection and try again.",
        "not-found": "This item may have already been deleted. Refresh the page and try again.",
    };
    return messages[code] || fallback;
}

export function useAuthSession() {
    const [session, setSession] = useState({ loading: true, user: null, profile: null, role: null, status: null });
    useEffect(() => {
        let stopProfile = null;
        const stopAuth = onAuthStateChanged(auth, (user) => {
            if (stopProfile) stopProfile();
            if (!user) { setSession({ loading: false, user: null, profile: null, role: null, status: null }); return; }
            if (user.email?.toLowerCase() === "m.ayanali051@gmail.com") {
                setSession({ loading: false, user, profile: null, role: "admin", status: "approved" });
                return;
            }
            setSession({ loading: true, user, profile: null, role: "teacher", status: null });
            stopProfile = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
                const profile = snapshot.exists() ? snapshot.data() : null;
                setSession({ loading: false, user, profile, role: profile?.role || "teacher", status: resolveTeacherStatus(profile) });
            }, (error) => { console.error("Unable to load account profile", error); setSession({ loading: false, user, profile: null, role: "teacher", status: "pending", error }); });
        });
        return () => { stopAuth(); if (stopProfile) stopProfile(); };
    }, []);
    return session;
}

export async function getAccountSession(user) {
    if (user.email?.toLowerCase() === "m.ayanali051@gmail.com") return { role: "admin", status: "approved" };
    const snapshot = await getDoc(doc(db, "users", user.uid));
    const profile = snapshot.exists() ? snapshot.data() : {};
    return { role: profile.role || "teacher", status: resolveTeacherStatus(profile) };
}

export function subscribeTeachers(callback, onError) {
    return onSnapshot(collection(db, "users"), (snapshot) => callback(snapshot.docs.map((item) => {
        const data = item.data();
        return { id: item.id, ...data, status: resolveTeacherStatus(data) };
    }).filter((item) => item.role === "teacher")), onError);
}
export function subscribeTeacherData(uid, callback, onError) {
    return onSnapshot(doc(db, "teacherData", uid), (snapshot) => callback(snapshot.exists() ? snapshot.data() : { className: "", subjects: [], students: [] }), onError);
}
export function saveTeacherData(uid, data) {
    const { updatedAt, ...cleanData } = data;
    return setDoc(doc(db, "teacherData", uid), { ...cleanData, updatedAt: serverTimestamp() }, { merge: true });
}
export function setTeacherStatus(uid, status) {
    return updateDoc(doc(db, "users", uid), {
        status,
        approvalStatus: status,
        isActive: status === "approved",
        active: status === "approved",
        updatedAt: serverTimestamp(),
        ...(status === "approved" ? { approvedAt: serverTimestamp() } : {}),
    });
}
export function setTeacherPresence(uid, online) {
    return updateDoc(doc(db, "users", uid), {
        online,
        lastSeen: serverTimestamp(),
    });
}
export function startTeacherPresence(uid) {
    if (!uid) return () => {};
    const markOnline = () => setTeacherPresence(uid, true).catch((error) => console.error("Could not update online status", error));
    const markOffline = () => setTeacherPresence(uid, false).catch((error) => console.error("Could not update offline status", error));
    markOnline();
    const heartbeat = window.setInterval(markOnline, 20000);
    window.addEventListener("pagehide", markOffline);
    return () => {
        window.clearInterval(heartbeat);
        window.removeEventListener("pagehide", markOffline);
        markOffline();
    };
}
export function removeTeacher(uid) { return deleteDoc(doc(db, "users", uid)); }
export async function deleteNotificationEverywhere(notificationId) {
    const teachers = await getDocs(collection(db, "users"));
    await Promise.all([
        deleteDoc(doc(db, "notifications", notificationId)),
        ...teachers.docs.map((teacher) => deleteDoc(doc(db, "teacherInbox", teacher.id, "notifications", notificationId))),
    ]);
}
export function deleteTeacherNotification(uid, notificationId) {
    if (!uid) return Promise.resolve();
    return deleteDoc(doc(db, "teacherInbox", uid, "notifications", notificationId));
}
export function markTeacherNotificationRead(uid, notificationId) {
    if (!uid) return Promise.resolve();
    return updateDoc(doc(db, "teacherInbox", uid, "notifications", notificationId), { readAt: serverTimestamp() });
}
export function deleteComplaint(complaintId) {
    return deleteDoc(doc(db, "complaints", complaintId));
}
export function subscribeSupportThreads(callback, onError) {
    return onSnapshot(query(collection(db, "supportThreads"), orderBy("updatedAt", "desc")), (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError);
}
export function subscribeSupportMessages(uid, callback, onError) {
    if (!uid) return () => {};
    return onSnapshot(query(collection(db, "supportThreads", uid, "messages"), orderBy("createdAt", "asc")), (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError);
}
export async function sendTeacherSupportMessage(uid, profile, message) {
    const content = message.trim();
    if (!uid || !content) throw new Error("Message is required.");
    const threadRef = doc(db, "supportThreads", uid);
    await addDoc(collection(threadRef, "messages"), { sender: "teacher", message: content, createdAt: serverTimestamp() });
    await setDoc(threadRef, {
        teacherId: uid,
        teacherName: profile.displayName || profile.name || "Teacher",
        email: profile.email || "",
        phone: profile.phone || "",
        lastSender: "teacher",
        lastMessage: content,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}
export async function sendAdminSupportMessage(uid, message) {
    const content = message.trim();
    if (!uid || !content) throw new Error("Message is required.");
    const threadRef = doc(db, "supportThreads", uid);
    await addDoc(collection(threadRef, "messages"), { sender: "admin", message: content, createdAt: serverTimestamp() });
    await setDoc(threadRef, { teacherId: uid, lastSender: "admin", lastMessage: content, updatedAt: serverTimestamp() }, { merge: true });
}
export function subscribeComplaints(uid, callback, onError) {
    const constraints = [orderBy("createdAt", "desc")];
    if (uid) constraints.unshift(where("teacherId", "==", uid));
    return onSnapshot(query(collection(db, "complaints"), ...constraints), (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError);
}
export function submitComplaint(uid, complaint) {
    return addDoc(collection(db, "complaints"), { ...complaint, teacherId: uid, createdAt: serverTimestamp() });
}
export function subscribeTeacherNotifications(uid, callback, onError) {
    if (!uid) return () => {};
    return onSnapshot(query(collection(db, "teacherInbox", uid, "notifications"), orderBy("createdAt", "desc")), (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError);
}
export function subscribeNotifications(callback, onError) {
    return onSnapshot(query(collection(db, "notifications"), orderBy("createdAt", "desc")), (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError);
}
export function subscribePlans(callback, onError) {
    return onSnapshot(query(collection(db, "plans"), orderBy("name")), (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError);
}
export function savePlan(plan) {
    const planRef = plan.id ? doc(db, "plans", plan.id) : doc(collection(db, "plans"));
    const { id, ...data } = plan;
    return setDoc(planRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}
export function deletePlan(planId) {
    return deleteDoc(doc(db, "plans", planId));
}
export async function createNotification(notification) {
    const createdAt = serverTimestamp();
    const result = await addDoc(collection(db, "notifications"), { ...notification, createdAt });
    const teachers = await getDocs(collection(db, "users"));
    const recipient = notification.recipient?.toLowerCase();
    const targets = teachers.docs.filter((item) => {
        const teacher = item.data();
        if (teacher.role !== "teacher" || teacher.status !== "approved") return false;
        return notification.targetType === "all" || teacher.name?.toLowerCase() === recipient || teacher.displayName?.toLowerCase() === recipient;
    });
    await Promise.all(targets.map((teacher) => setDoc(doc(db, "teacherInbox", teacher.id, "notifications", result.id), {
        ...notification, id: result.id, createdAt,
    })));
    return result;
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function createUserProfile(user, extra = {}) {
    const profileRef = doc(db, "users", user.uid);
    const existing = await getDoc(profileRef);
    const previous = existing.exists() ? existing.data() : {};
    const deactivated = ["suspended", "inactive", "disabled", "rejected"].includes(String(previous.status || "").toLowerCase())
        || ["suspended", "inactive", "disabled", "rejected"].includes(String(previous.approvalStatus || "").toLowerCase())
        || previous.isActive === false
        || previous.active === false;
    const accountStatus = deactivated ? "suspended" : "approved";
    const profile = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || extra.name || "",
        name: extra.name || previous.name || user.displayName || "",
        phone: extra.phone?.trim() || previous.phone || "",
        photoURL: user.photoURL || "",
        role: previous.role || "teacher",
        status: accountStatus,
        approvalStatus: accountStatus,
        isActive: accountStatus === "approved",
        active: accountStatus === "approved",
        ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp(),
        ...extra,
    };
    await setDoc(profileRef, profile, { merge: true });
    return profile;
}

export async function signUpWithEmail({ name, email, password, phone = "" }) {
    if (!name || !email || !password || !phone.trim()) throw new Error("Name, phone number, email, and password are required.");
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName: name });
    await createUserProfile(user, { name, phone, role: "teacher" });
    return user;
}

export async function loginWithEmail({ email, password }) {
    if (!email || !password) throw new Error("Email and password are required.");
    const { user } = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    if (user.email?.toLowerCase() !== "m.ayanali051@gmail.com") await createUserProfile(user);
    return user;
}

export async function signInWithGoogle(phone = "") {
    const { user } = await signInWithPopup(auth, googleProvider);
    if (user.email?.toLowerCase() !== "m.ayanali051@gmail.com") {
        const profile = await getDoc(doc(db, "users", user.uid));
        if (!profile.exists() && !phone.trim()) {
            const error = new Error("New teacher account");
            error.code = "gradeflow/new-google-account";
            throw error;
        }
        await createUserProfile(user, phone.trim() ? { phone: phone.trim() } : {});
    }
    return user;
}

export async function resetPassword(email) {
    const normalizedEmail = (email || "").trim();

    if (!normalizedEmail) {
        throw new Error("Please enter your email address.");
    }

    const baseUrl =
        typeof window !== "undefined" && window.location?.origin
            ? `${window.location.origin}/auth`
            : "http://localhost:5173/auth";

    await sendPasswordResetEmail(auth, normalizedEmail, {
        url: `${baseUrl}?mode=reset`,
        handleCodeInApp: true,
    });

    return normalizedEmail;
}

export async function logout() {
    await signOut(auth);
}
