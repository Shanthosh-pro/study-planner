// ===== Theme Toggle =====

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

const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = localStorage.getItem('theme') || 'light';
  setTheme(currentTheme === 'light' ? 'dark' : 'light');
});

// ===== Login Logic =====

const usersDB = {
  'student1': 'password123',
  'student2': 'pass456'
};

const loginSection = document.getElementById('loginSection');
const plannerSection = document.getElementById('plannerSection');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');
const usernameInput = document.getElementById('username');

let username = null; // Logged in username

loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const inputUser = usernameInput.value.trim();
  const password = document.getElementById('password').value;

  if(usersDB[inputUser] && usersDB[inputUser] === password){
    username = inputUser;
    sessionStorage.setItem('loggedInUser', username);
    loginError.style.display = 'none';
    showPlannerSection(username);
  } else {
    loginError.style.display = 'block';
  }
});

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('loggedInUser');
  username = null;
  plannerSection.style.display = 'none';
  loginSection.style.display = 'block';
  clearPlanner();
});

function showPlannerSection(user){
  loginSection.style.display = 'none';
  plannerSection.style.display = 'flex';
  document.getElementById('name').value = user;
}

function clearPlanner() {
  document.getElementById('planner').innerHTML = '';
  document.querySelector('.download-buttons').style.display = 'none';
  document.getElementById('breakDaySelector').style.display = 'none';
  document.getElementById('progressControls').style.display = 'none';
  document.getElementById('studyForm').reset();
  document.getElementById('breakDaysContainer').innerHTML = '';
}

window.addEventListener('load', () => {
  const storedUser = sessionStorage.getItem('loggedInUser');
  if(storedUser){
    username = storedUser;
    showPlannerSection(username);
  }
});

// ===== Study Planner Logic =====

const studyForm = document.getElementById('studyForm');
const plannerDiv = document.getElementById('planner');
const breakDaySelector = document.getElementById('breakDaySelector');
const breakDaysContainer = document.getElementById('breakDaysContainer');
const saveBreakDaysBtn = document.getElementById('saveBreakDaysBtn');
const progressControls = document.getElementById('progressControls');
const saveProgressBtn = document.getElementById('saveProgressBtn');

let schedule = [];
let allStudyDays = [];

studyForm.addEventListener('submit', function(e) {
  e.preventDefault();

  if(!username){
    alert("Please login first!");
    return;
  }

  const name = document.getElementById('name').value.trim();
  const subjectsCount = parseInt(document.getElementById('subjects').value);
  const arrearCount = parseInt(document.getElementById('arrears').value);
  const totalSubjects = subjectsCount + arrearCount;

  if(totalSubjects <= 0){
    alert("Please enter at least one subject or arrear.");
    return;
  }

  // Constants: semester period, exam dates
  const semesterStart = new Date("2025-08-01");
  const cat1ExamStart = new Date("2025-08-20");
  const cat1ExamEnd = new Date("2025-08-27");
  const cat2ExamStart = new Date("2025-10-28");
  const cat2ExamEnd = new Date("2025-11-04");
  const semesterEnd = new Date("2025-12-10");

  const unitParts = ["2-mark Qs (10) 📄", "13-mark Qs (5) 📝", "15-mark Q (1) 🏆"];
  const unitsPerSubject = 5;

  // Generate all study days (excluding CAT exam days)
  allStudyDays = [];
  let curDate = new Date(semesterStart);
  while(curDate <= semesterEnd){
    if(!((curDate >= cat1ExamStart && curDate <= cat1ExamEnd) ||
         (curDate >= cat2ExamStart && curDate <= cat2ExamEnd))) {
      allStudyDays.push(new Date(curDate));
    }
    curDate.setDate(curDate.getDate() + 1);
  }

  // Load user break days from localStorage
  let savedBreakDays = JSON.parse(localStorage.getItem(`breakDays_${username}`) || '[]');
  let breakSet = new Set(savedBreakDays);

  // Filter study days excluding breaks
  let filteredStudyDays = allStudyDays.filter(d => !breakSet.has(d.toISOString().slice(0,10)));

  // Split days based on exam periods:
  let cat1StudyDays = filteredStudyDays.filter(d => d < cat1ExamStart);
  let cat2StudyDays = filteredStudyDays.filter(d => (d > cat1ExamEnd && d < cat2ExamStart));
  let postCat2Days = filteredStudyDays.filter(d => d > cat2ExamEnd);

  // Generate segments for study parts:
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
    for(let u=4; u <= unitsPerSubject; u++){
      for(let p=0; p<unitParts.length; p++){
        cat2Segments.push({subject: s, unit: u, part: unitParts[p], portion: 'CAT 2'});
      }
    }
  }

  // Build schedule
  schedule = [];

  // Insert break days explicitly
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

  // Assign CAT1 and CAT2 tasks to filtered days
  let cat1idx = 0, cat2idx = 0;

  for(let i=0; i < cat1StudyDays.length && cat1idx < cat1Segments.length; i++, cat1idx++){
    schedule.push({...cat1Segments[cat1idx], date: cat1StudyDays[i], isBreak: false});
  }

  for(let i=0; i < cat2StudyDays.length && cat2idx < cat2Segments.length; i++, cat2idx++){
    schedule.push({...cat2Segments[cat2idx], date: cat2StudyDays[i], isBreak: false});
  }

  // Post CAT2 days for revision buffers
  postCat2Days.forEach(d=>{
    schedule.push({
      date: d,
      subject: '-',
      unit: '-',
      part: 'Revision / Buffer Day 💪',
      portion: 'Revision',
      isBreak: false
    });
  });

  schedule.sort((a,b)=>a.date - b.date);

  // Initially render planner with inputs enabled
  renderPlannerWithTasks(schedule, username, true);

  // Show Save Progress button, hide Break Day Selector and Downloads
  progressControls.style.display = 'block';
  breakDaySelector.style.display = 'none';
  document.querySelector('.download-buttons').style.display = 'none';
});

// ------------ Save Progress ------------

saveProgressBtn.onclick = () => {
  // Save all task inputs to localStorage
  schedule.forEach(entry => {
    if(entry.isBreak) return;
    const dateKey = entry.date.toISOString().slice(0,10);
    const statusEl = document.getElementById(`status_${dateKey}`);
    const notesEl = document.getElementById(`notes_${dateKey}`);
    if(statusEl && notesEl){
      saveDailyProgress(username, dateKey, statusEl.value, notesEl.value);
    }
  });

  alert('Progress saved! You can now customize your break days.');

  // Disable inputs so user can't edit tasks after saving progress
  schedule.forEach(entry => {
    if(entry.isBreak) return;
    const dateKey = entry.date.toISOString().slice(0,10);
    const statusEl = document.getElementById(`status_${dateKey}`);
    const notesEl = document.getElementById(`notes_${dateKey}`);
    if(statusEl) statusEl.disabled = true;
    if(notesEl) notesEl.disabled = true;
  });

  progressControls.style.display = 'none'; // Hide Save Progress button

  // Show Break Day Selector and Downloads
  breakDaySelector.style.display = 'block';
  document.querySelector('.download-buttons').style.display = 'flex';

  // Load user's break days or empty if none
  let savedBreakDays = JSON.parse(localStorage.getItem(`breakDays_${username}`) || '[]');
  showBreakDaySelector(allStudyDays, savedBreakDays);
};

// ------------ Break Day Selector Logic ------------

function showBreakDaySelector(allDays, savedBreakDays){
  breakDaysContainer.innerHTML = '';
  allDays.forEach(dateObj => {
    const dStr = dateObj.toISOString().slice(0,10);
    const checked = savedBreakDays.includes(dStr) ? 'checked' : '';
    const label = document.createElement('label');
    label.style.display = 'block';
    label.innerHTML = `<input type="checkbox" class="break-day-checkbox" data-date="${dStr}" ${checked}> ${dateObj.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}`;
    breakDaysContainer.appendChild(label);
  });
}

saveBreakDaysBtn.onclick = () => {
  if(!username) return alert("Please login.");

  const selectedBreaks = [];
  document.querySelectorAll('.break-day-checkbox').forEach(cb => {
    if(cb.checked) selectedBreaks.push(cb.getAttribute('data-date'));
  });

  // Validate max 2 breaks per month
  const monthCount = {};
  let valid = true;
  selectedBreaks.forEach(datestr => {
    const m = datestr.slice(0,7);
    monthCount[m] = (monthCount[m]||0)+1;
    if(monthCount[m]>2) valid = false;
  });

  if(!valid){
    alert('Maximum 2 break days per month allowed.');
    return;
  }

  localStorage.setItem(`breakDays_${username}`, JSON.stringify(selectedBreaks));
  alert('Break days saved! Regenerating study plan.');

  // Regenerate plan automatically, clearing Save Progress and Break Day selection UI states
  progressControls.style.display = 'none';
  breakDaySelector.style.display = 'none';
  document.querySelector('.download-buttons').style.display = 'none';
  document.getElementById('planner').innerHTML = '';

  // Re-trigger generate plan to reflect break days:
  studyForm.dispatchEvent(new Event('submit'));
};

// ----------- Render Planner -----------

function renderPlannerWithTasks(schedule, username, enableInputs){
  plannerDiv.innerHTML = `<h2>Study Plan for ${username} 💡</h2>`;

  schedule.forEach((entry, i) => {
    const dateStr = entry.date.toISOString().slice(0,10);

    if(entry.isBreak){
      plannerDiv.insertAdjacentHTML('beforeend', `
        <div class="calendar-day break-day">
          <b>${entry.date.toLocaleDateString('en-GB')}</b>: <span>Break Day - Recharge! 💆‍♂️</span>
        </div>
      `);
      return;
    }

    const progress = loadDailyProgress(username, dateStr);

    const div = document.createElement('div');
    div.className = 'calendar-day';
    div.innerHTML = `
      <b>${entry.date.toLocaleDateString('en-GB')}</b>: Subject ${entry.subject}, Unit ${entry.unit} — <b>${entry.part}</b>
      <br/><small>(${entry.portion} Portion - Spend 1 hour focused study)</small> 🌟<br/><br/>
      <label>Status:
        <select id="status_${dateStr}" ${enableInputs ? '' : 'disabled'}>
          <option value="not-done" ${progress.status === 'not-done' ? 'selected' : ''}>Not Done ❌</option>
          <option value="done" ${progress.status === 'done' ? 'selected' : ''}>Done ✅</option>
          <option value="partial" ${progress.status === 'partial' ? 'selected' : ''}>Partial ➗</option>
        </select>
      </label>
      <br/><br/>
      <label>Notes:<br/>
        <textarea id="notes_${dateStr}" rows="3" placeholder="Add your notes..." ${enableInputs ? '' : 'disabled'}>${progress.notes || ''}</textarea>
      </label>
    `;

    if(enableInputs){
      div.querySelector(`#status_${dateStr}`).addEventListener('change', (e) => {
        const val = e.target.value;
        const notesVal = div.querySelector(`#notes_${dateStr}`).value;
        saveDailyProgress(username, dateStr, val, notesVal);

        if(val === 'partial'){
          handlePartial(i, schedule, username);
        }
      });

      div.querySelector(`#notes_${dateStr}`).addEventListener('input', (e) => {
        const notesVal = e.target.value;
        const statusVal = div.querySelector(`#status_${dateStr}`).value;
        saveDailyProgress(username, dateStr, statusVal, notesVal);
      });
    }

    plannerDiv.appendChild(div);
  });
}

// --------- Progress Save/Load ---------

function saveDailyProgress(user, dateStr, status, notes){
  if(!user) return;
  const key = `studyprogress_${user}_${dateStr}`;
  localStorage.setItem(key, JSON.stringify({status, notes}));
}

function loadDailyProgress(user, dateStr){
  if(!user) return {status:'not-done', notes:''};
  const key = `studyprogress_${user}_${dateStr}`;
  const data = localStorage.getItem(key);
  if(data){
    try {return JSON.parse(data);} catch(e) {return {status:'not-done', notes:''}};
  }
  return {status:'not-done', notes:''};
}

// -------- Partial Handling --------

function handlePartial(dayIndex, schedule, username){
  if(dayIndex+1 >= schedule.length) return;

  const curTask = schedule[dayIndex];

  // Find next non-break day
  let idx = dayIndex+1;
  while(idx < schedule.length && schedule[idx].isBreak) idx++;
  if(idx >= schedule.length) return;

  // Insert partial carryover task
  const carryTask = {
    date: schedule[idx].date,
    subject: curTask.subject,
    unit: curTask.unit,
    part: curTask.part + ' (Carried over)',
    portion: curTask.portion,
    isBreak: false
  };

  schedule.splice(idx, 0, carryTask);

  // Save default progress for new task
  saveDailyProgress(username, carryTask.date.toISOString().slice(0,10), 'not-done', 'Carried over from previous day - Partial completion');

  // Re-render planner inputs enabled to allow editing new task
  renderPlannerWithTasks(schedule, username, true);

  // Hide Save Progress and Break Selector so user saves again
  progressControls.style.display = 'block';
  breakDaySelector.style.display = 'none';
  document.querySelector('.download-buttons').style.display = 'none';
}

// -------- Download CSV/PDF -----------

const { jsPDF } = window.jspdf;

document.getElementById('downloadCsvBtn').addEventListener('click', () => {
  if(!username) return alert('Please login and generate plan first.');
  downloadCSV(schedule, username);
});

document.getElementById('downloadPdfBtn').addEventListener('click', () => {
  if(!username) return alert('Please login and generate plan first.');
  downloadPDF(schedule, username);
});

function downloadCSV(schedule, user){
  let csv = "Date,Subject,Unit,Part/Action,Portion,Status,Notes\n";
  schedule.forEach(entry => {
    const dateStr = entry.date.toLocaleDateString('en-GB');
    const prog = loadDailyProgress(user, entry.date.toISOString().slice(0,10));
    csv += `"${dateStr}",${entry.subject || ''},${entry.unit || ''},"${(entry.part || '').replace(/,/g, '')}",${entry.portion || ''},${prog.status || ''},"${(prog.notes || '').replace(/"/g,'""')}"\n`;
  });
  const blob = new Blob([csv], {type:'text/csv'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${user}_semester_study_plan.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadPDF(schedule, user){
  const doc = new jsPDF({unit:'pt',format:'a4'});
  const margin = 40;
  const lineHeight = 18;
  let y = margin;

  doc.setFontSize(18);
  doc.text(`Study Plan for ${user}`, margin, y);
  y += 30;
  doc.setFontSize(12);

  schedule.forEach(entry => {
    if(y + lineHeight > doc.internal.pageSize.height - margin){
      doc.addPage();
      y = margin;
    }
    const dateStr = entry.date.toLocaleDateString('en-GB');
    const prog = loadDailyProgress(user, entry.date.toISOString().slice(0,10));
    let line = `${dateStr}: `;
    if(entry.isBreak) {
      line += 'Break Day - Recharge! 💆‍♂️';
    } else {
      line += `Subject ${entry.subject}, Unit ${entry.unit}, ${entry.part} (${entry.portion}), Status: ${prog.status || 'N/A'}`;
      if(prog.notes) line += `, Notes: ${prog.notes}`;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });

  doc.save(`${user}_semester_study_plan.pdf`);
}

