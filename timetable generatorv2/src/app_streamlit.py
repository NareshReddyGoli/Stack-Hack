from __future__ import annotations
import io
import os
import shutil
import tempfile
from typing import Dict

import pandas as pd
import streamlit as st

try:
    from .exporter import build_availability_grid, build_grids_by_faculty, build_grids_by_section, export_all
    from .feasibility import pre_solve_feasibility_check
    from .loader import load_problem_from_directory
    from .timetable_solver import solve
except ImportError:
    # Allow running via `streamlit run src/app_streamlit.py` (script mode)
    from exporter import build_availability_grid, build_grids_by_faculty, build_grids_by_section, export_all
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
    if result.objective_value is not None:
        st.info(f"Optimization objective value: {result.objective_value}")

    # Build grids for preview
    sections_grids = build_grids_by_section(result)
    faculty_grids = build_grids_by_faculty(result)
    
    # Build availability grids
    avail_rooms_grid = None
    avail_faculty_grid = None
    if result.available_rooms:
        avail_rooms_grid = build_availability_grid(result, resource_type="rooms")
    if result.available_faculty:
        avail_faculty_grid = build_availability_grid(result, resource_type="faculty")

    tabs = st.tabs(["Sections", "Faculty", "Available Rooms", "Available Lecturers", "Export Files"])

    with tabs[0]:
        st.subheader("Sections")
        for sid, df in sections_grids.items():
            st.markdown(f"**Section {sid}**")
            st.dataframe(df, use_container_width=True)

    with tabs[1]:
        st.subheader("Faculty Schedules")
        for fid, df in faculty_grids.items():
            st.markdown(f"**Faculty {fid}**")
            st.dataframe(df, use_container_width=True)
    
    with tabs[2]:
        st.subheader("Available Rooms Per Timeslot")
        if avail_rooms_grid is not None:
            st.caption("Shows which rooms are free (not assigned) at each time period.")
            st.dataframe(avail_rooms_grid, use_container_width=True)
        else:
            st.info("No room availability data available.")
    
    with tabs[3]:
        st.subheader("Available Lecturers Per Timeslot")
        if avail_faculty_grid is not None:
            st.caption("Shows which faculty members are free (not teaching) at each time period.")
            st.dataframe(avail_faculty_grid, use_container_width=True)
        else:
            st.info("No faculty availability data available.")

    with tabs[4]:
        st.subheader("Export")
        export_root = st.text_input("Output directory", value=os.path.join(inputs_dir, "..", "outputs").replace("\\", "/"))
        if st.button("Write CSV exports", type="primary"):
            os.makedirs(export_root, exist_ok=True)
            export_all(result, export_root)
            st.success(f"Outputs written to: {export_root}")


with st.sidebar:
    st.header("Inputs")
    inputs_dir = st.text_input("Inputs directory", value="data/templates")
    time_limit = st.number_input("Solver time limit (sec)", min_value=1, max_value=600, value=90, step=5)
    optimize_gaps = st.checkbox("Optimize gaps (slower)", value=False)
    run_btn = st.button("Run Solver", type="primary")

    with st.expander("Upload CSVs", expanded=False):
        st.caption("Upload required CSVs and save them into the Inputs directory above.")
        up_day = st.file_uploader("day_worksheet.csv", type=["csv"], key="up_day")
        up_sections = st.file_uploader("sections.csv", type=["csv"], key="up_sections")
        up_faculty = st.file_uploader("faculty.csv", type=["csv"], key="up_faculty")
        up_courses = st.file_uploader("courses.csv", type=["csv"], key="up_courses")
        up_sec_req = st.file_uploader("section_course_requirements.csv (constraints)", type=["csv"], key="up_sec_req")
        up_fac_course = st.file_uploader("faculty_courses.csv", type=["csv"], key="up_fac_course")
        up_rooms = st.file_uploader("rooms.csv (optional)", type=["csv"], key="up_rooms")

        if st.button("Save uploads to Inputs directory"):
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
                os.makedirs(inputs_dir, exist_ok=True)
                for (fname, fobj) in [
                    ("day_worksheet.csv", up_day),
                    ("sections.csv", up_sections),
                    ("faculty.csv", up_faculty),
                    ("courses.csv", up_courses),
                    ("section_course_requirements.csv", up_sec_req),
                    ("faculty_courses.csv", up_fac_course),
                ]:
                    with open(os.path.join(inputs_dir, fname), "wb") as out:
                        out.write(fobj.getbuffer())
                if up_rooms is not None:
                    with open(os.path.join(inputs_dir, "rooms.csv"), "wb") as out:
                        out.write(up_rooms.getbuffer())
                st.success(f"Saved CSVs to: {inputs_dir}")

    st.divider()
    st.header("Generate Synthetic Data")
    total_students = st.number_input("Total students", min_value=60, max_value=20000, value=1000, step=20)
    section_size = st.number_input("Target section size", min_value=20, max_value=200, value=60, step=10)
    num_courses = st.number_input("Total courses per section", min_value=4, max_value=20, value=10, step=1)
    num_lab_courses = st.number_input("Lab courses per section", min_value=0, max_value=10, value=3, step=1)
    out_dir = st.text_input("Synthetic output dir", value="data/large_1000")
    gen_btn = st.button("Generate CSV dataset")

if gen_btn:
    from .generate_synthetic import generate_dataset

    with st.spinner("Generating synthetic dataset..."):
        generate_dataset(
            out_dir=out_dir,
            total_students=int(total_students),
            section_size=int(section_size),
            num_courses=int(num_courses),
            num_lab_courses=int(num_lab_courses),
        )
    st.success(f"Synthetic dataset written to {out_dir}")

if run_btn:
    run_solver_ui(inputs_dir=inputs_dir, time_limit=int(time_limit), optimize_gaps=optimize_gaps)


