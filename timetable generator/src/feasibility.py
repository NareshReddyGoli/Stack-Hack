from __future__ import annotations

from collections import defaultdict
from typing import Dict, List, Tuple

try:
    from .models import ProblemData, Timeslot
except ImportError:
    from models import ProblemData, Timeslot


class FeasibilityReport:
    def __init__(self) -> None:
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def ok(self) -> bool:
        return len(self.errors) == 0

    def add_error(self, msg: str) -> None:
        self.errors.append(msg)

    def add_warning(self, msg: str) -> None:
        self.warnings.append(msg)


def compute_valid_lab_starts(timeslots: List[Timeslot], block_size: int) -> Dict[int, List[int]]:
    # Returns: day_index -> list of starting timeslot_ids that can fit block_size within day and non-break periods
    starts_by_day: Dict[int, List[int]] = defaultdict(list)
    # Group timeslots by day
    by_day: Dict[int, List[Timeslot]] = defaultdict(list)
    for t in timeslots:
        by_day[t.day_index].append(t)

    for day_idx, day_slots in by_day.items():
        # ensure sorted by period within day
        day_slots = sorted(day_slots, key=lambda x: x.period_index)
        n = len(day_slots)
        for i in range(0, n - block_size + 1):
            window = day_slots[i : i + block_size]
            if any(s.is_break for s in window):
                continue
            # consecutive within the same day by construction
            starts_by_day[day_idx].append(window[0].timeslot_id)
    return starts_by_day


def pre_solve_feasibility_check(problem: ProblemData) -> FeasibilityReport:
    report = FeasibilityReport()
    timeslots = problem.build_timeslots()
    non_break_slots_by_day: Dict[int, int] = defaultdict(int)
    non_break_slots_total = 0
    for t in timeslots:
        if not t.is_break:
            non_break_slots_by_day[t.day_index] += 1
            non_break_slots_total += 1
    num_days = len({t.day_index for t in timeslots})

    # Aggregate required periods per section
    req_map = problem.section_course_requirements_map()
    course_defaults = problem.course_by_id()
    per_section_required_periods: Dict[str, int] = defaultdict(int)
    per_section_lab_sessions_total: Dict[str, int] = defaultdict(int)
    per_section_lab_blocks: Dict[Tuple[str, int], int] = defaultdict(int)  # (section_id, block_size) -> count

    for section in problem.sections:
        for course in problem.courses:
            r = req_map.get((section.section_id, course.course_id))
            if r is None:
                # If not specified, use course defaults (could be zeros)
                weekly_lectures = course.lecture_periods_per_week
                weekly_lab_sessions = course.lab_sessions_per_week if course.is_lab else 0
                block_size = course.lab_block_size if course.is_lab else 0
            else:
                weekly_lectures = r.weekly_lectures
                weekly_lab_sessions = r.weekly_lab_sessions
                block_size = r.lab_block_size if r.lab_block_size is not None else (
                    course.lab_block_size if course.is_lab else 0
                )

            per_section_required_periods[section.section_id] += weekly_lectures
            if weekly_lab_sessions and block_size:
                per_section_required_periods[section.section_id] += weekly_lab_sessions * block_size
                per_section_lab_blocks[(section.section_id, block_size)] += weekly_lab_sessions
            if weekly_lab_sessions:
                per_section_lab_sessions_total[section.section_id] += weekly_lab_sessions

    # Check availability vs demand per section
    for section in problem.sections:
        if per_section_required_periods[section.section_id] > non_break_slots_total:
            report.add_error(
                f"Section {section.section_id} requires {per_section_required_periods[section.section_id]} periods but only "
                f"{non_break_slots_total} non-break timeslots exist in the week."
            )

    # Check lab start feasibility per day by block size
    # Coarse check: ensure total possible starts across week >= required sessions
    # This is conservative but catches obvious infeasibility
    max_block_size = 0
    for (_, block_size), sessions in per_section_lab_blocks.items():
        if block_size > max_block_size:
            max_block_size = block_size
    if max_block_size:
        starts_cache: Dict[int, List[int]] = {}
        for bsize in sorted({bs for (_, bs) in per_section_lab_blocks.keys()}):
            # count valid starts across all days
            by_day_starts = compute_valid_lab_starts(timeslots, bsize)
            starts_cache[bsize] = [t for day in by_day_starts.values() for t in day]

        for (section_id, block_size), sessions in per_section_lab_blocks.items():
            possible_starts = len(starts_cache.get(block_size, []))
            if possible_starts < sessions:
                report.add_error(
                    f"Section {section_id} needs {sessions} lab blocks of size {block_size}, "
                    f"but only {possible_starts} valid starting positions exist in the week."
                )

    # Assignment coverage check: each (section,course) with nonzero requirement must have a faculty assignment
    fac_map = problem.faculty_assignment_map()
    for section in problem.sections:
        for course in problem.courses:
            r = req_map.get((section.section_id, course.course_id))
            if r is None:
                weekly_lectures = course.lecture_periods_per_week
                weekly_lab_sessions = course.lab_sessions_per_week if course.is_lab else 0
                block_size_eff = course.lab_block_size if course.is_lab else 0
            else:
                weekly_lectures = r.weekly_lectures
                weekly_lab_sessions = r.weekly_lab_sessions
                block_size_eff = r.lab_block_size if r.lab_block_size is not None else (course.lab_block_size if course.is_lab else 0)
            if (weekly_lectures or weekly_lab_sessions) and (section.section_id, course.course_id) not in fac_map:
                report.add_error(
                    f"Missing faculty assignment for Section {section.section_id}, Course {course.course_id}."
                )
            # Enforce: labs must be exactly two consecutive periods
            if weekly_lab_sessions and course.is_lab:
                if block_size_eff != 2:
                    report.add_error(
                        f"Lab block size must be 2 periods for Section {section.section_id}, Course {course.course_id} (found {block_size_eff})."
                    )

    # Daily lab session cap feasibility: total weekly labs per section cannot exceed 2 * number of days
    if num_days > 0:
        for section in problem.sections:
            total_labs = per_section_lab_sessions_total.get(section.section_id, 0)
            if total_labs > 2 * num_days:
                report.add_error(
                    f"Section {section.section_id} requires {total_labs} lab sessions per week, which exceeds the daily cap of 2 across {num_days} days."
                )

    # Room feasibility checks (if rooms provided): ensure at least one suitable room exists per section needs
    if problem.rooms:
        nonlab_rooms = [rm for rm in problem.rooms if not rm.is_lab]
        lab_rooms = [rm for rm in problem.rooms if rm.is_lab]
        # Quick lookup per section for capacity-feasible rooms
        for section in problem.sections:
            # If any lectures required for this section across courses, ensure some non-lab room can host
            needs_lecture = False
            needs_lab = False
            for course in problem.courses:
                r = req_map.get((section.section_id, course.course_id))
                if r is None:
                    weekly_lectures = course.lecture_periods_per_week
                    weekly_lab_sessions = course.lab_sessions_per_week if course.is_lab else 0
                else:
                    weekly_lectures = r.weekly_lectures
                    weekly_lab_sessions = r.weekly_lab_sessions
                needs_lecture = needs_lecture or (weekly_lectures > 0)
                needs_lab = needs_lab or (weekly_lab_sessions > 0)
            if needs_lecture:
                possible = any(rm.capacity >= section.num_students for rm in nonlab_rooms)
                if not possible:
                    report.add_error(
                        f"Section {section.section_id} requires lecture periods but no non-lab room has capacity >= {section.num_students}."
                    )
            if needs_lab:
                possible = any(rm.capacity >= section.num_students for rm in lab_rooms)
                if not possible:
                    report.add_error(
                        f"Section {section.section_id} requires lab sessions but no lab room has capacity >= {section.num_students}."
                    )

    return report


