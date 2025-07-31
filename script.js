document.getElementById('studyForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const subjectsCount = parseInt(document.getElementById('subjects').value);
  const arrearCount = parseInt(document.getElementById('arrears').value);

  const totalSubjects = subjectsCount + arrearCount;

  // Calendar dates for the semester
  const startDate = new Date("2025-08-01");
  const endDate = new Date("2025-12-10");

  const unitParts = ["2-mark Qs (10)", "13-mark Qs (5)", "15-mark Q (1)"];
  const unitsPerSubject = 5;

  // List of all dates in the semester
  const days = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Make all study segments (subject, unit, part)
  const segments = [];
  for(let s=1; s<=totalSubjects; s++) {
    for(let u=1; u<=unitsPerSubject; u++) {
      for(let p=0; p<unitParts.length; p++) {
        segments.push({
          subject: s,
          unit: u,
          part: unitParts[p]
        });
      }
    }
  }

  // Fill the plan: assign each segment to a day, then revision for extra days
  const plannerDiv = document.getElementById('planner');
  plannerDiv.innerHTML = `<h2>Study Plan for ${name} (${days.length} days)</h2>`;

  let schedule = [];
  let segIdx = 0;
  for(let i=0; i<days.length; i++) {
    let dayPlan;
    if(segIdx < segments.length) {
      let seg = segments[segIdx];
      dayPlan = {
        date: days[i],
        subject: seg.subject,
        unit: seg.unit,
        part: seg.part,
        type: "Study"
      };
      segIdx++;
    } else {
      dayPlan = {
        date: days[i],
        subject: "-",
        unit: "-",
        part: "Revision / Buffer Day",
        type: "Revision"
      };
    }
    schedule.push(dayPlan);
  }

  // Render planner
  for(let i=0; i<schedule.length; i++) {
    const entry = schedule[i];
    const div = document.createElement('div');
    div.className = 'calendar-day';
    div.innerHTML = `
      <b>${entry.date.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year: 'numeric' })}</b>:
      ${entry.type === "Study" 
        ? `Subject ${entry.subject}, Unit ${entry.unit} — <b>${entry.part}</b> <br/>
           <span style="font-size:.96em;font-weight:400">(Spend 1 hour practicing just the above part, as per University blueprint.)</span>`
        : `<b>Revision / Buffer/Catch-up</b>`
      }
    `;
    plannerDiv.appendChild(div);
  }

  // Enable CSV download
  document.getElementById('downloadBtn').style.display = 'block';
  document.getElementById('downloadBtn').onclick = function() {
    downloadCSV(schedule, name);
  };
});

function downloadCSV(schedule, name) {
  let csv = "Date,Subject,Unit,Part/Action\n";
  schedule.forEach(item => {
    csv += `"${item.date.toLocaleDateString('en-GB')}",${item.subject},${item.unit},"${item.part}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (name||"study") + "_semester_study_plan.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
