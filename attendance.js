// LOGIN & ROLE TOGGLE ---
function checkRole() {
    const role = document.getElementById('userRole').value;
    const studentExtra = document.getElementById('studentExtraInfo');
    if (studentExtra) {
        studentExtra.style.display = (role === 'student') ? 'block' : 'none';
    }
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const nameInput = document.getElementById('username');
        const passInput = document.getElementById('password');
        const roleInput = document.getElementById('userRole');
        const sidInput = document.getElementById('studentID');

        // Spans from  HTML
        const nameError = document.getElementById('nameError');
        const passError = document.getElementById('passError');
        const idError = document.getElementById('idError');

        let isValid = true;

        // Reset Styles
        [nameInput, passInput, roleInput, sidInput].forEach(el => el?.classList.remove('invalid-border'));
        [nameError, passError, idError].forEach(span => { if(span) span.style.display = 'none'; });

        if (nameInput.value.trim().length < 3) {
            nameError.style.display = 'block';
            nameInput.classList.add('invalid-border');
            isValid = false;
        }
        if (passInput.value.length < 6) {
            passError.style.display = 'block';
            passInput.classList.add('invalid-border');
            isValid = false;
        }
        if (roleInput.value === 'student' && sidInput.value.trim() === "") {
            idError.style.display = 'block';
            sidInput.classList.add('invalid-border');
            isValid = false;
        }

        if (isValid) {
            const name = encodeURIComponent(nameInput.value.trim());
            const role = roleInput.value;
            const sid = encodeURIComponent(sidInput.value.trim());
            const url = `dashboard.html?username=${name}&role=${role}&sid=${sid}`;
            window.open(url, '_blank'); // Opens in New Tab
        }
    });
}

// TOAST SYSTEM
function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerHTML = `<span>✅</span> ${message}`;
    toast.className = "show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

//  DASHBOARD LOGIC 
function initDashboard() {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('username');
    const role = params.get('role');

    if (!name) return;

    const welcomeMsg = document.getElementById('welcomeMsg');
    if (welcomeMsg) {
        welcomeMsg.innerHTML = `👋 Hi, <span>${name}</span>!`;
    }

    const stdSection = document.getElementById('stdSection');
    const lecSection = document.querySelector('section:not(#stdSection)');

    if (role === 'student') {
        stdSection.style.display = 'block';
        lecSection.style.display = 'none';
    } else {
        stdSection.style.display = 'none';
        lecSection.style.display = 'block';
        loadRecords(); 
    }
    if (role === 'lecturer') {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateFilter').value = today;
   }
}

function markAttendance() {
    const params = new URLSearchParams(window.location.search);
    
    // Select elements
    const progEl = document.getElementById('programmeSelect');
    const courseEl = document.getElementById('courseSelect');
    const groupEl = document.getElementById('groupSelect');

    // Error spans
    const progError = document.getElementById('progError');
    const courseError = document.getElementById('courseError');
    const groupError = document.getElementById('groupError');

    let isValid = true;

    // 1. Reset validation state
    [progEl, courseEl, groupEl].forEach(el => {
        if (el) el.classList.remove('invalid-border');
    });
    [progError, courseError, groupError].forEach(err => {
        if (err) err.style.display = 'none';
    });

    // 2. Strict Validation Logic
    if (!progEl || progEl.value === "") {
        if (progEl) progEl.classList.add('invalid-border');
        if (progError) progError.style.display = 'block';
        isValid = false;
    }
    if (!courseEl || courseEl.value === "") {
        if (courseEl) courseEl.classList.add('invalid-border');
        if (courseError) courseError.style.display = 'block';
        isValid = false;
    }
    if (!groupEl || groupEl.value === "") {
        if (groupEl) groupEl.classList.add('invalid-border');
        if (groupError) groupError.style.display = 'block';
        isValid = false;
    }

    // 3. Execution if valid
    if (isValid) {
        const studentID = decodeURIComponent(params.get('sid') || "N/A");
        const selectedCourse = courseEl.value;
        const todayDate = new Date().toLocaleDateString();

        // Retrieve existing records
        let records = JSON.parse(localStorage.getItem('attendanceDB')) || [];

        // Checks if this Student ID has already marked attendance for this Course on this Date
        const isDuplicate = records.some(rec => 
            rec.sid === studentID && 
            rec.course === selectedCourse && 
            rec.date === todayDate
        );

        if (isDuplicate) {
            alert("⚠️ Attendance already recorded for this course today!");
            return; // Exit the function so no new record is saved
        }

        // Create new attendance record
        const newRecord = {
            name: decodeURIComponent(params.get('username') || "Unknown"),
            sid: studentID,
            programme: progEl.value,
            course: selectedCourse,
            group: groupEl.value,
            date: todayDate,
            time: new Date().toLocaleTimeString(),
            status: "Present"
        };

        // Save to LocalStorage
        records.push(newRecord);
        localStorage.setItem('attendanceDB', JSON.stringify(records));

        // Feedback
        showToast("Attendance Marked Successfully!");
        
        // Refresh the lecturer table data in the background
        if (typeof loadRecords === "function") {
            loadRecords();
        }

        // Reset the form fields
        progEl.value = ""; 
        courseEl.value = ""; 
        groupEl.value = "";
    }
}
function loadRecords() {
    const tableBody = document.getElementById('recordsTableBody');
    if (!tableBody) return;

    // 1. Get filter values
    const selectedDate = document.getElementById('dateFilter').value; // Returns YYYY-MM-DD
    const progFilter = document.getElementById('progFilter').value;
    const courseFilter = document.getElementById('courseFilter').value;
    const groupFilter = document.getElementById('groupFilter').value;

    let records = JSON.parse(localStorage.getItem('attendanceDB')) || [];

    // 2. Apply Filtering Logic
    const filteredRecords = records.filter(rec => {
        // Handle Date Comparison
        let matchDate = true;
        if (selectedDate !== "") {
            // Convert record date string to a date object to compare with input
            const recDateObj = new Date(rec.date);
            const inputDateObj = new Date(selectedDate);
            
            // Check if year, month, and day match
            matchDate = recDateObj.toDateString() === inputDateObj.toDateString();
        }

        const matchProg = progFilter === "" || rec.programme === progFilter;
        const matchCourse = courseFilter === "" || rec.course === courseFilter;
        const matchGroup = groupFilter === "" || rec.group === groupFilter;
        
        return matchDate && matchProg && matchCourse && matchGroup;
    });

    // 3. Render Table
    if (filteredRecords.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No records found for the selected filters.</td></tr>`;
    } else {
        tableBody.innerHTML = filteredRecords.reverse().map(rec => `
            <tr>
                <td>${rec.name}</td>
                <td>${rec.sid}</td>
                <td>${rec.programme}</td>
                <td>${rec.course}</td>
                <td>${rec.group}</td>
                <td>${rec.date}</td>
                <td>${rec.time}</td>
                <td><span class="status-present">${rec.status}</span></td>
            </tr>
        `).join('');
    }
}

function resetFilters() {
    // Clear all filter values
    document.getElementById('dateFilter').value = "";
    document.getElementById('progFilter').value = "";
    document.getElementById('courseFilter').value = "";
    document.getElementById('groupFilter').value = "";

    // Reload the table with all records
    loadRecords();
    
    // Showing a small toast to confirm reset
    if (typeof showToast === "function") {
        showToast("Filters cleared");
    }
}

function downloadCSV() {
    // Re-run the filter logic to get only what the lecturer sees on screen
    const progFilter = document.getElementById('progFilter').value;
    const courseFilter = document.getElementById('courseFilter').value;
    const groupFilter = document.getElementById('groupFilter').value;
    const selectedDate = document.getElementById('dateFilter').value;

    let records = JSON.parse(localStorage.getItem('attendanceDB')) || [];

    const filtered = records.filter(rec => {
        let matchDate = true;
        if (selectedDate !== "") {
            matchDate = new Date(rec.date).toDateString() === new Date(selectedDate).toDateString();
        }
        return matchDate && 
               (progFilter === "" || rec.programme === progFilter) &&
               (courseFilter === "" || rec.course === courseFilter) &&
               (groupFilter === "" || rec.group === groupFilter);
    });

    if (filtered.length === 0) {
        alert("No records to download!");
        return;
    }

    // 2. Create CSV Content
    const headers = ["Student Name", "Student ID", "Programme", "Course", "Group", "Date", "Time", "Status"];
    const csvRows = [headers.join(",")]; // Add headers first

    for (const row of filtered) {
        const values = [
            `"${row.name}"`, 
            `"${row.sid}"`, 
            `"${row.programme}"`, 
            `"${row.course}"`, 
            `"${row.group}"`, 
            `"${row.date}"`, 
            `"${row.time}"`, 
            `"${row.status}"`
        ];
        csvRows.push(values.join(","));
    }

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    // 3. Trigger Download
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `Attendance_Report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
function logout() { window.location.href = "login.html"; }