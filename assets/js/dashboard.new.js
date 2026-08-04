"use strict";

if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
}

const STORAGE_KEYS = {
    currentUser: "gradeflow_current_user",
    students: "gradeflow_students",
    results: "gradeflow_results"
};

function loadCurrentUser() {
    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));

    if (!currentUser) {
        window.location.href = "../auth/auth.html";
        return;
    }

    const teacherName = document.getElementById("teacherName");
    const heroUserName = document.getElementById("heroUserName");
    const profileImage = document.querySelector(".profile-image");

    if (teacherName) teacherName.textContent = currentUser.name;
    if (heroUserName) heroUserName.textContent = currentUser.name;
    if (profileImage) profileImage.textContent = currentUser.name.charAt(0).toUpperCase();
}

function logout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", (event) => {
        event.preventDefault();
        localStorage.removeItem(STORAGE_KEYS.currentUser);
        window.location.href = "../auth/auth.html";
    });
}

function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.getElementById("sidebarToggle");

    if (!sidebar || !toggleBtn) return;

    toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        const icon = toggleBtn.querySelector("i");
        if (!icon) return;

        icon.setAttribute("data-lucide", sidebar.classList.contains("collapsed") ? "panel-left-open" : "panel-left-close");
        window.lucide?.createIcons();
        window.renderIcons?.();
    });
}

function mobileSidebar() {
    const menuBtn = document.getElementById("mobileMenuBtn");
    const sidebar = document.querySelector(".sidebar");
    const closeBtn = document.getElementById("closeSidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (!menuBtn || !sidebar || !closeBtn || !overlay) return;

    menuBtn.addEventListener("click", () => {
        sidebar.classList.add("open");
        overlay.classList.add("active");
    });

    overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
    });

    closeBtn.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
    });
}

function loadCurrentDate() {
    const currentDate = document.getElementById("currentDate");
    if (!currentDate) return;

    const options = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    };

    currentDate.textContent = new Date().toLocaleDateString("en-US", options);
}

function studentModal() {
    const modal = document.getElementById("studentModal");
    const openBtn = document.getElementById("openStudentModal");
    const closeBtn = document.getElementById("closeStudentModal");

    if (!modal || !openBtn || !closeBtn) return;

    openBtn.addEventListener("click", () => modal.classList.remove("hidden"));
    closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

    modal.addEventListener("click", (event) => {
        if (event.target === modal) modal.classList.add("hidden");
    });
}

function classTypeHandler() {
    const type = document.getElementById("studentClassType");
    const existing = document.getElementById("existingClassGroup");
    const newClass = document.getElementById("newClassGroup");

    if (!type || !existing || !newClass) return;

    const updateView = () => {
        existing.classList.add("hidden");
        newClass.classList.add("hidden");

        if (type.value === "existing") existing.classList.remove("hidden");
        if (type.value === "new") newClass.classList.remove("hidden");
    };

    type.addEventListener("change", updateView);
    updateView();
}

function getStudents() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.students)) || [];
    } catch (error) {
        console.error("Unable to read students", error);
        return [];
    }
}

function saveStudents(students) {
    localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(students));
}

function getResults() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.results)) || [];
    } catch (error) {
        console.error("Unable to read results", error);
        return [];
    }
}

function saveResults(results) {
    localStorage.setItem(STORAGE_KEYS.results, JSON.stringify(results));
}

let editStudentId = null;

function saveStudent() {
    const form = document.getElementById("studentForm");
    if (!form) return;

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const students = getStudents();
        const classType = document.getElementById("studentClassType")?.value || "none";
        const existingClass = document.getElementById("existingClass")?.value || "";
        const newClassName = document.getElementById("newClassName")?.value.trim() || "";
        const className = classType === "existing"
            ? existingClass
            : classType === "new"
                ? newClassName
                : document.getElementById("studentClass")?.value.trim() || "No Class";

        const student = {
            id: editStudentId || crypto.randomUUID(),
            name: document.getElementById("studentName")?.value.trim() || "",
            roll: document.getElementById("studentRoll")?.value.trim() || "",
            className,
            section: document.getElementById("studentSection")?.value.trim() || "A",
            gender: document.getElementById("studentGender")?.value || "Male"
        };

        if (!student.name || !student.roll) {
            alert("Please provide the student name and roll number.");
            return;
        }

        if (editStudentId) {
            const index = students.findIndex((item) => item.id === editStudentId);
            if (index >= 0) {
                students[index] = { ...students[index], ...student };
            }
            editStudentId = null;
        } else {
            students.push(student);
        }

        saveStudents(students);
        renderStudents();
        renderRecentStudents();
        renderResultStudentOptions();
        form.reset();
        document.getElementById("studentModal")?.classList.add("hidden");
        alert("Student saved successfully");
    });
}

function updateStudentStatistics() {
    const totalStudents = document.getElementById("totalStudents");
    const totalSubjects = document.getElementById("totalSubjects");
    const totalResults = document.getElementById("totalResults");
    const totalClasses = document.getElementById("totalClasses");
    const students = getStudents();
    const results = getResults();

    if (totalStudents) totalStudents.textContent = students.length;
    if (totalSubjects) totalSubjects.textContent = "6";
    if (totalResults) totalResults.textContent = results.length;
    if (totalClasses) {
        const uniqueClasses = new Set(students.filter((student) => student.className && student.className !== "No Class").map((student) => student.className));
        totalClasses.textContent = uniqueClasses.size;
    }
}

function renderStudents() {
    const tableBody = document.getElementById("studentsTableBody");
    const searchValue = document.getElementById("studentSearch")?.value.toLowerCase().trim() || "";
    const students = getStudents().filter((student) => {
        return student.name.toLowerCase().includes(searchValue) || student.roll.toLowerCase().includes(searchValue);
    });

    if (!tableBody) return;

    if (students.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="empty-row">No students added yet.</td></tr>`;
        updateStudentStatistics();
        return;
    }

    tableBody.innerHTML = "";
    students.forEach((student) => {
        tableBody.innerHTML += `
            <tr>
                <td>${student.roll}</td>
                <td>${student.name}</td>
                <td>${student.className}</td>
                <td>${student.section}</td>
                <td>${student.gender}</td>
                <td>
                    <button class="table-btn edit-btn" onclick="editStudent('${student.id}')">Edit</button>
                    <button class="table-btn delete-btn" onclick="deleteStudent('${student.id}')">Delete</button>
                </td>
            </tr>`;
    });

    updateStudentStatistics();
}

function renderRecentStudents() {
    const container = document.getElementById("recentStudentsList");
    const seeAllBtn = document.getElementById("seeAllStudents");
    if (!container || !seeAllBtn) return;

    const allStudents = getStudents();
    const students = allStudents.slice(-3).reverse();
    seeAllBtn.classList.toggle("hidden", allStudents.length <= 3);

    if (students.length === 0) {
        container.innerHTML = '<div class="empty-state">No students added yet.</div>';
        return;
    }

    container.innerHTML = "";
    students.forEach((student) => {
        container.innerHTML += `
            <div class="recent-student">
                <div class="student-info">
                    <h4>${student.name}</h4>
                    <p>Roll: ${student.roll}</p>
                </div>
            </div>`;
    });
}

function showView(viewName) {
    const sections = {
        dashboard: ["heroSection", "statsSection", "quickActionsSection", "activitySection", "recentStudentsSection"],
        students: ["studentsSection"],
        results: ["resultsSection"],
        reports: ["reportsSection"],
        settings: ["settingsSection"]
    };

    const allSectionIds = ["heroSection", "statsSection", "quickActionsSection", "activitySection", "recentStudentsSection", "studentsSection", "resultsSection", "reportsSection", "settingsSection"];

    allSectionIds.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.toggle("hidden", !sections[viewName]?.includes(sectionId));
        }
    });

    document.querySelectorAll(".menu-item").forEach((item) => {
        item.classList.toggle("active", item.dataset.view === viewName);
    });
}

function setupNavigation() {
    document.querySelectorAll(".menu-item").forEach((item) => {
        item.addEventListener("click", (event) => {
            event.preventDefault();
            const viewName = item.dataset.view;
            if (viewName) showView(viewName);
        });
    });

    document.getElementById("studentsNav")?.addEventListener("click", (event) => {
        event.preventDefault();
        showView("students");
    });

    document.getElementById("seeAllStudents")?.addEventListener("click", (event) => {
        event.preventDefault();
        showView("students");
    });

    document.getElementById("addStudentBtn")?.addEventListener("click", () => {
        document.getElementById("studentModal")?.classList.remove("hidden");
    });

    document.getElementById("generateResultBtn")?.addEventListener("click", () => {
        showView("results");
    });

    document.getElementById("viewReportsBtn")?.addEventListener("click", () => {
        showView("reports");
    });
}

function editStudent(id) {
    const students = getStudents();
    const student = students.find((item) => item.id === id);
    if (!student) return;

    document.getElementById("studentName").value = student.name;
    document.getElementById("studentRoll").value = student.roll;
    document.getElementById("studentClass").value = student.className;
    document.getElementById("studentSection").value = student.section;
    document.getElementById("studentGender").value = student.gender;

    editStudentId = id;
    document.getElementById("studentModal")?.classList.remove("hidden");
}

function deleteStudent(id) {
    const confirmDelete = confirm("Are you sure you want to delete this student?");
    if (!confirmDelete) return;

    const students = getStudents().filter((student) => student.id !== id);
    saveStudents(students);
    renderStudents();
    renderRecentStudents();
    renderResultStudentOptions();
}

function searchStudents() {
    const searchInput = document.getElementById("studentSearch");
    if (!searchInput) return;
    searchInput.addEventListener("input", renderStudents);
}

function renderResultStudentOptions() {
    const select = document.getElementById("resultStudent");
    const subjectSelect = document.getElementById("resultSubjects");
    if (!select) return;

    const students = getStudents();
    select.innerHTML = '<option value="">Choose a student</option>' + students.map((student) => `<option value="${student.id}">${student.name} • ${student.roll}</option>`).join("");

    if (subjectSelect) {
        subjectSelect.innerHTML = [
            ["Mathematics", "Math"],
            ["English", "Eng"],
            ["Science", "Sci"],
            ["Social Studies", "Sst"],
            ["Computer", "Comp"],
            ["Biology", "Bio"]
        ].map(([label, value]) => `<option value="${value}">${label}</option>`).join("");
    }
}

function renderMarksInputs() {
    const container = document.getElementById("marksInputs");
    const selectedSubjects = Array.from(document.getElementById("resultSubjects")?.selectedOptions || []).map((option) => ({ value: option.value, label: option.text }));
    if (!container) return;

    if (selectedSubjects.length === 0) {
        container.innerHTML = '<p class="empty-state">Choose at least one subject to enter marks.</p>';
        return;
    }

    container.innerHTML = selectedSubjects.map((subject) => `
        <div class="input-group">
            <label for="mark-${subject.value}">${subject.label}</label>
            <input id="mark-${subject.value}" type="number" min="0" max="100" placeholder="Enter marks" required>
        </div>`).join("");
}

function calculateResult(studentName, selectedSubjects, marks) {
    const totalMarks = selectedSubjects.length * 100;
    const obtainedMarks = marks.reduce((sum, mark) => sum + Number(mark), 0);
    const percentage = totalMarks === 0 ? 0 : (obtainedMarks / totalMarks) * 100;
    let grade = "F";
    let status = "Fail";

    if (percentage >= 85) grade = "A";
    else if (percentage >= 70) grade = "B";
    else if (percentage >= 55) grade = "C";
    else if (percentage >= 40) grade = "D";

    if (percentage >= 40) status = "Pass";

    return {
        studentName,
        selectedSubjects,
        marks,
        totalMarks,
        obtainedMarks,
        percentage: percentage.toFixed(1),
        grade,
        status,
        position: "1st"
    };
}

function setupResultGenerator() {
    const form = document.getElementById("resultForm");
    const resultPreview = document.getElementById("resultPreview");
    const resultList = document.getElementById("resultsList");

    if (!form || !resultPreview || !resultList) return;

    document.getElementById("resultSubjects")?.addEventListener("change", renderMarksInputs);

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const studentId = document.getElementById("resultStudent")?.value;
        const student = getStudents().find((item) => item.id === studentId);
        const selectedSubjects = Array.from(document.getElementById("resultSubjects")?.selectedOptions || []).map((option) => option.text);
        const selectedValues = Array.from(document.getElementById("resultSubjects")?.selectedOptions || []).map((option) => option.value);
        const marks = selectedValues.map((value) => {
            const input = document.getElementById(`mark-${value}`);
            return input ? input.value : 0;
        });

        if (!student || selectedSubjects.length === 0) {
            resultPreview.innerHTML = '<p>Please choose a student and at least one subject.</p>';
            return;
        }

        const result = calculateResult(student.name, selectedSubjects, marks);
        const results = getResults();
        results.unshift({ ...result, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
        saveResults(results);

        resultPreview.innerHTML = `
            <p><strong>Student:</strong> ${result.studentName}</p>
            <p><strong>Subjects:</strong> ${result.selectedSubjects.join(", ")}</p>
            <p><strong>Obtained Marks:</strong> ${result.obtainedMarks}</p>
            <p><strong>Total Marks:</strong> ${result.totalMarks}</p>
            <p><strong>Percentage:</strong> ${result.percentage}%</p>
            <p><strong>Grade:</strong> ${result.grade}</p>
            <p><strong>Status:</strong> ${result.status}</p>`;

        updateStudentStatistics();
        renderResultsList();
    });
}

function renderResultsList() {
    const resultList = document.getElementById("resultsList");
    if (!resultList) return;

    const results = getResults();

    if (results.length === 0) {
        resultList.innerHTML = '<div class="empty-state">No results generated yet.</div>';
        return;
    }

    resultList.innerHTML = results.slice(0, 4).map((result) => `
        <div class="result-item">
            <strong>${result.studentName}</strong>
            <p>${result.selectedSubjects.join(", ")}</p>
            <p>${result.percentage}% • ${result.grade} • ${result.status}</p>
        </div>`).join("");
}

document.addEventListener("DOMContentLoaded", () => {
    loadCurrentUser();
    logout();
    toggleSidebar();
    mobileSidebar();
    loadCurrentDate();
    studentModal();
    saveStudent();
    renderStudents();
    renderRecentStudents();
    searchStudents();
    classTypeHandler();
    setupNavigation();
    renderResultStudentOptions();
    setupResultGenerator();
    renderResultsList();
    updateStudentStatistics();
    showView("dashboard");
    window.renderIcons?.();
});
