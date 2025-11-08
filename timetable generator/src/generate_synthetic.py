from __future__ import annotations

import argparse
import math
import os
from typing import List, Tuple

import pandas as pd


def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def _build_day_worksheet(days: List[str], periods_per_day: int = 8, break_period: int = 5) -> pd.DataFrame:
    rows = []
    for d in days:
        for p in range(1, periods_per_day + 1):
            rows.append({
                "day_name": d,
                "period_index": p,
                "is_break": 1 if p == break_period else 0,
            })
    return pd.DataFrame(rows)


def _build_sections(num_sections: int, section_size: int) -> pd.DataFrame:
    rows = []
    for i in range(num_sections):
        sid = f"S{i+1}"
        rows.append({
            "section_id": sid,
            "section_name": f"Section {i+1}",
            "num_students": section_size,
        })
    return pd.DataFrame(rows)


def _build_courses(num_courses: int, num_lab_courses: int) -> pd.DataFrame:
    rows = []
    # Non-lab courses: evenly distribute lectures 2-4 per week
    for i in range(num_courses - num_lab_courses):
        cid = f"C{i+1:03d}"
        rows.append({
            "course_id": cid,
            "course_name": f"Course {i+1}",
            "is_lab": 0,
            "lecture_periods_per_week": 3 if (i % 3 == 0) else (2 if (i % 3 == 1) else 4),
            "lab_sessions_per_week": 0,
            "lab_block_size": 0,
        })
    # Lab courses: 0 lectures by default, labs 1 per week, block size 2 or 3
    for j in range(num_lab_courses):
        idx = num_courses - num_lab_courses + j
        cid = f"C{idx+1:03d}"
        rows.append({
            "course_id": cid,
            "course_name": f"Lab {j+1}",
            "is_lab": 1,
            "lecture_periods_per_week": 0,
            "lab_sessions_per_week": 1,
            "lab_block_size": 3 if (j % 2 == 1) else 2,
        })
    return pd.DataFrame(rows)


def _build_section_requirements(sections: pd.DataFrame, courses: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for _, s in sections.iterrows():
        for _, c in courses.iterrows():
            rows.append({
                "section_id": s["section_id"],
                "course_id": c["course_id"],
                "weekly_lectures": int(c["lecture_periods_per_week"]),
                "weekly_lab_sessions": int(c["lab_sessions_per_week"]),
                "lab_block_size": int(c["lab_block_size"]) if int(c["lab_block_size"]) > 0 else "",
            })
    return pd.DataFrame(rows)


def _build_faculty(num_faculty: int) -> pd.DataFrame:
    rows = []
    for i in range(num_faculty):
        rows.append({
            "faculty_id": f"F{i+1}",
            "faculty_name": f"Faculty {i+1}",
        })
    return pd.DataFrame(rows)


def _build_faculty_courses(sections: pd.DataFrame, courses: pd.DataFrame, num_faculty: int) -> pd.DataFrame:
    rows = []
    # Simple round-robin assignment of faculty per (section, course)
    f_idx = 0
    for _, s in sections.iterrows():
        for _, c in courses.iterrows():
            fid = f"F{(f_idx % num_faculty) + 1}"
            rows.append({
                "faculty_id": fid,
                "course_id": c["course_id"],
                "section_id": s["section_id"],
            })
            f_idx += 1
    return pd.DataFrame(rows)


def _build_rooms(num_sections: int, section_size: int, lab_ratio: float = 0.4) -> pd.DataFrame:
    # Heuristic: provide enough rooms to cover concurrent max load.
    # Create non-lab rooms sized to section_size, and lab rooms of smaller capacity.
    num_lecture_rooms = max(6, math.ceil(num_sections * 0.8))
    num_lab_rooms = max(3, math.ceil(num_sections * lab_ratio * 0.6))
    rows = []
    for i in range(num_lecture_rooms):
        rows.append({
            "room_id": f"R{i+1:03d}",
            "room_name": f"Room {i+1:03d}",
            "capacity": int(section_size),
            "is_lab": 0,
        })
    for j in range(num_lab_rooms):
        rows.append({
            "room_id": f"L{j+1:03d}",
            "room_name": f"Lab {j+1:03d}",
            "capacity": int(section_size),
            "is_lab": 1,
        })
    return pd.DataFrame(rows)


def generate_dataset(out_dir: str, total_students: int, section_size: int, num_courses: int, num_lab_courses: int) -> None:
    _ensure_dir(out_dir)
    num_sections = max(1, math.ceil(total_students / section_size))
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

    df_day = _build_day_worksheet(days=days)
    df_sec = _build_sections(num_sections=num_sections, section_size=section_size)
    df_courses = _build_courses(num_courses=num_courses, num_lab_courses=num_lab_courses)
    # Faculty scale: ensure enough to avoid overload; 2x courses per section as a baseline
    num_faculty = max(10, min(400, num_sections * num_courses // 2))
    df_fac = _build_faculty(num_faculty=num_faculty)
    df_sec_req = _build_section_requirements(df_sec, df_courses)
    df_fac_courses = _build_faculty_courses(df_sec, df_courses, num_faculty=num_faculty)
    df_rooms = _build_rooms(num_sections=num_sections, section_size=section_size)

    df_day.to_csv(os.path.join(out_dir, "day_worksheet.csv"), index=False)
    df_sec.to_csv(os.path.join(out_dir, "sections.csv"), index=False)
    df_fac.to_csv(os.path.join(out_dir, "faculty.csv"), index=False)
    df_courses.to_csv(os.path.join(out_dir, "courses.csv"), index=False)
    df_sec_req.to_csv(os.path.join(out_dir, "section_course_requirements.csv"), index=False)
    df_fac_courses.to_csv(os.path.join(out_dir, "faculty_courses.csv"), index=False)
    df_rooms.to_csv(os.path.join(out_dir, "rooms.csv"), index=False)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate synthetic CSVs for timetable inputs")
    parser.add_argument("--out", required=True, help="Output directory to write CSV files")
    parser.add_argument("--total_students", type=int, default=1000)
    parser.add_argument("--section_size", type=int, default=60)
    parser.add_argument("--num_courses", type=int, default=10)
    parser.add_argument("--num_lab_courses", type=int, default=3)
    args = parser.parse_args()

    generate_dataset(
        out_dir=args.out,
        total_students=args.total_students,
        section_size=args.section_size,
        num_courses=args.num_courses,
        num_lab_courses=args.num_lab_courses,
    )
    print(f"Synthetic dataset created at: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


