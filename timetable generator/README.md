 ## Automatic Timetable Generator (Python + OR-Tools)

 This project generates clash-free, precise timetables from CSV inputs using Google's CP-SAT (OR-Tools). It supports lectures and multi-period labs, faculty assignment constraints, section capacities, day worksheet (periods and breaks), and large datasets.

 ### Features
 - Hard-constraint solver with CP-SAT (no section or faculty clashes)
 - Lectures (single period) and labs (consecutive multi-period blocks)
 - Break periods respected from day worksheet
 - Per-section and per-faculty timetables
 - Pre-solver feasibility checks with diagnostics
 - Streamlit UI for quick testing (upload CSVs, generate, download)

 ### Install
 ```bash
 python -m venv .venv
 .venv\Scripts\activate  # Windows PowerShell
 pip install -r requirements.txt
 ```

 ### CSV Inputs (templates in `data/templates/`)
 - `day_worksheet.csv`: defines the week structure and breaks
   - Columns: `day_name,period_index,is_break`
   - Example: Monday has 8 periods with lunch break on period 5
 - `sections.csv`: sections and sizes
   - Columns: `section_id,section_name,num_students`
 - `faculty.csv`: list of faculty
   - Columns: `faculty_id,faculty_name`
 - `courses.csv`: course catalog and default requirements
   - Columns: `course_id,course_name,is_lab,lecture_periods_per_week,lab_sessions_per_week,lab_block_size`
 - `section_course_requirements.csv`: per-section overrides for weekly requirements
   - Columns: `section_id,course_id,weekly_lectures,weekly_lab_sessions,lab_block_size`
 - `faculty_courses.csv`: who teaches what to which section
   - Columns: `faculty_id,course_id,section_id`
 - (Optional) `rooms.csv`: if you want room allocation
   - Columns: `room_id,room_name,capacity,is_lab`

 Notes:
 - Break periods must have `is_break=1`, no classes will be scheduled there.
 - Labs require `lab_block_size` consecutive non-break periods in the same day.
 - If a section-course has both lectures and labs, set both counts.

 ### Quick Start (Streamlit UI)
 ```bash
 streamlit run src/app_streamlit.py
 ```
 1) Upload all CSVs (use provided templates as a starting point)
 2) Click "Generate Timetable"
 3) Review per-section and per-faculty tables; download CSVs

 ### CLI
 ```bash
 python -m src.main \
   --inputs data/templates \
   --output output \
   --time_limit_sec 60
 ```

 ### Output
 - `output/sections/section_<section_id>.csv`
 - `output/faculty/faculty_<faculty_id>.csv`
 - `output/master_timetable.csv`

 ### Large Data Tips
 - Keep day worksheet concise (only teaching periods). Mark all breaks explicitly.
 - Prefer per-section requirement overrides instead of inflating the course list.
 - Increase `--time_limit_sec` for harder instances.

 ### License
 MIT



python -m pip install --disable-pip-version-check -r requirements.txt

python -m streamlit run src/app_streamlit.py 

or

streamlit run src/app_streamlit.py