from __future__ import annotations

import os
from typing import List, Optional

import pandas as pd

try:
    from .models import (
        Course,
        DayPeriod,
        Faculty,
        FacultyCourseAssignment,
        ProblemData,
        Room,
        Section,
        SectionCourseRequirement,
    )
except ImportError:
    from models import (
        Course,
        DayPeriod,
        Faculty,
        FacultyCourseAssignment,
        ProblemData,
        Room,
        Section,
        SectionCourseRequirement,
    )


def _read_csv(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Missing required CSV: {path}")
    df = pd.read_csv(path)
    # Normalize column names
    df.columns = [str(c).strip() for c in df.columns]
    return df


def load_problem_from_directory(inputs_dir: str, optional_rooms: bool = True) -> ProblemData:
    day_df = _read_csv(os.path.join(inputs_dir, "day_worksheet.csv"))
    sections_df = _read_csv(os.path.join(inputs_dir, "sections.csv"))
    faculty_df = _read_csv(os.path.join(inputs_dir, "faculty.csv"))
    courses_df = _read_csv(os.path.join(inputs_dir, "courses.csv"))
    sec_req_df = _read_csv(os.path.join(inputs_dir, "section_course_requirements.csv"))
    fac_course_df = _read_csv(os.path.join(inputs_dir, "faculty_courses.csv"))

    rooms_df: Optional[pd.DataFrame] = None
    if optional_rooms:
        rooms_path = os.path.join(inputs_dir, "rooms.csv")
        if os.path.exists(rooms_path):
            rooms_df = _read_csv(rooms_path)

    day_periods: List[DayPeriod] = []
    required_cols = {"day_name", "period_index", "is_break"}
    missing = required_cols - set(day_df.columns)
    if missing:
        raise ValueError(f"day_worksheet.csv missing columns: {sorted(missing)}")
    # Normalize day_name values to avoid KeyError due to whitespace/case inconsistencies
    day_df["day_name"] = day_df["day_name"].astype(str).str.strip()
    
    # Define natural weekday order (Monday -> Sunday)
    weekday_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    unique_day_names_set = set(day_df["day_name"].tolist())
    
    # Order days by natural weekday sequence, then any remaining alphabetically
    unique_day_names = [d for d in weekday_order if d in unique_day_names_set]
    remaining_days = sorted([d for d in unique_day_names_set if d not in weekday_order])
    unique_day_names.extend(remaining_days)
    
    unique_days = {name: idx for idx, name in enumerate(unique_day_names)}
    for _, row in day_df.iterrows():
        day_periods.append(
            DayPeriod(
                day_index=unique_days[str(row["day_name"]).strip()],
                day_name=str(row["day_name"]).strip(),
                period_index=int(row["period_index"]),
                is_break=bool(int(row["is_break"])) if str(row["is_break"]).strip() != "" else False,
            )
        )

    sections: List[Section] = []
    required_cols = {"section_id", "section_name", "num_students"}
    missing = required_cols - set(sections_df.columns)
    if missing:
        raise ValueError(f"sections.csv missing columns: {sorted(missing)}")
    for _, row in sections_df.iterrows():
        sections.append(
            Section(
                section_id=str(row["section_id"]).strip(),
                section_name=str(row["section_name"]).strip(),
                num_students=int(row["num_students"]),
            )
        )

    faculty: List[Faculty] = []
    required_cols = {"faculty_id", "faculty_name"}
    missing = required_cols - set(faculty_df.columns)
    if missing:
        raise ValueError(f"faculty.csv missing columns: {sorted(missing)}")
    for _, row in faculty_df.iterrows():
        faculty.append(
            Faculty(
                faculty_id=str(row["faculty_id"]).strip(),
                faculty_name=str(row["faculty_name"]).strip(),
            )
        )

    courses: List[Course] = []
    required_cols = {
        "course_id",
        "course_name",
        "is_lab",
        "lecture_periods_per_week",
        "lab_sessions_per_week",
        "lab_block_size",
    }
    missing = required_cols - set(courses_df.columns)
    if missing:
        raise ValueError(f"courses.csv missing columns: {sorted(missing)}")
    for _, row in courses_df.iterrows():
        courses.append(
            Course(
                course_id=str(row["course_id"]).strip(),
                course_name=str(row["course_name"]).strip(),
                is_lab=bool(int(row["is_lab"])) if str(row["is_lab"]).strip() != "" else False,
                lecture_periods_per_week=int(row["lecture_periods_per_week"]),
                lab_sessions_per_week=int(row["lab_sessions_per_week"]),
                lab_block_size=int(row["lab_block_size"]) if str(row["lab_block_size"]).strip() != "" else 2,
            )
        )

    section_requirements: List[SectionCourseRequirement] = []
    required_cols = {"section_id", "course_id", "weekly_lectures", "weekly_lab_sessions", "lab_block_size"}
    missing = required_cols - set(sec_req_df.columns)
    if missing:
        raise ValueError(f"section_course_requirements.csv missing columns: {sorted(missing)}")
    for _, row in sec_req_df.iterrows():
        lab_block_size_val = row["lab_block_size"]
        lab_bs: Optional[int] = None
        if pd.notna(lab_block_size_val) and str(lab_block_size_val).strip() != "":
            try:
                parsed = int(lab_block_size_val)
            except Exception:
                parsed = None
            # Treat non-positive values as unspecified (inherit defaults)
            if parsed is not None and parsed > 0:
                lab_bs = parsed
        section_requirements.append(
            SectionCourseRequirement(
                section_id=str(row["section_id"]).strip(),
                course_id=str(row["course_id"]).strip(),
                weekly_lectures=int(row["weekly_lectures"]),
                weekly_lab_sessions=int(row["weekly_lab_sessions"]),
                lab_block_size=lab_bs,
            )
        )

    faculty_courses: List[FacultyCourseAssignment] = []
    required_cols = {"faculty_id", "course_id", "section_id"}
    missing = required_cols - set(fac_course_df.columns)
    if missing:
        raise ValueError(f"faculty_courses.csv missing columns: {sorted(missing)}")
    for _, row in fac_course_df.iterrows():
        faculty_courses.append(
            FacultyCourseAssignment(
                faculty_id=str(row["faculty_id"]).strip(),
                course_id=str(row["course_id"]).strip(),
                section_id=str(row["section_id"]).strip(),
            )
        )

    rooms: Optional[List[Room]] = None
    if rooms_df is not None:
        required_cols = {"room_id", "room_name", "capacity", "is_lab"}
        missing = required_cols - set(rooms_df.columns)
        if missing:
            raise ValueError(f"rooms.csv missing columns: {sorted(missing)}")
        rooms = []
        for _, row in rooms_df.iterrows():
            rooms.append(
                Room(
                    room_id=str(row["room_id"]).strip(),
                    room_name=str(row["room_name"]).strip(),
                    capacity=int(row["capacity"]),
                    is_lab=bool(int(row["is_lab"])) if str(row["is_lab"]).strip() != "" else False,
                )
            )

    return ProblemData(
        day_periods=day_periods,
        sections=sections,
        faculty=faculty,
        courses=courses,
        section_requirements=section_requirements,
        faculty_courses=faculty_courses,
        rooms=rooms,
    )


