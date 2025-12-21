/* ==========================================================================
   1. REAL-TIME CLOCK & SYSTEM INITIALIZATION
   ========================================================================== */
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

/* ==========================================================================
   2. LOGIN & NAVIGATION LOGIC
   ========================================================================== */
function goAdminLogin() { window.location.href = "admin-login.html"; }
function goStaffLogin() { window.location.href = "staff-login.html"; }
function goManagementLogin() { window.location.href = "management-login.html"; }

function adminLogout() { 
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("currentUserID");
    localStorage.removeItem("managementSession");
    window.location.href = "index.html"; 
}

function adminLogin() {
    const user = document.getElementById("adminUser")?.value;
    const pass = document.getElementById("adminPass")?.value;
    if (user === "admin" && pass === "admin123") {
        window.location.href = "admin-dashboard.html";
    } else {
        alert("Invalid Admin Credentials!");
    }
}

function managementLogin() {
    const user = document.getElementById("manageUser")?.value;
    const pass = document.getElementById("managePass")?.value;
    if (user === "mgmt" && pass === "mgmt123") {
        localStorage.setItem("managementSession", "active");
        window.location.href = "management-dashboard.html";
    } else {
        alert("Invalid Management Credentials!");
    }
}

function staffLogin() {
    const idField = document.getElementById("staffLoginID");
    const passField = document.getElementById("staffLoginPass");
    if (!idField || !passField) return;
    const id = idField.value.trim();
    const pass = passField.value.trim();
    const staffList = JSON.parse(localStorage.getItem("staffList")) || [];
    const user = staffList.find(s => s.empID === id && s.password === pass);
    if (user) {
        localStorage.setItem("currentUserID", user.empID);
        localStorage.setItem("loggedInUser", JSON.stringify(user)); 
        window.location.href = "staff-dashboard.html";
    } else { 
        alert("Invalid Employee ID or Password!"); 
    }
}

function displayStaffWelcome() {
    const welcomeEl = document.getElementById("welcomeMessage");
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (welcomeEl && user) {
        welcomeEl.innerText = `Welcome, ${user.name} (${user.empID})`;
    }
}

/* ==========================================================================
   3. STAFF DASHBOARD ACTIONS (IN/OUT/OFF-DAY)
   ========================================================================== */
function handleInTime() {
    const userID = localStorage.getItem("currentUserID");
    if (!userID) return alert("Session expired. Please login again.");
    const key = "attendance_" + userID;
    let logs = JSON.parse(localStorage.getItem(key)) || [];
    const dateStr = new Date().toLocaleDateString();
    if (logs.some(l => l.date === dateStr && l.inTime !== "OFF" && l.outTime === null)) {
        return alert("You are already clocked in!");
    }
    const floor = document.getElementById("floorSelect").value;
    let shift = document.getElementById("shiftSelect").value;
    if (document.getElementById("secondShift")?.checked) shift += " (2nd Shift)";
    logs.push({
        date: dateStr,
        inTime: new Date().toLocaleTimeString(),
        outTime: null,
        duration: "Working...",
        floor: floor,
        shift: shift,
        timestamp: Date.now() 
    });
    localStorage.setItem(key, JSON.stringify(logs));
    displayAttendance();
    updateStats(); 
}

function handleOutTime() {
    const userID = localStorage.getItem("currentUserID");
    const key = "attendance_" + userID;
    let logs = JSON.parse(localStorage.getItem(key)) || [];
    const activeLog = logs.slice().reverse().find(log => log.outTime === null && log.inTime !== "OFF");
    if (activeLog) {
        const outTimeStr = new Date().toLocaleTimeString();
        activeLog.outTime = outTimeStr;
        activeLog.duration = calculateDuration(activeLog.inTime, outTimeStr);
        localStorage.setItem(key, JSON.stringify(logs)); 
        displayAttendance();
        updateStats(); 
    } else {
        alert("No active 'In' record found!");
    }
}

function handleOffDay() {
    const userID = localStorage.getItem("currentUserID");
    if (!userID) return;
    const dateStr = new Date().toLocaleDateString();
    if (!confirm("Mark today as an Off Day?")) return;
    const key = "attendance_" + userID;
    let logs = JSON.parse(localStorage.getItem(key)) || [];
    if (logs.some(l => l.date === dateStr && l.inTime === "OFF")) {
        return alert("Today is already marked as an Off Day.");
    }
    logs.push({
        date: dateStr,
        inTime: "OFF",
        outTime: "OFF",
        duration: "OFF DAY",
        floor: "-",
        shift: "-",
        timestamp: Date.now()
    });
    localStorage.setItem(key, JSON.stringify(logs));
    displayAttendance();
    updateStats(); 
}

function displayAttendance() {
    const userID = localStorage.getItem("currentUserID");
    const tbody = document.querySelector("#attendanceTable tbody");
    if (!tbody || !userID) return;
    const logs = JSON.parse(localStorage.getItem("attendance_" + userID)) || [];
    tbody.innerHTML = "";
    logs.slice().reverse().forEach((log) => {
        tbody.innerHTML += `
            <tr>
                <td>${log.date}</td>
                <td>${log.floor}</td>
                <td>${log.shift}</td>
                <td>${log.inTime}</td>
                <td>${log.outTime || "-"}</td>
                <td>${log.duration}</td>
                <td style="width:100px; height:35px; border: 1px solid #ddd;"></td> </tr>`;
    });
}

function calculateDuration(start, end) {
    if(!start || !end || end === "-" || start === "OFF") return "-";
    const s = new Date("2000/01/01 " + start);
    let e = new Date("2000/01/01 " + end);
    let diff = e - s;
    if (diff < 0) { diff += 24 * 60 * 60 * 1000; }
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/* ==========================================================================
   4. ADMIN DASHBOARD: STAFF MANAGEMENT
   ========================================================================== */
function registerStaff() {
    const name = document.getElementById("staffName").value.trim();
    const id = document.getElementById("staffID").value.trim();
    const pass = document.getElementById("staffPassword").value.trim();
    if (!name || !id || !pass) return alert("Please fill all required fields!");
    const staff = {
        name: name,
        empID: id,
        role: document.getElementById("staffRole").value,
        contact: document.getElementById("staffContact").value,
        nic: document.getElementById("staffNIC").value,
        password: pass
    };
    let staffList = JSON.parse(localStorage.getItem("staffList")) || [];
    staffList.push(staff);
    localStorage.setItem("staffList", JSON.stringify(staffList));
    alert("Staff Registered!");
    location.reload();
}

function displayStaffList() {
    const tbody = document.querySelector("#staffTable tbody");
    if (!tbody) return;
    const staffList = JSON.parse(localStorage.getItem("staffList")) || [];
    tbody.innerHTML = "";
    staffList.forEach((s, index) => {
        tbody.innerHTML += `<tr>
            <td>${s.name}</td><td>${s.empID}</td><td>${s.role}</td>
            <td>${s.contact}</td><td>${s.nic}</td><td>${s.password}</td>
            <td>
                <button class="btn-modify" style="background: #3498db; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px; margin-right:5px;" onclick="modifyStaffInfo(${index})">Modify</button>
                <button class="btn-delete" onclick="deleteStaff(${index})">Delete</button>
            </td>
        </tr>`;
    });
}

function modifyStaffInfo(index) {
    let staffList = JSON.parse(localStorage.getItem("staffList")) || [];
    let s = staffList[index];
    const newName = prompt("Update Name:", s.name);
    if (newName !== null) {
        s.name = newName;
        s.role = prompt("Update Role:", s.role);
        s.contact = prompt("Update Contact:", s.contact);
        s.password = prompt("Update Password:", s.password);
        localStorage.setItem("staffList", JSON.stringify(staffList));
        displayStaffList();
    }
}

function deleteStaff(index) {
    if(!confirm("Delete this staff member?")) return;
    let staffList = JSON.parse(localStorage.getItem("staffList")) || [];
    const empID = staffList[index].empID;
    staffList.splice(index, 1);
    localStorage.setItem("staffList", JSON.stringify(staffList));
    localStorage.removeItem("attendance_" + empID);
    displayStaffList();
    updateStats();
}

/* ==========================================================================
   5. ADMIN & MANAGEMENT DASHBOARD: HISTORY & REPORTS
   ========================================================================== */
function displayAllAttendance() {
    const tbody = document.querySelector("#adminAttendanceTable tbody");
    if (!tbody) return;

    const isManagement = window.location.pathname.includes("management-dashboard");
    const searchName = document.getElementById("filterName")?.value.toLowerCase() || "";
    const searchID = document.getElementById("filterID")?.value.toLowerCase() || "";
    const filterDate = document.getElementById("filterSpecificDate")?.value; 
    const filterFloor = document.getElementById("filterFloor")?.value || "";
    const filterShift = document.getElementById("filterShift")?.value || "All Shifts";

    let formattedFilterDate = "";
    if (filterDate) {
        const [y, m, d] = filterDate.split("-");
        formattedFilterDate = `${parseInt(m)}/${parseInt(d)}/${y}`;
    }

    const staffList = JSON.parse(localStorage.getItem("staffList")) || [];
    let allRecords = [];

    staffList.forEach(staff => {
        const logs = JSON.parse(localStorage.getItem("attendance_" + staff.empID)) || [];
        logs.forEach((log, index) => {
            allRecords.push({ ...log, staffName: staff.name, empID: staff.empID, logIndex: index });
        });
    });

    allRecords.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    tbody.innerHTML = "";
    
    allRecords.forEach((record) => {
        if (searchName && !record.staffName.toLowerCase().includes(searchName)) return;
        if (searchID && !record.empID.toLowerCase().includes(searchID)) return;
        if (formattedFilterDate && record.date !== formattedFilterDate) return;
        if (filterFloor && filterFloor !== "All Floors" && record.floor !== filterFloor) return;
        if (filterShift && filterShift !== "All Shifts" && !record.shift.includes(filterShift)) return;

        const actionButtons = isManagement ? "" : `
            <td>
                <button class="btn-modify" onclick="modifyLog('${record.empID}', ${record.logIndex})">Modify</button>
                <button class="btn-delete" onclick="deleteAdminLog('${record.empID}', ${record.logIndex})">Delete</button>
            </td>`;

        tbody.innerHTML += `
            <tr>
                <td><strong>${record.staffName} (${record.empID})</strong></td>
                <td>${record.date}</td>
                <td>${record.floor || "-"}</td>
                <td>${record.shift}</td>
                <td>${record.inTime}</td>
                <td>${record.outTime || "-"}</td>
                <td>${record.duration}</td>
                ${actionButtons}
            </tr>`;
    });
    
    if (tbody.innerHTML === "") {
        tbody.innerHTML = `<tr><td colspan="${isManagement ? 7 : 8}" style="text-align:center; padding:20px; color:#666;">No matching records found.</td></tr>`;
    }
    updateStats();
}

/* ==========================================================================
   6. STATS CALCULATION (OPTIMIZED FOR BOTH DASHBOARDS)
   ========================================================================== */
function updateStats() {
    const staff = JSON.parse(localStorage.getItem("staffList")) || [];
    const today = new Date().toLocaleDateString();
    
    let presentCount = 0; 
    let nightShiftCount = 0; 
    let offDayCount = 0; 
    
    staff.forEach(s => {
        const logs = JSON.parse(localStorage.getItem("attendance_" + s.empID)) || [];
        // Only consider logs for TODAY
        const todayLogs = logs.filter(l => l.date === today);
        
        if (todayLogs.length > 0) {
            // A staff is Present if they have any log today that isn't an OFF/LEAVE entry
            const isPresent = todayLogs.some(l => l.inTime !== "OFF" && !l.inTime.includes("LEAVE"));
            
            // A staff is Off if their latest log marks them as OFF or LEAVE
            const isOff = todayLogs.some(l => l.inTime === "OFF" || l.inTime.includes("LEAVE"));
            
            // Night shift check (matches "Night" or "2nd Shift")
            const isNight = todayLogs.some(l => l.shift && (l.shift.includes("Night") || l.shift.includes("2nd")));

            if (isPresent) presentCount++;
            if (isOff) offDayCount++;
            if (isNight) nightShiftCount++;
        }
    });

    const updateUI = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    // Updated ID mapping to match Admin Dashboard elements shown in images
    const statMapping = {
        total: ["statTotalStaff", "adminStatTotalStaff", "totalStaffCount"],
        present: ["statPresent", "adminStatPresent", "presentTodayCount"],
        off: ["statAbsent", "adminStatAbsent", "onLeaveCount"],
        night: ["statSecondShift", "adminStatSecondShift", "nightShiftCount"]
    };

    statMapping.total.forEach(id => updateUI(id, staff.length));
    statMapping.present.forEach(id => updateUI(id, presentCount));
    statMapping.off.forEach(id => updateUI(id, offDayCount));
    statMapping.night.forEach(id => updateUI(id, nightShiftCount));
}

/* ==========================================================================
   7. LEAVE MANAGEMENT LOGIC
   ========================================================================== */
function displayManagementLeaves() {
    const leaveTable = document.getElementById("managementLeaveTable");
    if (!leaveTable) return;

    const allLeaves = JSON.parse(localStorage.getItem("allLeaveRequests")) || [];
    leaveTable.innerHTML = "";
    const pendingLeaves = allLeaves.filter(l => l.status === "Pending");

    if (pendingLeaves.length === 0) {
        leaveTable.innerHTML = "<tr><td colspan='5' style='padding:20px; color:#999;'>No pending leave requests.</td></tr>";
        return;
    }

    pendingLeaves.forEach(req => {
        leaveTable.innerHTML += `
            <tr>
                <td style="text-align: left; padding-left: 20px;">${req.staffName} (ID: ${req.empID})</td>
                <td><span class="leave-type-label">${req.type}</span></td>
                <td>${req.date}</td>
                <td><span class="status-badge pending">Pending</span></td>
                <td>
                    <button class="btn-approve" onclick="updateLeaveStatus('${req.requestId}', 'Approved')">Approve</button>
                    <button class="btn-reject" onclick="updateLeaveStatus('${req.requestId}', 'Rejected')">Reject</button>
                </td>
            </tr>`;
    });
}

function updateLeaveStatus(requestId, newStatus) {
    if (!confirm(`Are you sure you want to ${newStatus} this request?`)) return;

    let allLeaves = JSON.parse(localStorage.getItem("allLeaveRequests")) || [];
    const index = allLeaves.findIndex(l => l.requestId === requestId);

    if (index !== -1) {
        allLeaves[index].status = newStatus;
        localStorage.setItem("allLeaveRequests", JSON.stringify(allLeaves));

        if (newStatus === "Approved") {
            const req = allLeaves[index];
            const attendanceKey = "attendance_" + req.empID;
            let logs = JSON.parse(localStorage.getItem(attendanceKey)) || [];
            
            logs.push({
                date: req.date,
                inTime: "LEAVE (" + req.type + ")",
                outTime: "LEAVE",
                duration: "APPROVED",
                floor: "-",
                shift: "-",
                timestamp: Date.now()
            });
            localStorage.setItem(attendanceKey, JSON.stringify(logs));
        }

        alert(`Request ${newStatus} successfully.`);
        displayManagementLeaves();
        updateStats();
    }
}

/* ==========================================================================
   8. INITIALIZE
   ========================================================================== */
window.onload = function() {
    updateDateTime();
    displayStaffList();
    displayAllAttendance();
    displayAttendance(); 
    displayStaffWelcome();
    displayManagementLeaves(); 
    updateStats();

    // Attach filters
    ["filterName", "filterID", "filterSpecificDate", "filterFloor", "filterShift"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", displayAllAttendance);
            el.addEventListener("change", displayAllAttendance);
        }
    });
};
