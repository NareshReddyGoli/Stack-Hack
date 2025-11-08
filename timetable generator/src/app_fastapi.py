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
except ImportError:  # pragma: no cover - fallback when running as script
    from exporter import build_grids_by_faculty, build_grids_by_section
    from feasibility import pre_solve_feasibility_check
    from loader import load_problem_from_directory
    from timetable_solver import solve


class FilePayload(BaseModel):
    name: str
    content: str  # base64 encoded CSV bytes


class SolveRequest(BaseModel):
    files: List[FilePayload]
    timeLimit: int = 90
    optimizeGaps: bool = False


app = FastAPI(title="ATGS Scheduler API", version="1.0.0")


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/solve")
def solve_api(payload: SolveRequest):
    if not payload.files:
        raise HTTPException(status_code=400, detail="No files provided")

    with tempfile.TemporaryDirectory() as tmpdir:
        for f in payload.files:
            raw = base64.b64decode(f.content.encode('utf-8'))
            out_path = os.path.join(tmpdir, f.name)
            with open(out_path, 'wb') as out:
                out.write(raw)

        # Load and validate inputs safely
        try:
            problem = load_problem_from_directory(tmpdir)
        except Exception as e:
            # Column mismatch or missing inputs → 400 with details
            raise HTTPException(status_code=400, detail=f"INPUT_ERROR: {e}")

        try:
            report = pre_solve_feasibility_check(problem)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"FEASIBILITY_PRECHECK_ERROR: {e}")

        if not report.ok():
            return {
                "status": "FEASIBILITY_ERROR",
                "errors": report.errors,
                "warnings": report.warnings,
            }

        try:
            result = solve(problem, time_limit_sec=payload.timeLimit, optimize_gaps=payload.optimizeGaps)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"SOLVER_ERROR: {e}")

        sections = {}
        faculty = {}

        timeslot_lookup = {t.timeslot_id: t for t in result.timeslots}

        for section_id, slots in result.schedule_by_section.items():
            entries = []
            for tid, (course_id, faculty_id, room_id, kind) in slots.items():
                ts = timeslot_lookup.get(tid)
                if ts is None:
                    continue
                entries.append(
                    {
                        "timeslotId": tid,
                        "dayIndex": ts.day_index,
                        "dayName": ts.day_name,
                        "periodIndex": ts.period_index,
                        "courseId": course_id,
                        "facultyId": faculty_id,
                        "roomId": room_id,
                        "kind": kind,
                    }
                )
            sections[section_id] = entries

        for faculty_id, slots in result.schedule_by_faculty.items():
            entries = []
            for tid, (course_id, section_id, room_id, kind) in slots.items():
                ts = timeslot_lookup.get(tid)
                if ts is None:
                    continue
                entries.append(
                    {
                        "timeslotId": tid,
                        "dayIndex": ts.day_index,
                        "dayName": ts.day_name,
                        "periodIndex": ts.period_index,
                        "courseId": course_id,
                        "sectionId": section_id,
                        "roomId": room_id,
                        "kind": kind,
                    }
                )
            faculty[faculty_id] = entries

        sectionGrids = {
            section_id: df.reset_index().to_dict(orient='records')
            for section_id, df in build_grids_by_section(result).items()
        }
        facultyGrids = {
            faculty_id: df.reset_index().to_dict(orient='records')
            for faculty_id, df in build_grids_by_faculty(result).items()
        }

        return {
            "status": result.status,
            "warnings": report.warnings,
            "sections": sections,
            "faculty": faculty,
            "sectionGrids": sectionGrids,
            "facultyGrids": facultyGrids,
        }


app.description = "API for running the ATGS timetable solver."


