from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from ortools.sat.python import cp_model

try:
    from .feasibility import compute_valid_lab_starts
    from .models import ProblemData, Timeslot
except ImportError:
    from feasibility import compute_valid_lab_starts
    from models import ProblemData, Timeslot


@dataclass
class SolveResult:
    status: str
    schedule_by_section: Dict[str, Dict[int, Tuple[str, str, str, str]]]  # section_id -> timeslot_id -> (course_id, faculty_id, room_id, kind)
    schedule_by_faculty: Dict[str, Dict[int, Tuple[str, str, str, str]]]  # faculty_id -> timeslot_id -> (course_id, section_id, room_id, kind)
    timeslots: List[Timeslot]
    objective_value: Optional[int] = None
    available_rooms: Dict[int, List[str]] = None  # timeslot_id -> list of available room_ids
    available_faculty: Dict[int, List[str]] = None  # timeslot_id -> list of available faculty_ids


def _identify_continuous_blocks(timeslots: List[Timeslot]) -> Dict[int, List[Tuple[int, List[int]]]]:
    """Identify continuous blocks of non-break periods separated by breaks, per day.
    Returns: day_index -> [(block_id, [timeslot_ids])]"""
    blocks_by_day: Dict[int, List[Tuple[int, List[int]]]] = defaultdict(list)
    by_day: Dict[int, List[Timeslot]] = defaultdict(list)
    for t in timeslots:
        by_day[t.day_index].append(t)
    
    block_counter = 0
    for day_idx, day_slots in by_day.items():
        day_slots = sorted(day_slots, key=lambda x: x.period_index)
        current_block = []
        for t in day_slots:
            if t.is_break:
                if current_block:
                    blocks_by_day[day_idx].append((block_counter, current_block))
                    block_counter += 1
                    current_block = []
            else:
                current_block.append(t.timeslot_id)
        if current_block:
            blocks_by_day[day_idx].append((block_counter, current_block))
            block_counter += 1
    return blocks_by_day


def solve(problem: ProblemData, time_limit_sec: int = 60, optimize_gaps: bool = False) -> SolveResult:
    model = cp_model.CpModel()

    timeslots = problem.build_timeslots()
    T = [t.timeslot_id for t in timeslots]
    T_non_break = [t.timeslot_id for t in timeslots if not t.is_break]
    timeslot_by_id = {t.timeslot_id: t for t in timeslots}
    
    # Identify continuous blocks for room stickiness
    blocks_by_day = _identify_continuous_blocks(timeslots)
    all_blocks = [(day, blk_id, tids) for day, blks in blocks_by_day.items() for blk_id, tids in blks]

    section_ids = problem.section_ids()
    faculty_ids = problem.faculty_ids()
    course_ids = problem.course_ids()
    course_by_id = problem.course_by_id()
    req_map = problem.section_course_requirements_map()
    fac_map = problem.faculty_assignment_map()

    # Variables
    X_lec: Dict[Tuple[str, str, int], cp_model.IntVar] = {}
    Y_lab_start: Dict[Tuple[str, str, int], cp_model.IntVar] = {}

    # Rooms
    rooms = problem.rooms or []
    have_rooms = len(rooms) > 0
    candidate_rooms_by_section: Dict[str, List[str]] = {}
    if have_rooms:
        room_by_id = {r.room_id: r for r in rooms}
        for s_obj in problem.sections:
            s = s_obj.section_id
            # All rooms with sufficient capacity (both lecture and lab rooms)
            candidate_rooms_by_section[s] = [r.room_id for r in rooms if r.capacity >= s_obj.num_students]
    R_lec: Dict[Tuple[str, str, int, str], cp_model.IntVar] = {}
    R_lab_start: Dict[Tuple[str, str, int, str], cp_model.IntVar] = {}
    
    # Block-level room assignment for stickiness (ONE room per section per block)
    # Section stays in same room for ALL classes (lectures and labs) within block
    SectionBlockRoom: Dict[Tuple[str, int, str], cp_model.IntVar] = {}  # (section_id, block_id, room_id)
    if have_rooms:
        for s in section_ids:
            for day_idx, blocks in blocks_by_day.items():
                for block_id, block_tids in blocks:
                    # Section can be assigned to ONE room per block (for both lectures and labs)
                    for room_id in candidate_rooms_by_section.get(s, []):
                        SectionBlockRoom[(s, block_id, room_id)] = model.NewBoolVar(f"secblkroom_s{s}_b{block_id}_r{room_id}")
                    # Exactly one room per section per block (if section has classes in that block)
                    if candidate_rooms_by_section.get(s):
                        model.Add(sum(SectionBlockRoom[(s, block_id, rid)] for rid in candidate_rooms_by_section[s]) <= 1)

    valid_starts_cache: Dict[int, List[int]] = {}

    # Create variables only where needed
    for s in section_ids:
        for c in course_ids:
            defaults = course_by_id[c]
            r = req_map.get((s, c))
            weekly_lectures = defaults.lecture_periods_per_week if r is None else r.weekly_lectures
            weekly_lab_sessions = (defaults.lab_sessions_per_week if defaults.is_lab else 0) if r is None else r.weekly_lab_sessions
            lab_block_size = (defaults.lab_block_size if defaults.is_lab else 0) if r is None else (r.lab_block_size or (defaults.lab_block_size if defaults.is_lab else 0))

            if weekly_lectures > 0:
                for t in T_non_break:
                    X_lec[(s, c, t)] = model.NewBoolVar(f"lec_s{s}_c{c}_t{t}")
                    if have_rooms and candidate_rooms_by_section.get(s):
                        for room_id in candidate_rooms_by_section[s]:
                            R_lec[(s, c, t, room_id)] = model.NewBoolVar(f"rlec_s{s}_c{c}_t{t}_r{room_id}")

            if weekly_lab_sessions > 0 and lab_block_size > 0:
                if lab_block_size not in valid_starts_cache:
                    starts_by_day = compute_valid_lab_starts(timeslots, lab_block_size)
                    valid_starts_cache[lab_block_size] = [ts for v in starts_by_day.values() for ts in v]
                for start_t in valid_starts_cache[lab_block_size]:
                    Y_lab_start[(s, c, start_t)] = model.NewBoolVar(f"labstart_s{s}_c{c}_t{start_t}_b{lab_block_size}")
                    if have_rooms and candidate_rooms_by_section.get(s):
                        for room_id in candidate_rooms_by_section[s]:
                            R_lab_start[(s, c, start_t, room_id)] = model.NewBoolVar(f"rlab_s{s}_c{c}_t{start_t}_b{lab_block_size}_r{room_id}")

    # Requirements constraints
    for s in section_ids:
        for c in course_ids:
            defaults = course_by_id[c]
            r = req_map.get((s, c))
            weekly_lectures = defaults.lecture_periods_per_week if r is None else r.weekly_lectures
            weekly_lab_sessions = (defaults.lab_sessions_per_week if defaults.is_lab else 0) if r is None else r.weekly_lab_sessions
            lab_block_size = (defaults.lab_block_size if defaults.is_lab else 0) if r is None else (r.lab_block_size or (defaults.lab_block_size if defaults.is_lab else 0))

            if weekly_lectures > 0:
                lec_vars = [X_lec[(s, c, t)] for t in T_non_break if (s, c, t) in X_lec]
                model.Add(sum(lec_vars) == weekly_lectures)

            if weekly_lab_sessions > 0 and lab_block_size > 0:
                lab_vars = [Y_lab_start[(s, c, t)] for t in T if (s, c, t) in Y_lab_start]
                model.Add(sum(lab_vars) == weekly_lab_sessions)

    # Precompute coverage mapping for labs
    day_period_to_tid: Dict[Tuple[int, int], int] = {(t.day_index, t.period_index): t.timeslot_id for t in timeslots}
    cover_by_block_size: Dict[int, Dict[int, List[int]]] = {}
    for block_size, start_list in valid_starts_cache.items():
        cover_map: Dict[int, List[int]] = defaultdict(list)
        for start_t in start_list:
            start_ts = timeslot_by_id[start_t]
            for k in range(block_size):
                tid = day_period_to_tid[(start_ts.day_index, start_ts.period_index + k)]
                cover_map[tid].append(start_t)
        cover_by_block_size[block_size] = cover_map

    # No overlaps per section per timeslot
    for s in section_ids:
        for t in T_non_break:
            lec_terms = [X_lec[(s, c, t)] for c in course_ids if (s, c, t) in X_lec]
            lab_terms: List[cp_model.IntVar] = []
            for c in course_ids:
                defaults = course_by_id[c]
                r = req_map.get((s, c))
                weekly_lab_sessions = (defaults.lab_sessions_per_week if defaults.is_lab else 0) if r is None else r.weekly_lab_sessions
                lab_block_size = (defaults.lab_block_size if defaults.is_lab else 0) if r is None else (r.lab_block_size or (defaults.lab_block_size if defaults.is_lab else 0))
                if weekly_lab_sessions > 0 and lab_block_size > 0 and t in cover_by_block_size.get(lab_block_size, {}):
                    for start_t in cover_by_block_size[lab_block_size][t]:
                        var = Y_lab_start.get((s, c, start_t))
                        if var is not None:
                            lab_terms.append(var)
            model.Add(sum(lec_terms + lab_terms) <= 1)

    # Faculty clashes
    for f in faculty_ids:
        for t in T_non_break:
            terms: List[cp_model.IntVar] = []
            for (s, c_key), fac in fac_map.items():
                if fac != f:
                    continue
                if (s, c_key, t) in X_lec:
                    terms.append(X_lec[(s, c_key, t)])
                defaults = course_by_id[c_key]
                r = req_map.get((s, c_key))
                weekly_lab_sessions = (defaults.lab_sessions_per_week if defaults.is_lab else 0) if r is None else r.weekly_lab_sessions
                lab_block_size = (defaults.lab_block_size if defaults.is_lab else 0) if r is None else (r.lab_block_size or (defaults.lab_block_size if defaults.is_lab else 0))
                if weekly_lab_sessions > 0 and lab_block_size > 0 and t in cover_by_block_size.get(lab_block_size, {}):
                    for start_t in cover_by_block_size[lab_block_size][t]:
                        var = Y_lab_start.get((s, c_key, start_t))
                        if var is not None:
                            terms.append(var)
            if terms:
                model.Add(sum(terms) <= 1)

    # Faculty P1 (first period) constraint: max 3 times per week per faculty
    # Identify all P1 timeslots (period_index == 1)
    P1_timeslots = [t.timeslot_id for t in timeslots if t.period_index == 1 and not t.is_break]
    for f in faculty_ids:
        p1_terms: List[cp_model.IntVar] = []
        for (s, c_key), fac in fac_map.items():
            if fac != f:
                continue
            # Check lectures in P1
            for t in P1_timeslots:
                if (s, c_key, t) in X_lec:
                    p1_terms.append(X_lec[(s, c_key, t)])
            # Check labs starting in P1
            defaults = course_by_id[c_key]
            r = req_map.get((s, c_key))
            weekly_lab_sessions = (defaults.lab_sessions_per_week if defaults.is_lab else 0) if r is None else r.weekly_lab_sessions
            lab_block_size = (defaults.lab_block_size if defaults.is_lab else 0) if r is None else (r.lab_block_size or (defaults.lab_block_size if defaults.is_lab else 0))
            if weekly_lab_sessions > 0 and lab_block_size > 0:
                for start_t in P1_timeslots:
                    if (s, c_key, start_t) in Y_lab_start:
                        p1_terms.append(Y_lab_start[(s, c_key, start_t)])
        if p1_terms:
            model.Add(sum(p1_terms) <= 3)

    # Room linking and occupancy with STICKINESS constraint
    if have_rooms:
        # Link lecture room assignments to block-level room
        timeslot_to_block: Dict[int, int] = {}
        for day_idx, blocks in blocks_by_day.items():
            for block_id, block_tids in blocks:
                for tid in block_tids:
                    timeslot_to_block[tid] = block_id
        
        for (s, c, t), x in X_lec.items():
            candidates = candidate_rooms_by_section.get(s, [])
            if candidates:
                room_vars = [R_lec[(s, c, t, r_id)] for r_id in candidates]
                model.Add(sum(room_vars) == x)
                # STICKINESS: If lecture is scheduled, room must match unified block room
                block_id = timeslot_to_block.get(t)
                if block_id is not None:
                    for r_id in candidates:
                        # If this lecture uses this room, the section-block must also use this room
                        model.Add(R_lec[(s, c, t, r_id)] <= SectionBlockRoom[(s, block_id, r_id)])
        for (s, c, start_t), y in Y_lab_start.items():
            candidates = candidate_rooms_by_section.get(s, [])
            if candidates:
                room_vars = [R_lab_start[(s, c, start_t, r_id)] for r_id in candidates]
                model.Add(sum(room_vars) == y)
                # STICKINESS: If lab is scheduled, room must match unified block room (same as lectures)
                block_id = timeslot_to_block.get(start_t)
                if block_id is not None:
                    for r_id in candidates:
                        # If this lab uses this room, the section-block must also use this room
                        model.Add(R_lab_start[(s, c, start_t, r_id)] <= SectionBlockRoom[(s, block_id, r_id)])
        for r in rooms:
            r_id = r.room_id
            for t in T_non_break:
                occ_terms: List[cp_model.IntVar] = []
                for (s, c, tt), _ in list(X_lec.items()):
                    if tt != t:
                        continue
                    if (s, c, t, r_id) in R_lec:
                        occ_terms.append(R_lec[(s, c, t, r_id)])
                for (s, c, start_t), y in Y_lab_start.items():
                    defaults = course_by_id[c]
                    r_req = req_map.get((s, c))
                    lab_block_size = (defaults.lab_block_size if defaults.is_lab else 0) if r_req is None else (r_req.lab_block_size or (defaults.lab_block_size if defaults.is_lab else 0))
                    if lab_block_size and t in cover_by_block_size.get(lab_block_size, {}):
                        if start_t in cover_by_block_size[lab_block_size][t]:
                            if (s, c, start_t, r_id) in R_lab_start:
                                occ_terms.append(R_lab_start[(s, c, start_t, r_id)])
                if occ_terms:
                    model.Add(sum(occ_terms) <= 1)

    # Optional objective minimize gaps
    objective_terms: List[cp_model.IntVar] = []
    if optimize_gaps:
        Occ: Dict[Tuple[str, int], cp_model.IntVar] = {}
        for s in section_ids:
            for t in T_non_break:
                occ = model.NewBoolVar(f"occ_s{s}_t{t}")
                Occ[(s, t)] = occ
                terms: List[cp_model.IntVar] = [X_lec[(s, c, t)] for c in course_ids if (s, c, t) in X_lec]
                for c in course_ids:
                    defaults = course_by_id[c]
                    r = req_map.get((s, c))
                    weekly_lab_sessions = (defaults.lab_sessions_per_week if defaults.is_lab else 0) if r is None else r.weekly_lab_sessions
                    lab_block_size = (defaults.lab_block_size if defaults.is_lab else 0) if r is None else (r.lab_block_size or (defaults.lab_block_size if defaults.is_lab else 0))
                    if weekly_lab_sessions > 0 and lab_block_size > 0 and t in cover_by_block_size.get(lab_block_size, {}):
                        for start_t in cover_by_block_size[lab_block_size][t]:
                            var = Y_lab_start.get((s, c, start_t))
                            if var is not None:
                                terms.append(var)
                if terms:
                    for v in terms:
                        model.Add(v <= occ)
                    model.Add(sum(terms) >= occ)
                else:
                    model.Add(occ == 0)
        times_by_day: Dict[int, List[int]] = defaultdict(list)
        for t in timeslots:
            if not t.is_break:
                times_by_day[t.day_index].append(t.timeslot_id)
        for day_idx, ordered in times_by_day.items():
            ordered.sort(key=lambda tid: timeslot_by_id[tid].period_index)
            for s in section_ids:
                for i in range(1, len(ordered) - 1):
                    prev_t = ordered[i - 1]
                    mid_t = ordered[i]
                    next_t = ordered[i + 1]
                    g = model.NewBoolVar(f"gap_s{s}_d{day_idx}_i{i}")
                    model.Add(Occ[(s, prev_t)] + Occ[(s, next_t)] - 1 <= g)
                    model.Add(Occ[(s, mid_t)] == 0).OnlyEnforceIf(g)
                    objective_terms.append(g)
    if objective_terms:
        model.Minimize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(time_limit_sec)
    solver.parameters.num_search_workers = 8
    solver.parameters.log_search_progress = False
    solver.parameters.random_seed = 1

    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return SolveResult(
            status="INFEASIBLE",
            schedule_by_section={},
            schedule_by_faculty={},
            timeslots=timeslots,
            objective_value=None,
        )

    schedule_by_section: Dict[str, Dict[int, Tuple[str, str, str, str]]] = defaultdict(dict)
    schedule_by_faculty: Dict[str, Dict[int, Tuple[str, str, str, str]]] = defaultdict(dict)

    for (s, c, t), var in X_lec.items():
        if solver.Value(var) == 1:
            f = fac_map.get((s, c), "")
            room_id = ""
            if have_rooms and candidate_rooms_by_section.get(s):
                for rid in candidate_rooms_by_section[s]:
                    v = R_lec.get((s, c, t, rid))
                    if v is not None and solver.Value(v) == 1:
                        room_id = rid
                        break
            schedule_by_section[s][t] = (c, f, room_id, "lecture")
            if f:
                schedule_by_faculty[f][t] = (c, s, room_id, "lecture")

    day_period_to_tid = {(t.day_index, t.period_index): t.timeslot_id for t in timeslots}
    for (s, c, start_t), var in Y_lab_start.items():
        if solver.Value(var) == 1:
            defaults = course_by_id[c]
            r = req_map.get((s, c))
            bsize = (defaults.lab_block_size if defaults.is_lab else 0) if r is None else (r.lab_block_size or (defaults.lab_block_size if defaults.is_lab else 0))
            start_ts = timeslot_by_id[start_t]
            f = fac_map.get((s, c), "")
            room_id = ""
            if have_rooms and candidate_rooms_by_section.get(s):
                for rid in candidate_rooms_by_section[s]:
                    v = R_lab_start.get((s, c, start_t, rid))
                    if v is not None and solver.Value(v) == 1:
                        room_id = rid
                        break
            for k in range(bsize):
                tid = day_period_to_tid[(start_ts.day_index, start_ts.period_index + k)]
                schedule_by_section[s][tid] = (c, f, room_id, "lab")
                if f:
                    schedule_by_faculty[f][tid] = (c, s, room_id, "lab")

    obj_val: Optional[int] = None
    if objective_terms and status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        obj_val = int(solver.ObjectiveValue())

    # Compute available rooms and faculty per timeslot
    available_rooms_map: Dict[int, List[str]] = {}
    available_faculty_map: Dict[int, List[str]] = {}
    
    if have_rooms:
        for t in T_non_break:
            occupied_rooms = set()
            for s, by_t in schedule_by_section.items():
                if t in by_t:
                    _, _, room_id, _ = by_t[t]
                    if room_id:
                        occupied_rooms.add(room_id)
            available_rooms_map[t] = [r.room_id for r in rooms if r.room_id not in occupied_rooms]
    
    for t in T_non_break:
        occupied_faculty = set()
        for f, by_t in schedule_by_faculty.items():
            if t in by_t:
                occupied_faculty.add(f)
        available_faculty_map[t] = [f for f in faculty_ids if f not in occupied_faculty]
    
    return SolveResult(
        status=("OPTIMAL" if status == cp_model.OPTIMAL else "FEASIBLE"),
        schedule_by_section=schedule_by_section,
        schedule_by_faculty=schedule_by_faculty,
        timeslots=timeslots,
        objective_value=obj_val,
        available_rooms=available_rooms_map,
        available_faculty=available_faculty_map,
    )


