from __future__ import annotations

import os
from collections import defaultdict
from typing import Dict, List, Tuple

import pandas as pd

try:
    from .models import ProblemData, Timeslot
    from .timetable_solver import SolveResult
except ImportError:
    from models import ProblemData, Timeslot
    from timetable_solver import SolveResult


def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def build_grids_by_section(result: SolveResult) -> Dict[str, pd.DataFrame]:
    # Build a grid day x period_index per section
    timeslots = result.timeslots
    days = sorted({(t.day_index, t.day_name) for t in timeslots}, key=lambda x: x[0])
    periods_by_day: Dict[int, List[int]] = defaultdict(list)
    for t in timeslots:
        periods_by_day[t.day_index].append(t.period_index)
    for k in periods_by_day:
        periods_by_day[k] = sorted(sorted(set(periods_by_day[k])))

    grids: Dict[str, pd.DataFrame] = {}
    for section_id, by_t in result.schedule_by_section.items():
        # Build a table with rows=day, columns=periods present in that day
        # We'll fill cells with "COURSE (FACULTY) [kind]" or blank for break/no class
        rows = []
        index = []
        for day_idx, day_name in days:
            cols: List[str] = []
            for p in periods_by_day[day_idx]:
                # find timeslot_id
                tid = next(t.timeslot_id for t in timeslots if t.day_index == day_idx and t.period_index == p)
                entry = by_t.get(tid)
                label = ""
                if entry is not None:
                    course_id, faculty_id, room_id, kind = entry
                    parts: List[str] = [course_id]
                    if faculty_id:
                        parts.append(f"({faculty_id})")
                    parts.append(f"[{kind}]")
                    if room_id:
                        parts.append(f"@{room_id}")
                    label = " ".join(parts)
                else:
                    # break or free
                    if next(t for t in timeslots if t.timeslot_id == tid).is_break:
                        label = "BREAK"
                    else:
                        label = ""
                cols.append(label)
            rows.append(cols)
            index.append(day_name)
        # Create DataFrame; columns are like P1, P2, ... but per-day may differ
        max_cols = max((len(r) for r in rows), default=0)
        col_names = [f"P{i+1}" for i in range(max_cols)]
        df = pd.DataFrame(rows, index=index, columns=col_names)
        grids[section_id] = df
    return grids


def build_grids_by_faculty(result: SolveResult) -> Dict[str, pd.DataFrame]:
    # Similar to section grids
    timeslots = result.timeslots
    days = sorted({(t.day_index, t.day_name) for t in timeslots}, key=lambda x: x[0])
    periods_by_day: Dict[int, List[int]] = defaultdict(list)
    for t in timeslots:
        periods_by_day[t.day_index].append(t.period_index)
    for k in periods_by_day:
        periods_by_day[k] = sorted(sorted(set(periods_by_day[k])))

    grids: Dict[str, pd.DataFrame] = {}
    for faculty_id, by_t in result.schedule_by_faculty.items():
        rows = []
        index = []
        for day_idx, day_name in days:
            cols: List[str] = []
            for p in periods_by_day[day_idx]:
                tid = next(t.timeslot_id for t in timeslots if t.day_index == day_idx and t.period_index == p)
                entry = by_t.get(tid)
                label = ""
                if entry is not None:
                    course_id, section_id, room_id, kind = entry
                    parts: List[str] = [course_id, f"(Sec {section_id})", f"[{kind}]"]
                    if room_id:
                        parts.append(f"@{room_id}")
                    label = " ".join(parts)
                else:
                    if next(t for t in timeslots if t.timeslot_id == tid).is_break:
                        label = "BREAK"
                    else:
                        label = ""
                cols.append(label)
            rows.append(cols)
            index.append(day_name)
        max_cols = max((len(r) for r in rows), default=0)
        col_names = [f"P{i+1}" for i in range(max_cols)]
        df = pd.DataFrame(rows, index=index, columns=col_names)
        grids[faculty_id] = df
    return grids


def build_availability_grid(result: SolveResult, resource_type: str = "rooms") -> pd.DataFrame:
    """Build a grid showing available rooms or faculty per timeslot.
    
    Args:
        result: SolveResult with availability data
        resource_type: 'rooms' or 'faculty'
    
    Returns:
        DataFrame with days as rows, periods as columns, cells show available resources
    """
    timeslots = result.timeslots
    days = sorted({(t.day_index, t.day_name) for t in timeslots}, key=lambda x: x[0])
    periods_by_day: Dict[int, List[int]] = defaultdict(list)
    for t in timeslots:
        periods_by_day[t.day_index].append(t.period_index)
    for k in periods_by_day:
        periods_by_day[k] = sorted(set(periods_by_day[k]))
    
    availability_map = result.available_rooms if resource_type == "rooms" else result.available_faculty
    if availability_map is None:
        availability_map = {}
    
    rows = []
    index = []
    for day_idx, day_name in days:
        row: List[str] = []
        for p in periods_by_day[day_idx]:
            tid = next(t.timeslot_id for t in timeslots if t.day_index == day_idx and t.period_index == p)
            if next(t for t in timeslots if t.timeslot_id == tid).is_break:
                row.append("BREAK")
            else:
                available = availability_map.get(tid, [])
                row.append(", ".join(available) if available else "(all occupied)")
        rows.append(row)
        index.append(day_name)
    
    max_cols = max((len(r) for r in rows), default=0)
    col_names = [f"P{i+1}" for i in range(max_cols)]
    df = pd.DataFrame(rows, index=index, columns=col_names)
    return df


def export_all(result: SolveResult, output_dir: str) -> None:
    _ensure_dir(output_dir)
    sections_dir = os.path.join(output_dir, "sections")
    faculty_dir = os.path.join(output_dir, "faculty")
    _ensure_dir(sections_dir)
    _ensure_dir(faculty_dir)

    section_grids = build_grids_by_section(result)
    faculty_grids = build_grids_by_faculty(result)

    # Write section CSVs
    for section_id, df in section_grids.items():
        df.to_csv(os.path.join(sections_dir, f"section_{section_id}.csv"), index_label="Day")

    # Write faculty CSVs
    for faculty_id, df in faculty_grids.items():
        df.to_csv(os.path.join(faculty_dir, f"faculty_{faculty_id}.csv"), index_label="Day")

    # Write a master timetable combining all sections' occupancy (course ids only)
    # Build grid of days x periods with a cell containing comma-separated "Sec:Course"
    timeslots = result.timeslots
    rows: List[List[str]] = []
    index: List[str] = []
    days = sorted({(t.day_index, t.day_name) for t in timeslots}, key=lambda x: x[0])
    periods = sorted(set(t.period_index for t in timeslots))
    # For each day, one row per period set
    for day_idx, day_name in days:
        row: List[str] = []
        for p in periods:
            # find tid or mark N/A if that period doesn't exist for that day
            matches = [t for t in timeslots if t.day_index == day_idx and t.period_index == p]
            if not matches:
                row.append("N/A")
                continue
            tid = matches[0].timeslot_id
            if matches[0].is_break:
                row.append("BREAK")
                continue
            entries: List[str] = []
            for sec_id, by_t in result.schedule_by_section.items():
                if tid in by_t:
                    course_id, _, _, _ = by_t[tid]
                    entries.append(f"{sec_id}:{course_id}")
            row.append(", ".join(entries))
        rows.append(row)
        index.append(day_name)
    master_df = pd.DataFrame(rows, index=index, columns=[f"P{i+1}" for i in range(len(periods))])
    master_df.to_csv(os.path.join(output_dir, "master_timetable.csv"), index_label="Day")
    
    # Export availability information
    if result.available_rooms:
        avail_rooms_df = build_availability_grid(result, resource_type="rooms")
        avail_rooms_df.to_csv(os.path.join(output_dir, "available_rooms.csv"), index_label="Day")
    
    if result.available_faculty:
        avail_faculty_df = build_availability_grid(result, resource_type="faculty")
        avail_faculty_df.to_csv(os.path.join(output_dir, "available_faculty.csv"), index_label="Day")


