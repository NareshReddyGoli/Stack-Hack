from __future__ import annotations

import os
import pathlib
import time
from typing import Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .exporter import build_grids_by_faculty, build_grids_by_section, export_all
from .feasibility import pre_solve_feasibility_check
from .loader import load_problem_from_directory
from .timetable_solver import solve


ROOT = pathlib.Path(__file__).resolve().parent.parent
INPUT_BASE = ROOT / "data"
OUTPUT_BASE = ROOT / "out"


class GenerateRequest(BaseModel):
    dataset: str
    time_limit: int = 90
    optimize_gaps: bool = False
    output_name: str | None = None


app = FastAPI(title="ATGS Scheduler API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/datasets")
def list_datasets():
    if not INPUT_BASE.exists():
        return {"datasets": []}
    entries = [p.name for p in INPUT_BASE.iterdir() if p.is_dir()]
    return {"datasets": sorted(entries)}


@app.post("/generate")
def generate(req: GenerateRequest):
    dataset_dir = (INPUT_BASE / req.dataset).resolve()
    if not str(dataset_dir).startswith(str(INPUT_BASE.resolve())):
        raise HTTPException(status_code=400, detail="Invalid dataset path")
    if not dataset_dir.exists():
        raise HTTPException(status_code=404, detail="Dataset not found")

    problem = load_problem_from_directory(str(dataset_dir))
    report = pre_solve_feasibility_check(problem)
    if not report.ok():
        raise HTTPException(status_code=400, detail={"errors": report.errors, "warnings": report.warnings})

    result = solve(problem, time_limit_sec=req.time_limit, optimize_gaps=req.optimize_gaps)
    if result.status == "INFEASIBLE":
        raise HTTPException(status_code=400, detail="Solver could not find a feasible timetable")

    timestamp = time.strftime("%Y%m%d-%H%M%S")
    out_name = req.output_name or f"{req.dataset}_{timestamp}"
    output_dir = OUTPUT_BASE / out_name
    os.makedirs(output_dir, exist_ok=True)
    export_all(result, str(output_dir))

    sections_payload = _build_section_payload(result)
    faculty_payload = _build_faculty_payload(result)

    return {
        "status": result.status,
        "objective": result.objective_value,
        "warnings": report.warnings,
        "output_dir": str(output_dir.relative_to(ROOT)),
        "sections": sections_payload,
        "faculty": faculty_payload,
    }


def _build_section_payload(result):
    grids = build_grids_by_section(result)
    timeslot_map = {t.timeslot_id: t for t in result.timeslots}
    payload: Dict[str, Dict[str, List[Dict]]] = {}
    for section_id, schedule in result.schedule_by_section.items():
        assignments = []
        for tid, (course_id, faculty_id, room_id, kind) in schedule.items():
            ts = timeslot_map[tid]
            assignments.append(
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
        grid_df = grids.get(section_id)
        rows: List[Dict] = []
        columns: List[str] = []
        if grid_df is not None:
            reset_df = grid_df.reset_index().rename(columns={"index": "Day"})
            columns = list(reset_df.columns)
            rows = reset_df.to_dict(orient="records")
        payload[section_id] = {"assignments": assignments, "grid": {"columns": columns, "rows": rows}}
    return payload


def _build_faculty_payload(result):
    grids = build_grids_by_faculty(result)
    timeslot_map = {t.timeslot_id: t for t in result.timeslots}
    payload: Dict[str, Dict[str, List[Dict]]] = {}
    for faculty_id, schedule in result.schedule_by_faculty.items():
        assignments = []
        for tid, (course_id, section_id, room_id, kind) in schedule.items():
            ts = timeslot_map[tid]
            assignments.append(
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
        grid_df = grids.get(faculty_id)
        rows: List[Dict] = []
        columns: List[str] = []
        if grid_df is not None:
            reset_df = grid_df.reset_index().rename(columns={"index": "Day"})
            columns = list(reset_df.columns)
            rows = reset_df.to_dict(orient="records")
        payload[faculty_id] = {"assignments": assignments, "grid": {"columns": columns, "rows": rows}}
    return payload


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.api:app", host="0.0.0.0", port=8000, reload=True)


