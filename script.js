document.getElementById('studyForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const subjectsCount = parseInt(document.getElementById('subjects').value);
  const arrearCount = parseInt(document.getElementById('arrears').value);
  const plannerDiv = document.getElementById('planner');
  const totalSubjects = subjectsCount + arrearCount;
  const totalUnits = 5;
  const studyDays = 30;

  let daysPerSubject = Math.floor(studyDays / totalSubjects); // e.g. 5 or 6
  let schedule = [];
  let day = 1;

  for (let s = 1; s <= totalSubjects; s++) {
    for (let u = 1; u <= totalUnits && day <= studyDays; u++, day++) {
      schedule.push({
        day: day,
        subject: s,
        unit: u,
      });
    }
    // Assign extra day(s) for revision if days left
    if (daysPerSubject > totalUnits) {
      let extra = daysPerSubject - totalUnits;
      for (let r = 0; r < extra && day <= studyDays; r++, day++) {
        schedule.push({
          day: day,
          subject: s,
          unit: 'Revision',
        });
      }
    }
  }

  // If days left, cycle subjects again
  let subject = 1;
  while (day <= studyDays) {
    schedule.push({
      day: day,
      subject: subject,
      unit: 'Revision',
    });
    day++;
    subject = (subject % totalSubjects) + 1;
  }

  // Render schedule with blueprint
  plannerDiv.innerHTML = `<h2>30-Day Study Planner for ${name}</h2><h4>(Exam Dates: CAT 1 - 20.08.25, CAT 2 - 28.10.25, End Exam - 14.11.25)</h4>`;
  schedule.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    div.innerHTML = `
      <b>Day ${entry.day}:</b> Study Subject ${entry.subject}, 
      Unit ${entry.unit} <br/>
      <span>Cover: 2-mark Qs (10), 13-mark Qs (5), 15-mark Q (1)</span>
    `;
    plannerDiv.appendChild(div);
  });
});
