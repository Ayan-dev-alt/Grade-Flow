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
            throw new Error("This is a new teacher account. Please choose Sign up and enter your phone number.");
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
