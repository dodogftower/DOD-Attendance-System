/* ===============================
   LIVE DATE & TIME
================================ */
function updateDateTime() {
    const now = new Date();
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const dateEl = document.getElementById("liveDate");
    const timeEl = document.getElementById("liveTime");
    if (dateEl) dateEl.innerText = now.toLocaleDateString(undefined, dateOptions);
    if (timeEl) timeEl.innerText = now.toLocaleTimeString(undefined, timeOptions);
}
setInterval(updateDateTime, 1000);
updateDateTime();

/* ===============================
   NAVIGATION & LOGIN
================================ */
function goAdminLogin() { window.location.href = "admin-login.html"; }
function goStaffLogin() { window.location.href = "staff-login.html"; }
function adminLogout() { window.location.href = "index.html"; }

function adminLogin() {
    const userField = document.getElementById("adminUser");
    const passField = document.getElementById("adminPass");
    if (userField && passField) {
        if (userField.value.trim() === "admin" && passField.value.trim() === "admin123") {
            window.location.href = "admin-dashboard.html";
        } else { alert("Invalid credentials!"); }
    }
}

function staffLogin() {
    const loginID = document.getElementById("staffLoginID").value.trim();
    const loginPass = document.getElementById("staffLoginPass").value.trim();
    const registeredStaff = JSON.parse(localStorage.getItem("staffList")) || [];

    const member = registeredStaff.find(s => s.empID === loginID && s.password === loginPass);

    if (member) {
        // FIXED: Store both Name and ID to identify unique records
        localStorage.setItem("currentUser", member.name);
        localStorage.setItem("currentUserID", member.empID);
        window.location.href = "staff-dashboard.html";
    } else {
        alert("Invalid Employee ID or Password!");
    }
}

/* ===============================
   STAFF ATTENDANCE LOGIC (FIXED)
================================ */

// Identifies the unique storage key for the logged-in user
function getStorageKey() {
    const userID = localStorage.getItem("currentUserID") || "guest";
    return "attendance_" + userID;
}

// FIXED: Show Employee ID next to Name
const welcomeEl = document.getElementById("welcomeStaff");
if (welcomeEl) {
    const currentName = localStorage.getItem("currentUser") || "Staff";
    const currentID = localStorage.getItem("currentUserID") || "";
    welcomeEl.innerText = `Welcome, ${currentName} (${currentID})`;
}

function handleInTime() {
    const key = getStorageKey();
    let logs = JSON.parse(localStorage.getItem(key)) || [];
    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString();

    logs.push({ date: dateStr, inTime: timeStr, outTime: null, duration: "Working..." });
    localStorage.setItem(key, JSON.stringify(logs));
    displayAttendance();
}

function handleOutTime() {
    const key = getStorageKey();
    let logs = JSON.parse(localStorage.getItem(key)) || [];
    const lastLog = logs[logs.length - 1];

    if (!lastLog || lastLog.outTime) {
        alert("Please Check In first!");
        return;
    }

    const outTimeStr = new Date().toLocaleTimeString();
    lastLog.outTime = outTimeStr;
    lastLog.duration = calculateDuration(lastLog.inTime, outTimeStr);
    
    localStorage.setItem(key, JSON.stringify(logs));
    displayAttendance();
}

function calculateDuration(start, end) {
    const s = new Date("01/01/2000 " + start);
    const e = new Date("01/01/2000 " + end);
    const diff = new Date(e - s);
    return `${diff.getUTCHours()}h ${diff.getUTCMinutes()}m`;
}

function displayAttendance() {
    const tbody = document.querySelector("#attendanceTable tbody");
    if (!tbody) return;

    // FIXED: Only display records for the current user key
    const key = getStorageKey();
    const logs = JSON.parse(localStorage.getItem(key)) || [];
    
    tbody.innerHTML = "";
    logs.forEach(log => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${log.date}</td><td>${log.inTime}</td><td>${log.outTime || "-"}</td><td>${log.duration}</td>`;
        tbody.appendChild(tr);
    });
}

/* ===============================
   ADMIN STAFF REGISTRATION (SAFE)
================================ */
let staffList = JSON.parse(localStorage.getItem("staffList")) || [];
let editIndex = -1;

function registerStaff() {
    const name = document.getElementById("staffName").value.trim();
    const empID = document.getElementById("staffID").value.trim();
    const role = document.getElementById("staffRole").value.trim();
    const nic = document.getElementById("staffNIC").value.trim();
    const contact = document.getElementById("staffContact").value.trim();
    const password = document.getElementById("staffPassword").value.trim();

    if (!name || !empID || !password) {
        alert("Please enter Name, Employee ID, and Password");
        return;
    }

    const staffData = { name, empID, role, contact, nic, password };
    if (editIndex === -1) {
        staffList.push(staffData);
    } else {
        staffList[editIndex] = staffData;
        editIndex = -1;
        document.getElementById("regBtn").innerText = "Register Staff";
    }

    localStorage.setItem("staffList", JSON.stringify(staffList));
    clearInputs();
    displayStaffList();
}

function clearInputs() {
    ["staffName", "staffID", "staffRole", "staffNIC", "staffContact", "staffPassword"].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = "";
    });
}

function deleteStaff(index) {
    if (confirm("Delete this staff?")) {
        staffList.splice(index, 1);
        localStorage.setItem("staffList", JSON.stringify(staffList));
        displayStaffList();
    }
}

function modifyStaff(index) {
    const staff = staffList[index];
    document.getElementById("staffName").value = staff.name;
    document.getElementById("staffID").value = staff.empID;
    document.getElementById("staffRole").value = staff.role;
    document.getElementById("staffNIC").value = staff.nic;
    document.getElementById("staffContact").value = staff.contact;
    document.getElementById("staffPassword").value = staff.password;
    editIndex = index;
    document.getElementById("regBtn").innerText = "Update Staff";
}

function displayStaffList() {
    const tbody = document.querySelector("#staffTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    staffList.forEach((staff, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${staff.name}</td><td>${staff.empID}</td><td>${staff.role}</td><td>${staff.contact}</td><td>${staff.nic}</td><td>${staff.password}</td>
            <td>
                <button class="btn-modify" onclick="modifyStaff(${index})">Modify</button>
                <button class="btn-delete" onclick="deleteStaff(${index})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

displayStaffList();
displayAttendance();
