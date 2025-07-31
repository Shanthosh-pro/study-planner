// -------------------
// Theme toggle logic
// -------------------

const themeToggleBtn = document.getElementById('themeToggle');
const bodyElem = document.body;

function setTheme(theme) {
  if (theme === 'dark') {
    bodyElem.classList.add('dark-theme');
    themeToggleBtn.textContent = '🌙';
  } else {
    bodyElem.classList.remove('dark-theme');
    themeToggleBtn.textContent = '🌞';
  }
  localStorage.setItem('theme', theme);
}

// Load saved theme or default to light
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = localStorage.getItem('theme') || 'light';
  setTheme(currentTheme === 'light' ? 'dark' : 'light');
});

// -------------------
// Login Section Logic
// -------------------

const usersDB = {
  // predefined users for demo; You can extend this or implement signup if needed
  'student1': 'password123',
  'student2': 'pass456'
};

const loginSection = document.getElementById('loginSection');
const plannerSection = document.getElementById('plannerSection');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');
const usernameInput = document.getElementById('username');

loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const password = document.getElementById('password').value;

  if(usersDB[username] && usersDB[username] === password) {
    sessionStorage.setItem('loggedInUser', username);
    loginError.style.display = 'none';
    showPlannerSection(username);
  } else {
    loginError.style.display = 'block';
  }
});

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('loggedInUser');
  plannerSection.style.display = 'none';
  loginSection.style.display = 'block';
  clearPlanner();
});

function showPlannerSection(username) {
  loginSection.style.display = 'none';
  plannerSection.style.display = 'flex';

  // Pre-fill name input with username on login
  document.getElementById('name').value = username;

  // Optionally, load previously saved study progress, break days, etc. here
}

// Clear existing planner UI and form
function clearPlanner() {
  document.getElementById('planner').innerHTML = '';
  document.querySelector('.download-buttons').style.display = 'none';
  document.getElementById('breakDaySelector').style.display = 'none';
  document.getElementById('studyForm').reset();
  // Also clear break days container
  document.getElementById('breakDaysContainer').innerHTML = '';
}

// On page load check if logged in (persist session if needed)
window.addEventListener('load', () => {
  const loggedInUser = sessionStorage.getItem('loggedInUser');
  if(loggedInUser){
    showPlannerSection(loggedInUser);
  }
});

// -------------------
// Study Planner Logic
// -------------------

const studyForm = document.getElementById('studyForm');
const plannerDiv = document.getElementById('planner');
const breakDaySelector = document.getElementById('breakDaySelector');
const breakDaysContainer = document.getElementById('breakDaysContainer');
const saveBreakDaysBtn = document.getElementById('saveBreakDaysBtn');

let schedule = [];
let allStudyDays = [];
let username = null;

studyForm.addEventListener('submit', function(e) {
  e.preventDefault();

  username = sessionStorage.getItem('loggedInUser');
  if (!username) {
    alert("Please login first!");
    return;
  }

  const name = document.getElementById('name').value.trim();
  const subjectsCount = parseInt(document.getElementById('subjects').value);
  const arrearCount = parseInt(document.getElementById('arrears').value);
  const totalSubjects = subjectsCount + arrearCount;

  if (totalSubjects <= 0) {
    alert("Please enter at least one subject or arrear.");
    return;
  }

  // Semester start/end and exam periods
  const semesterStart = new Date("2025-08-01");
  const cat1ExamStart = new Date("2025-08-20");
  const cat1ExamEnd = new Date("2025-08-27");
  const cat2ExamStart = new Date("2025-10-28");
  const cat2ExamEnd = new Date("2025-11-04");
  const semesterEnd = new Date("2025-12-10");

  // Blueprint parts
  const unitParts = ["2-mark Qs (10) 📄", "13-mark Qs (5) 📝", "15-mark Q (1) 🏆"];
  const unitsPerSubject = 5;

  // Generate all dates in semester
  allStudyDays = [];
  let curDate = new Date(semesterStart);
  while(curDate <= semesterEnd){
    // Exclude CAT 1 and CAT 2 exam days
    if(!((curDate >= cat1ExamStart && curDate <= cat1ExamEnd) ||
      (curDate >= cat2ExamStart && curDate <= cat2ExamEnd))){
      allStudyDays.push(new Date(curDate));
    }
    curDate.setDate(curDate.getDate()+1);
  }

  // Load user’s previously selected break days
  let savedBreakDays = JSON.parse(localStorage.getItem(`breakDays_${username}`) || '[]');
  
  // Generate initial study segments for CAT1 and CAT2 portions
  let cat1Segments = [];
  for(let s=1; s<=totalSubjects; s++){
    for(let u=1; u<=3; u++){
      for(let p=0; p<unitParts.length; p++){
        cat1Segments.push({subject: s, unit: u, part: unitParts[p], portion: 'CAT 1'});
      }
    }
  }

  let cat2Segments = [];
  for(let s=1; s<=totalSubjects; s++){
    for(let u=4; u<=unitsPerSubject; u++){
      for(let p=0; p<unitParts.length; p++){
        cat2Segments.push({subject: s, unit: u, part: unitParts[p], portion: 'CAT 2'});
      }
    }
  }

  // Filter study days excluding user break days
  let breakSet = new Set(savedBreakDays);
  let filteredStudyDays = allStudyDays.filter(d => !breakSet.has(d.toISOString().slice(0,10)));

  // Split study days: CAT1 days before CAT1 exam, CAT2 days in between CAT1 and CAT2 exams,
  // post-CAT2 days reserved for buffer/revision and partial task adjustments
  let cat1StudyDays = filteredStudyDays.filter(d => d < cat1ExamStart);
  let cat2StudyDays = filteredStudyDays.filter(d => (d > cat1ExamEnd && d < cat2ExamStart));
  let postCat2Days = filteredStudyDays.filter(d => d > cat2ExamEnd);

  // Schedule array construction
  schedule = [];

  // Helper function to push "Break Day" into schedule on user break days
  savedBreakDays.forEach(bd => {
    schedule.push({
      date: new Date(bd),
      subject: null,
      unit: null,
      part: null,
      portion: null,
      isBreak: true
    });
  });

  // Assign CAT 1 segments to CAT 1 study days
  let cat1Idx = 0;
  for(let i=0; i < cat1StudyDays.length && cat1Idx < cat1Segments.length; i++, cat1Idx++){
    schedule.push({
      date: cat1StudyDays[i],
      ...cat1Segments[cat1Idx],
      isBreak: false
    });
  }
  // Assign CAT 2 segments to CAT 2 study days
  let cat2Idx = 0;
  for(let i=0; i < cat2StudyDays.length && cat2Idx < cat2Segments.length; i++, cat2Idx++){
    schedule.push({
      date: cat2StudyDays[i],
      ...cat2Segments[cat2Idx],
      isBreak: false,
    });
  }
  // Remaining post CAT2 days for revision / buffer
  postCat2Days.forEach(d => {
    schedule.push({
      date: d,
      subject: '-',
      unit: '-',
      part: 'Revision / Buffer Day 💪',
      portion: 'Revision',
      isBreak: false,
    });
  });

  // Sort the full schedule array by date ascending
  schedule.sort((a,b) => a.date - b.date);

  // Render break day selector UI to let user customize break days
  showBreakDaySelector(allStudyDays, savedBreakDays);

  // Render the planner with interactive tasks
  renderPlannerWithTasks(schedule, username);

  // Show download buttons
  document.querySelector('.download-buttons').style.display = 'flex';
});

// ---------------------
// Break Days Selector UI
// ---------------------

function showBreakDaySelector(allDays, savedBreakDays){
  breakDaySelector.style.display = 'block';
  breakDaysContainer.innerHTML = '';
  
  allDays.forEach(dateObj => {
    const dateStr = dateObj.toISOString().slice(0, 10);
    const checked = savedBreakDays.includes(dateStr) ? 'checked' : '';
    const label = document.createElement('label');
    label.style.display = 'block';
    label.innerHTML = `<input type="checkbox" class="break-day-checkbox" data-date="${dateStr}" ${checked}> ${dateObj.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}`;
    breakDaysContainer.appendChild(label);
  });
}

saveBreakDaysBtn.addEventListener('click', () => {
  if(!username) return alert('Please login to save break days.');

  const checkboxes = document.querySelectorAll('.break-day-checkbox');
  const selected = [];
  checkboxes.forEach(cb => {
    if(cb.checked) selected.push(cb.getAttribute('data-date'));
  });

  // Validate max 2 breaks per month
  const monthCount = {};
  let valid = true;
  selected.forEach(dateStr => {
    const month = dateStr.slice(0,7);
    monthCount[month] = (monthCount[month]||0)+1;
    if(monthCount[month]>2) valid = false;
  });

  if(!valid){
    return alert('You can select maximum 2 break days per month.');
  }

  localStorage.setItem(`breakDays_${username}`, JSON.stringify(selected));
  alert('Break days saved! Your study plan will now update accordingly.');

  // Regenerate the plan automatically:
  studyForm.dispatchEvent(new Event('submit'));
});

// -------------------------------
// Render planner with tasks & notes
// -------------------------------

function renderPlannerWithTasks(schedule, username){
  plannerDiv.innerHTML = `<h2>Study Plan for ${username} 💡</h2>`;

  schedule.forEach((entry, i) => {
    const dateStr = entry.date.toISOString().slice(0,10);

    // Load saved progress & notes per day
    let progress = loadDailyProgress(username, dateStr);

    if(entry.isBreak){
      plannerDiv.insertAdjacentHTML('beforeend', `
        <div class="calendar-day break-day">
          <b>${entry.date.toLocaleDateString('en-GB')}</b>: <span>Break Day - Recharge! 💆‍♂️</span>
        </div>
      `);
      return;
    }

    const div = document.createElement('div');
    div.className = 'calendar-day';
    div.innerHTML = `
      <b>${entry.date.toLocaleDateString('en-GB')}</b>:
      Subject ${entry.subject}, Unit ${entry.unit} — <b>${entry.part}</b> 
      <br/>
      <small>(${entry.portion} Portion - Spend 1 hour focused study)</small> 🌟<br/><br/>

      <label>Status:
        <select id="status_${dateStr}">
          <option value="not-done" ${progress.status === 'not-done' ? 'selected' : ''}>Not Done ❌</option>
          <option value="done" ${progress.status === 'done' ? 'selected' : ''}>Done ✅</option>
          <option value="partial" ${progress.status === 'partial' ? 'selected' : ''}>Partial ➗</option>
        </select>
      </label>
      <br/><br/>
      <label>Notes:<br/>
        <textarea id="notes_${dateStr}" rows="3" placeholder="Add your notes...">${progress.notes || ''}</textarea>
      </label>
    `;

    // Save progress on status change
    div.querySelector(`#status_${dateStr}`).addEventListener('change', (e) => {
      const newStatus = e.target.value;
      const notesVal = div.querySelector(`#notes_${dateStr}`).value;
      saveDailyProgress(username, dateStr, newStatus, notesVal);

      if(newStatus === 'partial'){
        handlePartial(i, schedule, username);
      }
    });

    // Save notes on typing
    div.querySelector(`#notes_${dateStr}`).addEventListener('input', (e) => {
      const notesVal = e.target.value;
      const statusVal = div.querySelector(`#status_${dateStr}`).value;
      saveDailyProgress(username, dateStr, statusVal, notesVal);
    });

    plannerDiv.appendChild(div);
  });
}

// -------------------
// Saving/Loading progress
// -------------------

function saveDailyProgress(username, dateStr, status, notes){
  if(!username) return;
  const key = `studyprogress_${username}_${dateStr}`;
  localStorage.setItem(key, JSON.stringify({ status, notes }));
}

function loadDailyProgress(username, dateStr){
  if(!username) return { status:'not-done', notes:'' };
  const key = `studyprogress_${username}_${dateStr}`;
  const data = localStorage.getItem(key);
  if(data){
    try{
      return JSON.parse(data);
    }catch(e){}
  }
  return { status:'not-done', notes:'' };
}

// -------------------
// Partial completion logic
// -------------------

function handlePartial(dayIndex, schedule, username){
  // Cannot add partial task if no next day
  if(dayIndex + 1 >= schedule.length) return;

  const currentTask = schedule[dayIndex];

  // Find next study day that is not a break
  let insertIdx = dayIndex + 1;
  while(insertIdx < schedule.length && schedule[insertIdx].isBreak){
    insertIdx++;
  }
  if(insertIdx >= schedule.length) return;

  // Compose a carryover partial task for next day
  const carryOverTask = {
    date: schedule[insertIdx].date,
    subject: currentTask.subject,
    unit: currentTask.unit,
    part: currentTask.part + ' (Carried over)',
    portion: currentTask.portion,
    isBreak: false,
  };

  // Insert the new partial task into schedule at insertIdx
  schedule.splice(insertIdx, 0, carryOverTask);

  // Save progress with default not done and notes indicating carryover (optional)
  saveDailyProgress(username, carryOverTask.date.toISOString().slice(0,10), 'not-done', 'Carried over from previous day - Partial completion');

  // Re-render planner after adding carryover task
  renderPlannerWithTasks(schedule, username);
}

// -------------------
// Download CSV & PDF
// -------------------

const { jsPDF } = window.jspdf;

document.getElementById('downloadCsvBtn').addEventListener('click', () => {
  if(!username) return alert('Please login and generate plan first.');
  downloadCSV(schedule, username);
});

document.getElementById('downloadPdfBtn').addEventListener('click', () => {
  if(!username) return alert('Please login and generate plan first.');
  downloadPDF(schedule, username);
});

function downloadCSV(schedule, username){
  let csv = "Date,Subject,Unit,Part/Action,Portion,Status,Notes\n";
  schedule.forEach(entry => {
    const dateStr = entry.date.toLocaleDateString('en-GB');
    const progress = loadDailyProgress(username, entry.date.toISOString().slice(0,10));
    csv += `"${dateStr}",${entry.subject || ''},${entry.unit || ''},"${(entry.part || '').replace(/,/g,'')}",${entry.portion || ''},${progress.status || ''},"${(progress.notes || '').replace(/"/g,'""')}"\n`;
  });
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${username}_semester_study_plan.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadPDF(schedule, username){
  const doc = new jsPDF({unit:'pt',format:'a4'});
  const margin = 40;
  const lineHeight = 18;
  let y = margin;

  doc.setFontSize(18);
  doc.text(`Study Plan for ${username}`, margin, y);
  y += 30;
  doc.setFontSize(12);

  schedule.forEach(entry => {
    if(y + lineHeight > doc.internal.pageSize.height - margin){
      doc.addPage();
      y = margin;
    }
    const dateStr = entry.date.toLocaleDateString('en-GB');
    const progress = loadDailyProgress(username, entry.date.toISOString().slice(0,10));
    let line = `${dateStr}: `;

    if(entry.isBreak){
      line += `Break Day - Recharge! 💆‍♂️`;
    } else {
      line += `Subject ${entry.subject}, Unit ${entry.unit}, ${entry.part} (${entry.portion}), Status: ${progress.status || 'N/A'}` 
          + (progress.notes ? `, Notes: ${progress.notes}` : '');
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });

  doc.save(`${username}_semester_study_plan.pdf`);
}

