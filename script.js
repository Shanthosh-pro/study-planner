// Theme toggle and persistence
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

// On load, set saved theme or default light
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = localStorage.getItem('theme') || 'light';
  setTheme(currentTheme === 'light' ? 'dark' : 'light');
});

document.getElementById('studyForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const subjectsCount = parseInt(document.getElementById('subjects').value);
  const arrearCount = parseInt(document.getElementById('arrears').value);
  const totalSubjects = subjectsCount + arrearCount;

  // Semester & exam dates
  const semesterStart = new Date("2025-08-01");
  const cat1ExamStart = new Date("2025-08-20");
  const cat1ExamEnd = new Date("2025-08-27");
  const cat2ExamStart = new Date("2025-10-28");
  const cat2ExamEnd = new Date("2025-11-04");
  const semesterEnd = new Date("2025-12-10");

  // Blueprint parts per unit
  const unitParts = ["2-mark Qs (10) 📄", "13-mark Qs (5) 📝", "15-mark Q (1) 🏆"];
  const unitsPerSubject = 5;

  // Generate all study days excluding CAT exam periods
  const allDays = [];
  let curDate = new Date(semesterStart);
  while (curDate <= semesterEnd) {
    if (!(
      (curDate >= cat1ExamStart && curDate <= cat1ExamEnd) ||
      (curDate >= cat2ExamStart && curDate <= cat2ExamEnd)
    )) {
      allDays.push(new Date(curDate));
    }
    curDate.setDate(curDate.getDate() + 1);
  }

  // Split days into CAT1, CAT2, and post CAT2 revision days
  const cat1StudyDays = allDays.filter(d => d < cat1ExamStart);
  const cat2StudyDays = allDays.filter(d => (d > cat1ExamEnd && d < cat2ExamStart));
  const postCat2Days = allDays.filter(d => d > cat2ExamEnd);

  // Generate study segments for CAT1 (units 1-3)
  const cat1Segments = [];
  for (let s = 1; s <= totalSubjects; s++) {
    for (let u = 1; u <= 3; u++) {
      for (let p = 0; p < unitParts.length; p++) {
        cat1Segments.push({ subject: s, unit: u, part: unitParts[p], portion: 'CAT 1' });
      }
    }
  }

  // Generate study segments for CAT2 (units 4-5)
  const cat2Segments = [];
  for (let s = 1; s <= totalSubjects; s++) {
    for (let u = 4; u <= unitsPerSubject; u++) {
      for (let p = 0; p < unitParts.length; p++) {
        cat2Segments.push({ subject: s, unit: u, part: unitParts[p], portion: 'CAT 2' });
      }
    }
  }

  // Scheduling tasks
  const schedule = [];
  let cat1Idx = 0;
  let cat2Idx = 0;

  for (let i = 0; i < cat1StudyDays.length && cat1Idx < cat1Segments.length; i++, cat1Idx++) {
    schedule.push({ date: cat1StudyDays[i], ...cat1Segments[cat1Idx] });
  }
  for (let i = 0; i < cat2StudyDays.length && cat2Idx < cat2Segments.length; i++, cat2Idx++) {
    schedule.push({ date: cat2StudyDays[i], ...cat2Segments[cat2Idx] });
  }
  postCat2Days.forEach(d => {
    schedule.push({
      date: d,
      subject: '-',
      unit: '-',
      part: 'Revision / Buffer Day 💪',
      portion: 'Revision'
    });
  });

  // Sort by date
  schedule.sort((a, b) => a.date - b.date);

  // Render planner
  const plannerDiv = document.getElementById('planner');
  plannerDiv.innerHTML = `<h2>Study Plan for ${name} 💡</h2>`;

  schedule.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    div.innerHTML = `
      <b>${entry.date.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</b>:
      ${entry.subject !== '-' ? 
        `Subject ${entry.subject}, Unit ${entry.unit} — <b>${entry.part}</b> <br/>
         <small>(${entry.portion} Portion - Spend 1 hour focused study)</small> 🌟` :
        `<b>${entry.part}</b>`
      }
    `;
    plannerDiv.appendChild(div);
  });

  // Show download buttons
  const downloadDiv = document.querySelector('.download-buttons');
  downloadDiv.style.display = 'flex';
  downloadDiv.style.gap = '15px';

  document.getElementById('downloadCsvBtn').onclick = () => downloadCSV(schedule, name);
  document.getElementById('downloadPdfBtn').onclick = () => downloadPDF(schedule, name);
});

// CSV Download
function downloadCSV(schedule, name) {
  let csv = "Date,Subject,Unit,Part/Action,Portion\n";
  schedule.forEach(item => {
    csv += `"${item.date.toLocaleDateString('en-GB')}",${item.subject},${item.unit},"${item.part.replace(/,/g, '')}","${item.portion || ''}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (name || "study") + "_semester_study_plan.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// PDF Download with jsPDF
function downloadPDF(schedule, name) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    format: "a4",
    unit: "pt",
    orientation: "portrait"
  });

  const margin = 40;
  const lineHeight = 18;
  let y = margin;

  doc.setFontSize(18);
  doc.text(`Study Plan for ${name}`, margin, y);
  y += 30;

  doc.setFontSize(12);

  for(let i = 0; i < schedule.length; i++) {
    const entry = schedule[i];
    const dateStr = entry.date.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

    let line = `${dateStr}: `;
    if (entry.subject !== '-') {
      line += `Subject ${entry.subject}, Unit ${entry.unit} — ${entry.part} (${entry.portion} Portion)`;
    } else {
      line += `${entry.part}`;
    }

    // Handle page break
    if(y + lineHeight > doc.internal.pageSize.height - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }
  doc.save((name || "study") + "_semester_study_plan.pdf");
}

