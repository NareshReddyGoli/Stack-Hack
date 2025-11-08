"""
Test to verify P1 (first period) constraint is working.
Each faculty should teach at most 3 times in P1 across all sections.
"""
from src.loader import load_problem_from_directory
from src.timetable_solver import solve
from collections import defaultdict

def test_p1_constraint():
    print("=" * 70)
    print("Testing P1 Constraint: Max 3 First Periods per Faculty per Week")
    print("=" * 70)
    
    # Load data
    try:
        problem = load_problem_from_directory("TT_Flexinput")
    except FileNotFoundError:
        print("Using data/templates instead...")
        problem = load_problem_from_directory("data/templates")
    
    timeslots = problem.build_timeslots()
    
    # Identify P1 timeslots
    P1_timeslots = [t for t in timeslots if t.period_index == 1 and not t.is_break]
    print(f"\n📋 Found {len(P1_timeslots)} P1 (first period) timeslots:")
    for t in P1_timeslots:
        print(f"   - {t.day_name} P1 (timeslot_id: {t.timeslot_id})")
    
    # Solve
    print("\n🔧 Solving timetable with P1 constraint...")
    result = solve(problem, time_limit_sec=90, optimize_gaps=False)
    
    if result.status == "INFEASIBLE":
        print("❌ Solver could not find a feasible solution")
        print("   This might mean the P1 constraint is too restrictive")
        return False
    
    print(f"✅ Solver Status: {result.status}")
    
    # Count P1 assignments per faculty
    print("\n🔍 Counting P1 assignments per faculty...")
    print("-" * 70)
    
    P1_timeslot_ids = {t.timeslot_id for t in P1_timeslots}
    faculty_p1_count = defaultdict(list)  # faculty_id -> [(day, section, course)]
    
    for faculty_id, schedule in result.schedule_by_faculty.items():
        for timeslot_id, (course_id, section_id, room_id, kind) in schedule.items():
            if timeslot_id in P1_timeslot_ids:
                # Find the day name
                day_name = next(t.day_name for t in timeslots if t.timeslot_id == timeslot_id)
                faculty_p1_count[faculty_id].append((day_name, section_id, course_id))
    
    # Display results
    violations = []
    for faculty_id in sorted(faculty_p1_count.keys()):
        assignments = faculty_p1_count[faculty_id]
        count = len(assignments)
        
        status = "✅" if count <= 3 else "❌"
        print(f"{status} Faculty {faculty_id}: {count} P1 assignments")
        
        for day, section, course in sorted(assignments):
            print(f"     - {day}: Section {section}, Course {course}")
        
        if count > 3:
            violations.append((faculty_id, count, assignments))
            print(f"     ⚠️  VIOLATION: {count} > 3")
        print()
    
    # Check faculties with no P1 assignments
    all_faculty = problem.faculty_ids()
    faculty_with_no_p1 = set(all_faculty) - set(faculty_p1_count.keys())
    if faculty_with_no_p1:
        print(f"ℹ️  Faculties with 0 P1 assignments: {sorted(faculty_with_no_p1)}")
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY:")
    print("=" * 70)
    
    if violations:
        print(f"❌ CONSTRAINT VIOLATED! {len(violations)} faculties exceed P1 limit:")
        for faculty_id, count, _ in violations:
            print(f"   - Faculty {faculty_id}: {count} P1 assignments (max allowed: 3)")
        return False
    else:
        print("✅ P1 Constraint Satisfied!")
        print(f"   All {len(faculty_p1_count)} faculties with P1 assignments have ≤ 3 first periods")
        print(f"   Max P1 assignments: {max([len(v) for v in faculty_p1_count.values()], default=0)}")
        print(f"   Min P1 assignments: {min([len(v) for v in faculty_p1_count.values()], default=0)}")
        return True

if __name__ == "__main__":
    success = test_p1_constraint()
    exit(0 if success else 1)
