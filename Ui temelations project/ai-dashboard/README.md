# Beacon – Student AI Dashboard

![Preview](preview.png)

## What the UI pattern is
An AI-powered analytics dashboard for education: it turns a student's marks and attendance into predictions, weak-subject alerts and a study plan.

## Where it is commonly used
School and college portals, learning-management systems, tutoring apps and parent-teacher reports.

## Why it is relevant to modern web interfaces
Marks and attendance sit in tables that are hard to act on. A dashboard that explains what is weak, what is likely to happen and what to do next helps students and teachers make decisions early.

## Patterns observed
- Summary figures at the top, with alerts for risks such as low attendance.
- Charts for marks and attendance by subject.
- Predicted outcomes with a clear status for each subject.
- A suggested plan and a question box that answers in plain language.

## What this implementation does differently
- **Fully editable.** Choose a sample student or "My own data", then change subjects, attendance and four test marks. Every chart, prediction and suggestion updates as you type.
- **Subject-wise attendance** with the 75% minimum marked, and a note on how many classes to attend (or how many can be missed).
- **AI prediction.** Each subject's final mark blends the trend line of the four tests with the latest marks and is lowered when attendance is under 75%. Subjects are marked Strong, Needs work or Weak.
- **Study hours.** Enter hours available per week and a target score. Every subject gets a base share and weaker subjects get more, with minutes per day.
- **Notes and resources** for weak subjects, with study methods and links such as Khan Academy, NPTEL and the Tamil Nadu textbook site.
- **Ask the AI.** Questions such as "Which subject is weak?", "How many hours should I study?" or "Predict my final marks" are answered from the student's own data.

## Important notes
- The sample students are made up. The prediction is a simple, transparent estimate, not a guarantee.
- The 75% attendance rule is a common one; check your own school or college rules.
- Data stays in the browser and is not saved between visits.

## Files
- `index.html` – page structure
- `style.css` – layout, colours and responsive rules
- `script.js` – sample data, analysis, prediction, study plan, charts and question answering

## Run it
Open `index.html` in a modern browser. Switch students, edit a test mark, or ask "Which subject is weak?".
