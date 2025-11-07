// ===================== LIVE CLOCK =====================
function updateClock() { document.getElementById('clock').innerText = new Date().toLocaleTimeString(); }
setInterval(updateClock,1000);

// ===================== PAGE NAVIGATION =====================
function hideAll(){['mainPage','adminLogin','staffLogin','adminDashboard','staffDashboard'].forEach(id=>document.getElementById(id).classList.add('hidden'));}
function showAdminLogin(){hideAll(); document.getElementById('adminLogin').classList.remove('hidden');}
function showStaffLogin(){hideAll(); document.getElementById('staffLogin').classList.remove('hidden');}
function universalLogout(){hideAll(); document.getElementById('mainPage').classList.remove('hidden'); sessionStorage.clear();}

// ===================== ADMIN LOGIN =====================
const adminCredentials={user:'admin',pass:'admin123'};
function adminLogin(){
    const user=document.getElementById('adminUser').value;
    const pass=document.getElementById('adminPass').value;
    if(user===adminCredentials.user && pass===adminCredentials.pass){
        hideAll(); document.getElementById('adminDashboard').classList.remove('hidden');
        loadStaffTable(); loadFilterStaff(); loadAttendanceTable();
    } else alert('Invalid admin credentials');
}

// ===================== STAFF LOGIN =====================
function staffLogin(){
    const id=document.getElementById('loginStaffID').value;
    const pass=document.getElementById('loginStaffPass').value;
    const staffList=JSON.parse(localStorage.getItem('staffList')||'[]');
    const staff=staffList.find(s=>s.id===id && s.pass===pass);
    if(staff){
        sessionStorage.setItem('loggedStaffID',staff.id);
        sessionStorage.setItem('loggedStaffName',staff.name);
        hideAll(); document.getElementById('staffDashboard').classList.remove('hidden');
        document.getElementById('staffWelcome').innerText=`Welcome ${staff.name} (${staff.id})`;
        displayMyAttendance();
    } else alert('Invalid staff credentials');
}

// ===================== REGISTER STAFF =====================
function registerStaff(){
    const name=document.getElementById('staffName').value;
    const id=document.getElementById('staffID').value;
    const pass=document.getElementById('staffPassword').value;
    if(!name || !id || !pass) return alert('Fill all fields');
    let staffList=JSON.parse(localStorage.getItem('staffList')||'[]');
    if(staffList.find(s=>s.id===id)) return alert('Staff ID already exists');
    staffList.push({name,id,pass});
    localStorage.setItem('staffList',JSON.stringify(staffList));
    alert('Staff registered'); loadStaffTable(); loadFilterStaff();
}

// ===================== STAFF TABLE =====================
function loadStaffTable(){
    let staffList=JSON.parse(localStorage.getItem('staffList')||'[]');
    let tbody=document.querySelector('#staffTable tbody'); tbody.innerHTML='';
    staffList.forEach(s=>{
        let tr=document.createElement('tr');
        tr.innerHTML=`<td>${s.name}</td><td>${s.id}</td>
        <td>
            <button onclick="deleteStaff('${s.id}')">Delete</button>
            <button onclick="modifyStaff('${s.id}')">Modify</button>
        </td>`;
        tbody.appendChild(tr);
    });
}

function deleteStaff(id){
    if(!confirm('Delete staff?')) return;
    let staffList=JSON.parse(localStorage.getItem('staffList')||'[]');
    staffList=staffList.filter(s=>s.id!==id);
    localStorage.setItem('staffList',JSON.stringify(staffList));
    loadStaffTable(); loadFilterStaff();
}

function modifyStaff(id){
    let staffList=JSON.parse(localStorage.getItem('staffList')||'[]');
    let staff=staffList.find(s=>s.id===id);
    let newName=prompt('Enter new name',staff.name);
    let newPass=prompt('Enter new password',staff.pass);
    if(newName) staff.name=newName;
    if(newPass) staff.pass=newPass;
    localStorage.setItem('staffList',JSON.stringify(staffList));
    loadStaffTable(); loadFilterStaff();
}

// ===================== FILTER STAFF FOR ADMIN =====================
function loadFilterStaff(){
    let select=document.getElementById('filterStaff');
    let staffList=JSON.parse(localStorage.getItem('staffList')||'[]');
    select.innerHTML='<option value="all">All</option>';
    staffList.forEach(s=>{ select.innerHTML+=`<option value="${s.id}">${s.name}</option>`; });
}

// ===================== MARK ATTENDANCE =====================
function markIn(){
    let staffID=sessionStorage.getItem('loggedStaffID');
    let staffName=sessionStorage.getItem('loggedStaffName');
    if(!staffID) return alert('Login first');
    let today=new Date().toLocaleDateString();
    let floor=document.getElementById('floorSelect').value;
    let shift=document.getElementById('shiftSelect').value;
    let inTime=new Date().toLocaleTimeString();
    let attendanceRecords=JSON.parse(localStorage.getItem('attendanceRecords')||'[]');
    let existing=attendanceRecords.find(r=>r.staffID===staffID && r.date===today);
    if(existing && existing.inTime!=='--') return alert('In-Time already marked');
    if(existing){ existing.inTime=inTime; existing.floor=floor; existing.shift=shift; }
    else attendanceRecords.push({staffID,staffName,date:today,floor,shift,inTime,outTime:'--',duration:'00:00:00'});
    localStorage.setItem('attendanceRecords',JSON.stringify(attendanceRecords));
    displayMyAttendance();
    document.getElementById('inTimeDisplay').innerText=inTime;
}

function markOut(){
    let staffID=sessionStorage.getItem('loggedStaffID');
    let today=new Date().toLocaleDateString();
    let attendanceRecords=JSON.parse(localStorage.getItem('attendanceRecords')||'[]');
    let existing=attendanceRecords.find(r=>r.staffID===staffID && r.date===today);
    if(!existing || existing.inTime==='--') return alert('Mark In-Time first');
    if(existing.outTime!=='--') return alert('Out-Time already marked');
    let outTime=new Date();
    let inTime=new Date(`${today} ${existing.inTime}`);
    let diffMs=outTime-inTime;
    let hours=Math.floor(diffMs/1000/3600);
    let minutes=Math.floor(diffMs/1000/60)%60;
    let seconds=Math.floor(diffMs/1000)%60;
    existing.outTime=outTime.toLocaleTimeString();
    existing.duration=`${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    localStorage.setItem('attendanceRecords',JSON.stringify(attendanceRecords));
    displayMyAttendance();
    document.getElementById('outTimeDisplay').innerText=existing.outTime;
    document.getElementById('durationDisplay').innerText=existing.duration;
}

function markOffDay(){
    let staffID=sessionStorage.getItem('loggedStaffID');
    let staffName=sessionStorage.getItem('loggedStaffName');
    if(!staffID) return alert('Login first');
    let today=new Date().toLocaleDateString();
    let attendanceRecords=JSON.parse(localStorage.getItem('attendanceRecords')||'[]');
    let existing=attendanceRecords.find(r=>r.staffID===staffID && r.date===today);
    if(existing){ existing.floor='OFF'; existing.shift='OFF'; existing.inTime='--'; existing.outTime='--'; existing.duration='--'; }
    else attendanceRecords.push({staffID,staffName,date:today,floor:'OFF',shift:'OFF',inTime:'--',outTime:'--',duration:'--'});
    localStorage.setItem('attendanceRecords',JSON.stringify(attendanceRecords));
    displayMyAttendance();
    alert('Marked as Off Day');
}

// ===================== DISPLAY STAFF ATTENDANCE =====================
function displayMyAttendance(){
    let staffID=sessionStorage.getItem('loggedStaffID');
    let attendance=JSON.parse(localStorage.getItem('attendanceRecords')||'[]');
    let myRecords=attendance.filter(r=>r.staffID===staffID);
    let tbody=document.querySelector('#myAttendance tbody'); tbody.innerHTML='';
    myRecords.forEach(r=>{
        let tr=document.createElement('tr');
        if(r.floor==='OFF') tr.style.background='#ffcccc';
        tr.innerHTML=`<td>${r.date}</td><td>${r.floor}</td><td>${r.shift}</td><td>${r.inTime}</td><td>${r.outTime}</td><td>${r.duration}</td>`;
        tbody.appendChild(tr);
    });
}

// ===================== ADMIN ATTENDANCE VIEW =====================
function loadAttendanceTable(){ filterAttendance(); }
function filterAttendance(){
    let view=document.getElementById('viewType').value;
    let staffFilter=document.getElementById('filterStaff').value;
    let dateFilter=document.getElementById('filterDate').value;
    let attendance=JSON.parse(localStorage.getItem('attendanceRecords')||'[]');
    if(staffFilter!=='all') attendance=attendance.filter(r=>r.staffID===staffFilter);
    if(dateFilter) attendance=attendance.filter(r=>r.date===new Date(dateFilter).toLocaleDateString());
    let tbody=document.querySelector('#attendanceTable tbody'); tbody.innerHTML='';
    attendance.forEach(r=>{
        let tr=document.createElement('tr');
        if(r.floor==='OFF') tr.style.background='#ffcccc';
        tr.innerHTML=`<td>${r.staffName}</td><td>${r.staffID}</td><td>${r.date}</td><td>${r.floor}</td><td>${r.shift}</td>
        <td>${r.inTime}</td><td>${r.outTime}</td><td>${r.duration}</td>
        <td>
            <button onclick="modifyAttendance('${r.staffID}','${r.date}')">Modify</button>
            <button onclick="deleteAttendance('${r.staffID}','${r.date}')">Delete</button>
        </td>`;
        tbody.appendChild(tr);
    });
}

function deleteAttendance(id,date){
    if(!confirm('Delete this attendance record?')) return;
    let attendance=JSON.parse(localStorage.getItem('attendanceRecords')||'[]');
    attendance=attendance.filter(r=>!(r.staffID===id && r.date===date));
    localStorage.setItem('attendanceRecords',JSON.stringify(attendance));
    filterAttendance();
}

function modifyAttendance(id,date){
    let attendance=JSON.parse(localStorage.getItem('attendanceRecords')||'[]');
    let record=attendance.find(r=>r.staffID===id && r.date===date);
    if(!record) return alert('Record not found');
    let floor=prompt('Floor (29,31,32,33 or OFF)',record.floor);
    let shift=prompt('Shift (Day/Night or OFF)',record.shift);
    let inTime=prompt('In-Time (HH:MM:SS or --)',record.inTime);
    let outTime=prompt('Out-Time (HH:MM:SS or --)',record.outTime);

    record.floor=floor||record.floor;
    record.shift=shift||record.shift;
    record.inTime=inTime||record.inTime;
    record.outTime=outTime||record.outTime;

    if(record.inTime!=='--' && record.outTime!=='--' && record.floor!=='OFF'){
        let inDate=new Date(`${record.date} ${record.inTime}`);
        let outDate=new Date(`${record.date} ${record.outTime}`);
        let diffMs=outDate-inDate;
        let hours=Math.floor(diffMs/1000/3600);
        let minutes=Math.floor(diffMs/1000/60)%60;
        let seconds=Math.floor(diffMs/1000)%60;
        record.duration=`${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    } else record.duration='--';

    localStorage.setItem('attendanceRecords',JSON.stringify(attendance));
    filterAttendance();
}
