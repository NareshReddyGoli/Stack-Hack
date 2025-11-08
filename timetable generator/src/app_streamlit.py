from __future__ import annotations
import io
import os
import shutil
import tempfile
from typing import Dict

import pandas as pd
import streamlit as st

try:
    from .exporter import build_grids_by_faculty, build_grids_by_section, export_all
    from .feasibility import pre_solve_feasibility_check
    from .loader import load_problem_from_directory
    from .timetable_solver import solve
except ImportError:
    # Allow running via `streamlit run src/app_streamlit.py` (script mode)
    from exporter import build_grids_by_faculty, build_grids_by_section, export_all
    from feasibility import pre_solve_feasibility_check
    from loader import load_problem_from_directory
    from timetable_solver import solve


st.set_page_config(page_title="Automatic Timetable Generator", layout="wide")

st.title("Automatic Timetable Generator")
st.caption("Load CSV inputs, validate constraints, solve, and preview/export timetables.")


def run_solver_ui(inputs_dir: str, time_limit: int, optimize_gaps: bool) -> None:
    with st.spinner("Loading inputs and checking feasibility..."):
        problem = load_problem_from_directory(inputs_dir)
        report = pre_solve_feasibility_check(problem)
    if not report.ok():
        st.error("Feasibility errors detected. Please fix the issues below:")
        for e in report.errors:
            st.write(f"- {e}")
        if report.warnings:
            with st.expander("Warnings"):
                for w in report.warnings:
                    st.write(f"- {w}")
        return
    else:
        if report.warnings:
            st.warning("Feasibility warnings present. Review details below.")
            with st.expander("Warnings"):
                for w in report.warnings:
                    st.write(f"- {w}")

    with st.spinner("Solving..."):
        result = solve(problem, time_limit_sec=time_limit, optimize_gaps=optimize_gaps)

    if result.status == "INFEASIBLE":
        st.error("Solver could not find a feasible timetable within the time limit.")
        return

    st.success(f"Solver status: {result.status}")

    # Build grids for preview
    sections_grids = build_grids_by_section(result)
    faculty_grids = build_grids_by_faculty(result)

    tabs = st.tabs(["Sections", "Faculty", "Export Files"])

    with tabs[0]:
        st.subheader("Sections")
        for sid, df in sections_grids.items():
            st.markdown(f"**Section {sid}**")
            st.dataframe(df, use_container_width=True)

    with tabs[1]:
        st.subheader("Faculty")
        for fid, df in faculty_grids.items():
            st.markdown(f"**Faculty {fid}**")
            st.dataframe(df, use_container_width=True)

    with tabs[2]:
        st.subheader("Export")
        export_root = st.text_input("Output directory", value="outputs")
        if st.button("Write CSV exports", type="primary"):
            os.makedirs(export_root, exist_ok=True)
            export_all(result, export_root)
            st.success(f"Outputs written to: {export_root}")


with st.sidebar:
    st.header("Inputs")
    time_limit = st.number_input("Solver time limit (sec)", min_value=1, max_value=600, value=90, step=5)
    optimize_gaps = st.checkbox("Optimize gaps (slower)", value=False)
    run_btn = st.button("Run Solver", type="primary")

    with st.expander("Upload CSVs", expanded=True):
        st.caption("Upload required CSVs. These will be used directly when you run the solver.")
        up_day = st.file_uploader("day_worksheet.csv", type=["csv"], key="up_day")
        up_sections = st.file_uploader("sections.csv", type=["csv"], key="up_sections")
        up_faculty = st.file_uploader("faculty.csv", type=["csv"], key="up_faculty")
        up_courses = st.file_uploader("courses.csv", type=["csv"], key="up_courses")
        up_sec_req = st.file_uploader("section_course_requirements.csv (constraints)", type=["csv"], key="up_sec_req")
        up_fac_course = st.file_uploader("faculty_courses.csv", type=["csv"], key="up_fac_course")
        up_rooms = st.file_uploader("rooms.csv (optional)", type=["csv"], key="up_rooms")

if run_btn:
    missing = [
        name
        for name, f in {
            "day_worksheet.csv": up_day,
            "sections.csv": up_sections,
            "faculty.csv": up_faculty,
            "courses.csv": up_courses,
            "section_course_requirements.csv": up_sec_req,
            "faculty_courses.csv": up_fac_course,
        }.items()
        if f is None
    ]
    if missing:
        st.error("Missing required files: " + ", ".join(missing))
    else:
        with tempfile.TemporaryDirectory() as tmp_inputs:
            for (fname, fobj) in [
                ("day_worksheet.csv", up_day),
                ("sections.csv", up_sections),
                ("faculty.csv", up_faculty),
                ("courses.csv", up_courses),
                ("section_course_requirements.csv", up_sec_req),
                ("faculty_courses.csv", up_fac_course),
            ]:
                with open(os.path.join(tmp_inputs, fname), "wb") as out:
                    out.write(fobj.getbuffer())
            if up_rooms is not None:
                with open(os.path.join(tmp_inputs, "rooms.csv"), "wb") as out:
                    out.write(up_rooms.getbuffer())
            run_solver_ui(inputs_dir=tmp_inputs, time_limit=int(time_limit), optimize_gaps=optimize_gaps)


