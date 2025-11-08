from __future__ import annotations

import base64
import os
import tempfile
from typing import Dict, List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

try:
    from .exporter import build_grids_by_faculty, build_grids_by_section
    from .feasibility import pre_solve_feasibility_check
    from .loader import load_problem_from_directory
    from .timetable_solver import solve
except ImportError:  # pragma: no cover - running as script
    from exporter import build_grids_by_faculty, build_grids_by_section
    from feasibility import pre_solve_feasibility_check
    from loader import load_problem_from_directory
    from timetable_solver import solve


class FilePayload(BaseModel):
    name: str
    content: str  # base64 encoded csv bytes


class SolveRequest(BaseModel):
    files: List[FilePayload]
    timeLimit: int = 90
    optimizeGaps: bool = False


app = FastAPI(title="ATGS v2 Scheduler API", version="2.0.0")


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/solve")
def solve_api(payload: SolveRequest):
    if not payload.files:
        raise HTTPException(status_code=400, detail="No files provided")

    with tempfile.TemporaryDirectory() as tmpdir:
        # write provided csvs
        for f in payload.files:
            raw = base64.b64decode(f.content.encode("utf-8"))
            out_path = os.path.join(tmpdir, f.name)
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, "wb") as out:
                out.write(raw)

        try:
            problem = load_problem_from_directory(tmpdir)
        except Exception as e:  # pragma: no cover
            raise HTTPException(status_code=400, detail=f"INPUT_ERROR: {e}")

        try:
            report = pre_solve_feasibility_check(problem)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"FEASIBILITY_PRECHECK_ERROR: {e}")

        if not report.ok():
            return {"status": "FEASIBILITY_ERROR", "errors": report.errors, "warnings": report.warnings}

        try:
            result = solve(problem, time_limit_sec=payload.timeLimit, optimize_gaps=payload.optimizeGaps)
        except Exception as e:  # pragma: no cover
            raise HTTPException(status_code=500, detail=f"SOLVER_ERROR: {e}")

        # build per-section / per-faculty grids
        section_grids = build_grids_by_section(result)
        faculty_grids = build_grids_by_faculty(result)

        # collect structures for backend
        timeslot_by_id = {t.timeslot_id: t for t in result.timeslots}

        sections: Dict[str, List[Dict]] = {}
        for section_id, slots in result.schedule_by_section.items():
            rows: List[Dict] = []
            for tid, (course_id, faculty_id, room_id, kind) in slots.items():
                ts = timeslot_by_id.get(tid)
                if not ts:
                    continue
                rows.append({
                    "timeslotId": tid,
                    "dayIndex": ts.day_index,
                    "dayName": ts.day_name,
                    "periodIndex": ts.period_index,
                    "courseId": course_id,
                    "facultyId": faculty_id,
                    "roomId": room_id,
                    "kind": kind,
                })
            sections[section_id] = rows

        faculty: Dict[str, List[Dict]] = {}
        for fac_id, slots in result.schedule_by_faculty.items():
            rows: List[Dict] = []
            for tid, (course_id, section_id, room_id, kind) in slots.items():
                ts = timeslot_by_id.get(tid)
                if not ts:
                    continue
                rows.append({
                    "timeslotId": tid,
                    "dayIndex": ts.day_index,
                    "dayName": ts.day_name,
                    "periodIndex": ts.period_index,
                    "courseId": course_id,
                    "sectionId": section_id,
                    "roomId": room_id,
                    "kind": kind,
                })
            faculty[fac_id] = rows

        # available rooms per time slot
        all_rooms = [r.room_id for r in (problem.rooms or [])]
        available_rooms: List[Dict] = []
        if all_rooms:
            # compute occupied by scanning section schedules per timeslot
            occupied_by_tid: Dict[int, List[str]] = {}
            for sec_map in result.schedule_by_section.values():
                for tid, (_c, _f, room_id, _k) in sec_map.items():
                    if room_id:
                        occupied_by_tid.setdefault(tid, []).append(room_id)

            for ts in result.timeslots:
                if ts.is_break:
                    continue
                occ = set(occupied_by_tid.get(ts.timeslot_id, []))
                free = [r for r in all_rooms if r not in occ]
                available_rooms.append({
                    "timeslotId": ts.timeslot_id,
                    "dayIndex": ts.day_index,
                    "dayName": ts.day_name,
                    "periodIndex": ts.period_index,
                    "rooms": free,
                })

        # available faculty per time slot (list of faculty ids free at the timeslot)
        available_faculty: List[Dict] = []
        avail_map = getattr(result, "available_faculty", None) or {}
        for ts in result.timeslots:
            if ts.is_break:
                continue
            facs = avail_map.get(ts.timeslot_id, [])
            available_faculty.append({
                "timeslotId": ts.timeslot_id,
                "dayIndex": ts.day_index,
                "dayName": ts.day_name,
                "periodIndex": ts.period_index,
                "faculty": facs,
            })

        return {
            "status": result.status,
            "warnings": report.warnings,
            "sections": sections,
            "faculty": faculty,
            "sectionGrids": {k: df.reset_index().to_dict(orient="records") for k, df in section_grids.items()},
            "facultyGrids": {k: df.reset_index().to_dict(orient="records") for k, df in faculty_grids.items()},
            "availableRooms": available_rooms,
            "availableFaculty": available_faculty,
        }


