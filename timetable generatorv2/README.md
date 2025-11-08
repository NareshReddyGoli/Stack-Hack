 ## Automatic Timetable Generator (Python + OR-Tools)

 This project generates clash-free, precise timetables from CSV inputs using Google's CP-SAT (OR-Tools). It supports lectures and multi-period labs, faculty assignment constraints, section capacities, day worksheet (periods and breaks), and large datasets.

 ### Features
- Hard-constraint solver with CP-SAT (no section or faculty clashes)
- Lectures (single period) and labs (consecutive multi-period blocks)
- **Unified room stickiness**: Sections use ONE room for ALL classes (lectures + labs) within each block between breaks
- **P1 constraint**: Each faculty max 3 first periods per week (fair workload distribution)
- Break periods respected from day worksheet
- **Natural day ordering**: Timetables display Monday → Saturday (not alphabetical)
- **Room conflict prevention**: No double-booking of classrooms
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
 - **Unified room stickiness**: Sections use ONE room for ALL classes (lectures AND labs) within each block between breaks. Even lectures use lab rooms if that's the block's assigned room.
 - **Day ordering**: Timetables display in natural weekday order (Monday → Saturday), not alphabetical.
 - **P1 limit**: Each faculty is assigned to first period (P1) at most 3 times per week across all sections.

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
 - `output/sections/section_<section_id>.csv` - Per-section timetables (Monday → Saturday order)
 - `output/faculty/faculty_<faculty_id>.csv` - Per-faculty schedules
 - `output/master_timetable.csv` - Combined master view
 - `output/available_rooms.csv` - Shows free rooms per timeslot
 - `output/available_faculty.csv` - Shows available lecturers per timeslot
 
 ### Documentation
 - [UNIFIED_ROOM_STICKINESS.md](UNIFIED_ROOM_STICKINESS.md) - **NEW!** One room per block for all classes
 - [P1_CONSTRAINT_INFO.md](P1_CONSTRAINT_INFO.md) - First period (P1) faculty workload limit
 - [ROOM_STICKINESS_INFO.md](ROOM_STICKINESS_INFO.md) - Room allocation principles

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