"use strict";

if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
}

const STORAGE_KEYS = {
    currentUser: "gradeflow_current_user",
    students: "gradeflow_students",
    results: "gradeflow_results",
    classes: "gradeflow_classes",
    subjects: "gradeflow_subjects",
    exams: "gradeflow_exams",
    grades: "gradeflow_grades",
    rules: "gradeflow_rules"
};

const DEFAULT_PASS_MARK = 40;

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

function getConfig(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
        return [];
    }
}

function saveConfig(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getClasses() {
    return getConfig(STORAGE_KEYS.classes);
}

function saveClasses(classes) {
    saveConfig(STORAGE_KEYS.classes, classes);
}

function getSubjects() {
    return getConfig(STORAGE_KEYS.subjects);
}

function saveSubjects(subjects) {
    saveConfig(STORAGE_KEYS.subjects, subjects);
}

function getExams() {
    return getConfig(STORAGE_KEYS.exams);
}

function saveExams(exams) {
    saveConfig(STORAGE_KEYS.exams, exams);
}

function getGrades() {
    return getConfig(STORAGE_KEYS.grades);
}

function saveGrades(grades) {
    saveConfig(STORAGE_KEYS.grades, grades);
}

function getRules() {
    const rules = getConfig(STORAGE_KEYS.rules);
    return {
        overallPassingPercentage: 40,
        positionRule: "highest_percentage",
        ...rules
    };
}

function saveRules(rules) {
    saveConfig(STORAGE_KEYS.rules, rules);
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
    const configuredSubjects = getSubjects();
    const configuredClasses = getClasses();

    if (totalStudents) totalStudents.textContent = students.length;
    if (totalSubjects) totalSubjects.textContent = configuredSubjects.length;
    if (totalResults) totalResults.textContent = results.length;
    if (totalClasses) {
        const uniqueClasses = new Set(students.filter((student) => student.className && student.className !== "No Class").map((student) => student.className));
        totalClasses.textContent = configuredClasses.length > 0 ? configuredClasses.length : uniqueClasses.size;
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

    document.getElementById("rankStudentsBtn")?.addEventListener("click", () => {
        showView("results");
        renderRankingList();
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
    const classSelect = document.getElementById("resultClass");
    const examSelect = document.getElementById("resultExam");
    if (!select) return;

    const students = getStudents();
    const classes = getClasses();
    const exams = getExams();
    const selectedClass = classSelect?.value || "";
    const filteredStudents = selectedClass
        ? students.filter((student) => student.className === selectedClass)
        : students;
    const currentValue = select.value;

    select.innerHTML = '<option value="">Choose a student</option>' + filteredStudents.map((student) => `<option value="${student.id}">${student.name} • ${student.roll}</option>`).join("");

    if (currentValue && filteredStudents.some((student) => student.id === currentValue)) {
        select.value = currentValue;
    }

    if (classSelect) {
        classSelect.innerHTML = '<option value="">All Classes</option>' + classes.map((item) => `<option value="${item.name}">${item.name}</option>`).join("");
        if (selectedClass) {
            classSelect.value = selectedClass;
        }
    }

    if (examSelect) {
        examSelect.innerHTML = exams.length > 0
            ? exams.map((exam) => `<option value="${exam.name}">${exam.name}</option>`).join("")
            : '<option value="">No exams configured</option>';
    }

    const subjects = getSubjects();
    const marksContainer = document.getElementById("marksInputs");
    if (marksContainer) {
        if (subjects.length === 0) {
            marksContainer.innerHTML = '<p class="empty-state">Add subjects from settings first.</p>';
            return;
        }

        marksContainer.innerHTML = subjects.map((subject) => `
            <div class="input-group">
                <label for="mark-${subject.name}">${subject.name} <span class="subtle-text">(${subject.totalMarks || 0} marks)</span></label>
                <input id="mark-${subject.name}" type="number" min="0" max="${subject.totalMarks || 100}" placeholder="Enter marks" required>
            </div>`).join("");
    }
}

function calculateResult(student, selectedSubjects, marks) {
    const rules = getRules();
    const passThreshold = Number(rules.overallPassingPercentage || DEFAULT_PASS_MARK);
    const totalMarks = selectedSubjects.reduce((sum, subject) => sum + Number(subject.totalMarks || 0), 0);
    const obtainedMarks = marks.reduce((sum, mark) => sum + Number(mark), 0);
    const percentage = totalMarks === 0 ? 0 : (obtainedMarks / totalMarks) * 100;
    const grades = getGrades();
    const matchingGrade = grades
        .slice()
        .sort((a, b) => Number(b.minPercentage) - Number(a.minPercentage))
        .find((grade) => percentage >= Number(grade.minPercentage));
    const grade = matchingGrade ? matchingGrade.name : "F";
    const status = percentage >= passThreshold ? "Pass" : "Fail";

    return {
        studentId: student.id,
        studentName: student.name,
        studentRoll: student.roll,
        studentClassName: student.className,
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

function getLatestStudentResult(student) {
    const results = getResults();
    const studentResults = results.filter((result) => {
        if (result.studentId && student.id && result.studentId === student.id) {
            return true;
        }

        if (result.studentRoll && student.roll && String(result.studentRoll) === String(student.roll)) {
            return true;
        }

        if (result.studentName && student.name) {
            return String(result.studentName).toLowerCase() === String(student.name).toLowerCase();
        }

        return false;
    });

    if (studentResults.length === 0) {
        return null;
    }

    return studentResults.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
}

function renderRankingList() {
    const container = document.getElementById("rankList");
    const summary = document.getElementById("rankingSummary");

    if (!container) return;

    const students = getStudents();
    const rules = getRules();
    const passThreshold = Number(rules.overallPassingPercentage || DEFAULT_PASS_MARK);
    const rankedStudents = students
        .map((student) => {
            const result = getLatestStudentResult(student);
            const percentageValue = result ? Number(result.percentage) : null;
            const marksValue = result ? Number(result.obtainedMarks) : null;
            const rankingValue = rules.positionRule === "total_marks" ? marksValue : percentageValue;
            const grade = result?.grade || "N/A";
            const status = result ? (rankingValue >= passThreshold ? "Pass" : "Fail") : "Pending";

            return {
                id: student.id,
                name: student.name,
                roll: student.roll,
                className: student.className || "No Class",
                percentageValue,
                marksValue,
                rankingValue,
                grade,
                status
            };
        })
        .sort((a, b) => {
            if (a.rankingValue === null && b.rankingValue === null) return a.name.localeCompare(b.name);
            if (a.rankingValue === null) return 1;
            if (b.rankingValue === null) return -1;
            return b.rankingValue - a.rankingValue || a.name.localeCompare(b.name);
        });

    rankedStudents.forEach((student, index) => {
        student.position = index + 1;
    });

    if (summary) {
        summary.innerHTML = `
            <p><strong>Pass Mark:</strong> ${passThreshold}%</p>
            <p>Ranking is generated from the latest result for each student.</p>
        `;
    }

    if (rankedStudents.length === 0) {
        container.innerHTML = '<div class="empty-state">No students added yet.</div>';
        return;
    }

    container.innerHTML = rankedStudents.map((student) => {
        const percentageText = student.percentageValue === null ? "No result yet" : `${student.percentageValue}%`;
        return `
            <div class="result-item ranking-item">
                <div class="ranking-badge">#${student.position}</div>
                <div class="ranking-meta">
                    <strong>${student.name}</strong>
                    <p>Roll: ${student.roll} • ${student.className}</p>
                    <p>${percentageText} • ${student.grade} • ${student.status}</p>
                </div>
            </div>
        `;
    }).join("");
}

function setupResultGenerator() {
    const form = document.getElementById("resultForm");
    const resultPreview = document.getElementById("resultPreview");
    const resultList = document.getElementById("resultsList");

    if (!form || !resultPreview || !resultList) return;

    document.getElementById("resultClass")?.addEventListener("change", renderResultStudentOptions);

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const studentId = document.getElementById("resultStudent")?.value;
        const student = getStudents().find((item) => item.id === studentId);
        const selectedSubjects = getSubjects();
        const marks = selectedSubjects.map((subject) => {
            const input = document.getElementById(`mark-${subject.name}`);
            return input ? input.value : 0;
        });

        if (!student || selectedSubjects.length === 0) {
            resultPreview.innerHTML = '<p>Please choose a student and add subjects from settings.</p>';
            return;
        }

        const result = calculateResult(student, selectedSubjects, marks);
        const results = getResults();
        results.unshift({
            ...result,
            examName: document.getElementById("resultExam")?.value || "",
            className: document.getElementById("resultClass")?.value || "",
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        });
        saveResults(results);

        resultPreview.innerHTML = `
            <p><strong>Student:</strong> ${result.studentName}</p>
            <p><strong>Exam:</strong> ${document.getElementById("resultExam")?.value || "Not selected"}</p>
            <p><strong>Subjects:</strong> ${result.selectedSubjects.map((subject) => subject.name || subject).join(", ")}</p>
            <p><strong>Obtained Marks:</strong> ${result.obtainedMarks}</p>
            <p><strong>Total Marks:</strong> ${result.totalMarks}</p>
            <p><strong>Percentage:</strong> ${result.percentage}%</p>
            <p><strong>Grade:</strong> ${result.grade}</p>
            <p><strong>Status:</strong> ${result.status}</p>`;

        updateStudentStatistics();
        renderResultsList();
        renderRankingList();
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
            <p>${result.selectedSubjects.map((subject) => subject.name || subject).join(", ")}</p>
            <p>${result.percentage}% • ${result.grade} • ${result.status}</p>
        </div>`).join("");
}

function renderConfigLists() {
    const classesList = document.getElementById("classesList");
    const subjectsList = document.getElementById("subjectsList");
    const examsList = document.getElementById("examsList");
    const gradesList = document.getElementById("gradesList");
    const rulesForm = document.getElementById("resultRulesForm");
    const overallPassInput = document.getElementById("overallPassPercentageInput");
    const positionRuleSelect = document.getElementById("positionRuleSelect");

    if (classesList) classesList.innerHTML = getClasses().map((item) => `<div class="config-item">${item.name}</div>`).join("");
    if (subjectsList) subjectsList.innerHTML = getSubjects().map((item) => `<div class="config-item">${item.name} • ${item.totalMarks || 0} marks • Pass ${item.passMarks || 0}</div>`).join("");
    if (examsList) examsList.innerHTML = getExams().map((item) => `<div class="config-item">${item.name}</div>`).join("");
    if (gradesList) gradesList.innerHTML = getGrades().map((item) => `<div class="config-item">${item.name} • ${item.minPercentage}% to ${item.maxPercentage}%</div>`).join("");

    if (rulesForm && overallPassInput && positionRuleSelect) {
        const rules = getRules();
        overallPassInput.value = rules.overallPassingPercentage;
        positionRuleSelect.value = rules.positionRule;
    }
}

function setupConfigForms() {
    const classForm = document.getElementById("classConfigForm");
    const subjectForm = document.getElementById("subjectConfigForm");
    const examForm = document.getElementById("examConfigForm");
    const gradeForm = document.getElementById("gradeConfigForm");
    const rulesForm = document.getElementById("resultRulesForm");

    classForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = document.getElementById("classNameInput");
        const name = input?.value.trim();
        if (!name) return;
        const classes = getClasses();
        classes.push({ name });
        saveClasses(classes);
        input.value = "";
        renderConfigLists();
        renderResultStudentOptions();
    });

    subjectForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const nameInput = document.getElementById("subjectNameInput");
        const totalInput = document.getElementById("subjectTotalMarksInput");
        const passInput = document.getElementById("subjectPassMarksInput");
        const name = nameInput?.value.trim();
        if (!name || !totalInput?.value || !passInput?.value) return;
        const subjects = getSubjects();
        subjects.push({ name, totalMarks: Number(totalInput.value), passMarks: Number(passInput.value) });
        saveSubjects(subjects);
        nameInput.value = "";
        totalInput.value = "";
        passInput.value = "";
        renderConfigLists();
        renderResultStudentOptions();
    });

    examForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = document.getElementById("examNameInput");
        const name = input?.value.trim();
        if (!name) return;
        const exams = getExams();
        exams.push({ name });
        saveExams(exams);
        input.value = "";
        renderConfigLists();
        renderResultStudentOptions();
    });

    gradeForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const nameInput = document.getElementById("gradeNameInput");
        const minInput = document.getElementById("gradeMinInput");
        const maxInput = document.getElementById("gradeMaxInput");
        const name = nameInput?.value.trim();
        const min = Number(minInput?.value || 0);
        const max = Number(maxInput?.value || 0);
        if (!name) return;
        const grades = getGrades();
        grades.push({ name, minPercentage: min, maxPercentage: max });
        saveGrades(grades);
        nameInput.value = "";
        minInput.value = "";
        maxInput.value = "";
        renderConfigLists();
    });

    rulesForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const overall = document.getElementById("overallPassPercentageInput")?.value;
        const positionRule = document.getElementById("positionRuleSelect")?.value;
        saveRules({ overallPassingPercentage: Number(overall || 40), positionRule });
        renderConfigLists();
    });
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
    setupConfigForms();
    renderConfigLists();
    setupResultGenerator();
    renderResultsList();
    renderRankingList();
    updateStudentStatistics();
    showView("dashboard");
    window.renderIcons?.();
});
