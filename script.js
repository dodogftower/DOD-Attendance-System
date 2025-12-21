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
   5. ADMIN & MANAGEMENT DASHBOARD: HISTORY & REPORTS (FIXED FILTERS)
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
        
        if (filterShift && filterShift !== "All Shifts") {
            if (!record.shift.includes(filterShift)) return;
        }

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

function generateReport(type) {
    const dailyVal = document.getElementById("reportDailyDate")?.value;
    const dailyShiftVal = document.getElementById("reportDailyShift")?.value;
    const monthlyVal = document.getElementById("reportMonthlyDate")?.value;
    
    if(type === 'daily' && !dailyVal) return alert("Please select a date");
    if(type === 'monthly' && !monthlyVal) return alert("Please select a month");

    const staffList = JSON.parse(localStorage.getItem("staffList")) || [];
    let reportRows = "";

    staffList.forEach(staff => {
        const logs = JSON.parse(localStorage.getItem("attendance_" + staff.empID)) || [];
        logs.forEach(log => {
            const [m, d, y] = log.date.split("/");
            const logISO = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            const logMonthISO = `${y}-${m.padStart(2, '0')}`;

            let dateMatch = (type === 'daily' && logISO === dailyVal) || (type === 'monthly' && logMonthISO === monthlyVal);
            let shiftMatch = (type === 'daily' && dailyShiftVal && dailyShiftVal !== "All Shifts") ? log.shift.includes(dailyShiftVal) : true;

            if (dateMatch && shiftMatch) {
                reportRows += `
                    <tr>
                        <td style="text-align:left; font-weight: bold; padding-left:10px;">${staff.name}</td>
                        <td>${staff.empID}</td>
                        <td>${log.date}</td>
                        <td>${log.floor}</td>
                        <td>${log.shift}</td>
                        <td>${log.inTime}</td>
                        <td>${log.outTime || "-"}</td>
                        <td>${log.duration}</td>
                        <td style="width: 100px; border: 1.5px solid #000;"></td>
                    </tr>`;
            }
        });
    });

    const printWindow = window.open('', '_blank');
    const headerTitle = type === 'daily' ? `DAILY ATTENDANCE SHEET` : `MONTHLY ATTENDANCE SHEET`;
    const displayDate = type === 'daily' ? dailyVal : monthlyVal;

    printWindow.document.write(`
        <html>
        <head>
            <title>Attendance Report - OGF & MIREKA TOWER</title>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #000; background: #fff; }
                .report-header { text-align: center; margin-bottom: 30px; position: relative; border-bottom: 2px double #000; padding-bottom: 10px; }
                .report-header h1 { margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; }
                .report-header h2 { margin: 5px 0; font-size: 18px; text-decoration: underline; }
                .srl-no { position: absolute; right: 0; top: 0; font-weight: bold; font-size: 14px; border: 1px solid #000; padding: 5px; }
                .sub-info { text-align: center; margin-top: 10px; font-weight: bold; font-size: 14px; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
                th { background-color: #f2f2f2; font-size: 11px; border: 1.5px solid #000; padding: 12px 5px; text-transform: uppercase; }
                td { border: 1.5px solid #000; padding: 10px 5px; text-align: center; font-size: 12px; word-wrap: break-word; }
                .remarks-section { margin-top: 30px; font-weight: bold; font-size: 14px; }
                .remarks-line { border-bottom: 1px dotted #000; width: 80%; display: inline-block; height: 15px; }
                .footer-container { margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 20px; }
                .sig-box { text-align: center; width: 220px; }
                .sig-line { border-top: 1.5px solid #000; margin-bottom: 8px; }
                .sig-text { font-weight: bold; font-size: 12px; text-transform: uppercase; }
                @media print { @page { size: landscape; margin: 10mm; } body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="report-header">
                <div class="srl-no">SERIAL NO: __________</div>
                <h1>ONE GALLE FACE & MIREKA TOWER</h1>
                <h2>${headerTitle}</h2>
                <div class="sub-info">DATE: ${displayDate} | SHIFT: ${dailyShiftVal || "ALL"}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 22%;">STAFF NAME</th>
                        <th style="width: 5%;">SVC NO</th>
                        <th style="width: 10%;">DATE</th>
                        <th style="width: 5%;">FLOOR</th>
                        <th style="width: 12%;">SHIFT</th>
                        <th style="width: 10%;">IN TIME</th>
                        <th style="width: 10%;">OUT TIME</th>
                        <th style="width: 8%;">total work hours</th>
                        <th style="width: 20%;">SIGNATURE</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportRows || "<tr><td colspan='9' style='padding: 50px; font-size: 16px;'>NO RECORDS FOUND</td></tr>"}
                </tbody>
            </table>
            <div class="remarks-section">REMARKS: <div class="remarks-line"></div></div>
            <div class="footer-container">
                <div class="sig-box"><div class="sig-line"></div><div class="sig-text">CERTIFIED BY</div></div>
                <div class="sig-box"><div class="sig-line"></div><div class="sig-text">CHECKED BY</div></div>
            </div>
            <script>
                window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 700); };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function clearFilters() {
    const ids = ["filterName", "filterID", "filterSpecificDate", "filterFloor", "filterShift"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.tagName === "SELECT") el.selectedIndex = 0;
            else el.value = "";
        }
    });
    displayAllAttendance();
}

function modifyLog(empID, index) {
    const key = "attendance_" + empID;
    let logs = JSON.parse(localStorage.getItem(key)) || [];
    const log = logs[index];
    const nFloor = prompt("Floor:", log.floor);
    const nShift = prompt("Shift:", log.shift);
    const nIn = prompt("In Time:", log.inTime);
    const nOut = prompt("Out Time:", log.outTime || "-");
    if (nFloor !== null) {
        log.floor = nFloor;
        log.shift = nShift;
        log.inTime = nIn;
        log.outTime = nOut === "-" ? null : nOut;
        log.duration = (log.inTime === "OFF") ? "OFF DAY" : calculateDuration(log.inTime, log.outTime);
        localStorage.setItem(key, JSON.stringify(logs));
        displayAllAttendance();
    }
}

function deleteAdminLog(empID, index) {
    if(!confirm("Delete this record?")) return;
    const key = "attendance_" + empID;
    let logs = JSON.parse(localStorage.getItem(key)) || [];
    logs.splice(index, 1);
    localStorage.setItem(key, JSON.stringify(logs));
    displayAllAttendance();
}

/* ==========================================================================
   6. STATS CALCULATION (UPDATED: FIXED LEAVE/OFF COUNTING)
   ========================================================================== */
function updateStats() {
    const staff = JSON.parse(localStorage.getItem("staffList")) || [];
    const today = new Date().toLocaleDateString();
    let presentCount = 0; 
    let secondShiftCount = 0; 
    let explicitOffDayCount = 0; 
    
    staff.forEach(s => {
        const logs = JSON.parse(localStorage.getItem("attendance_" + s.empID)) || [];
        // Strictly filter logs for today's date only
        const todayLogs = logs.filter(l => l.date === today);
        
        if (todayLogs.length > 0) {
            todayLogs.forEach(l => {
                // Count as Present if inTime is a real clock-in (not OFF/LEAVE)
                if (l.inTime !== "OFF" && !l.inTime.includes("LEAVE")) {
                    presentCount++;
                }
                // Count as Off/Leave ONLY if record for TODAY specifically says OFF or LEAVE
                if (l.inTime === "OFF" || l.inTime.includes("LEAVE")) {
                    explicitOffDayCount++;
                }
                // Count Shifts
                if (l.shift && (l.shift.includes("Night") || l.shift.includes("2nd"))) {
                    secondShiftCount++;
                }
            });
        }
    });

    // Helper to safely set UI elements
    const setUI = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    // Management Dashboard
    setUI("statTotalStaff", staff.length);
    setUI("statPresent", presentCount);
    setUI("statAbsent", explicitOffDayCount);
    setUI("statSecondShift", secondShiftCount);

    // Admin Dashboard
    setUI("adminStatTotalStaff", staff.length);
    setUI("adminStatPresent", presentCount);
    setUI("adminStatAbsent", explicitOffDayCount);
    setUI("adminStatSecondShift", secondShiftCount);
}

/* ==========================================================================
   7. SNOW ANIMATION EFFECT
   ========================================================================== */
function createSnowflake() {
    const snowContainer = document.getElementById('snow-container');
    if (!snowContainer) return;
    
    const snowflake = document.createElement('div');
    snowflake.classList.add('snowflake');
    snowflake.innerHTML = '&#10052;'; 
    
    const size = Math.random() * 10 + 10;
    const left = Math.random() * 100;
    const duration = Math.random() * 3 + 4; 
    const opacity = Math.random();
    
    snowflake.style.fontSize = size + 'px';
    snowflake.style.left = left + 'vw';
    snowflake.style.opacity = opacity;
    
    snowflake.style.animation = `fall ${duration}s linear forwards`;
    
    snowContainer.appendChild(snowflake);
    
    setTimeout(() => { 
        snowflake.remove(); 
    }, duration * 1000);
}

/* ==========================================================================
   NEW FEATURES: LEAVE MANAGEMENT LOGIC (UPDATED)
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
            </tr>
        `;
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
            
            // Check if a leave entry for this exact date already exists to prevent double counting
            const existingEntry = logs.some(l => l.date === req.date && l.inTime.includes("LEAVE"));
            
            if (!existingEntry) {
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
        }

        alert(`Request ${newStatus} successfully.`);
        displayManagementLeaves();
        if (typeof displayAllAttendance === "function") displayAllAttendance();
        updateStats(); // Force stat recalculation
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
    setInterval(createSnowflake, 200);
    ["filterName", "filterID", "filterSpecificDate", "filterFloor", "filterShift"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", displayAllAttendance);
            el.addEventListener("change", displayAllAttendance);
        }
    });
};
