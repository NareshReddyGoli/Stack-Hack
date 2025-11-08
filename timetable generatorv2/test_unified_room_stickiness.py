"""
Test to verify UNIFIED room stickiness is working correctly.
Each section should use ONE room (not separate for lectures and labs) within each block.
"""
from src.loader import load_problem_from_directory
from src.timetable_solver import solve, _identify_continuous_blocks
from collections import defaultdict

def test_unified_room_stickiness():
    print("=" * 70)
    print("Testing UNIFIED Room Stickiness (One Room Per Block)")
    print("=" * 70)
    
    # Load data
    try:
        problem = load_problem_from_directory("TT_Flexinput")
    except FileNotFoundError:
        print("Using data/templates instead...")
        problem = load_problem_from_directory("data/templates")
    
    timeslots = problem.build_timeslots()
    
    # Show block structure
    blocks_by_day = _identify_continuous_blocks(timeslots)
    print("\n📋 Block Structure:")
    print("-" * 70)
    for day_idx, blocks in sorted(blocks_by_day.items()):
        day_name = next(t.day_name for t in timeslots if t.day_index == day_idx)
        print(f"\n{day_name} (Day {day_idx}):")
        for block_id, timeslot_ids in blocks:
            periods = [next(t.period_index for t in timeslots if t.timeslot_id == tid) 
                      for tid in timeslot_ids]
            print(f"  Block {block_id}: Periods {periods}")
    
    # Solve
    print("\n\n🔧 Solving timetable with UNIFIED room stickiness...")
    print("-" * 70)
    result = solve(problem, time_limit_sec=90, optimize_gaps=False)
    
    if result.status == "INFEASIBLE":
        print("❌ Solver could not find a feasible solution")
        print("   This might mean unified room constraints are too strict")
        return False
    
    print(f"✅ Solver Status: {result.status}")
    
    # Check unified room stickiness per section per block
    print("\n\n🔍 Verifying UNIFIED Room Stickiness:")
    print("-" * 70)
    print("Each section should use ONE room for ALL classes (lectures + labs) per block")
    print()
    
    violations = []
    timeslot_by_id = {t.timeslot_id: t for t in timeslots}
    
    for section_id, schedule in result.schedule_by_section.items():
        print(f"\nSection: {section_id}")
        
        # Group by day and block
        for day_idx, blocks in sorted(blocks_by_day.items()):
            day_name = next(t.day_name for t in timeslots if t.day_index == day_idx)
            
            for block_id, timeslot_ids in blocks:
                # Get all rooms used in this block (regardless of lecture/lab)
                rooms_used = {}  # room_id -> [(period, course, kind)]
                
                for tid in timeslot_ids:
                    if tid in schedule:
                        course_id, faculty_id, room_id, kind = schedule[tid]
                        period = timeslot_by_id[tid].period_index
                        if room_id:
                            if room_id not in rooms_used:
                                rooms_used[room_id] = []
                            rooms_used[room_id].append((period, course_id, kind))
                
                if not rooms_used:
                    continue
                
                # Check if multiple rooms used in this block
                if len(rooms_used) > 1:
                    periods = [p for rooms in rooms_used.values() for p, _, _ in rooms]
                    print(f"  ❌ {day_name} Block {block_id} (P{min(periods)}-P{max(periods)}): "
                          f"Multiple rooms: {list(rooms_used.keys())}")
                    
                    for room_id, classes in rooms_used.items():
                        types = [kind for _, _, kind in classes]
                        print(f"      Room {room_id}: {', '.join(f'P{p} {c} [{k}]' for p, c, k in classes)}")
                    
                    violations.append({
                        'section': section_id,
                        'day': day_name,
                        'block': block_id,
                        'rooms': list(rooms_used.keys()),
                        'details': rooms_used
                    })
                else:
                    # Only one room used for everything
                    room_id = list(rooms_used.keys())[0]
                    classes = rooms_used[room_id]
                    periods = [p for p, _, _ in classes]
                    types = set(k for _, _, k in classes)
                    type_str = "+".join(sorted(types))
                    
                    print(f"  ✅ {day_name} Block {block_id} (P{min(periods)}-P{max(periods)}): "
                          f"ONE room {room_id} for all classes ({type_str})")
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY:")
    print("=" * 70)
    if violations:
        print(f"❌ Found {len(violations)} UNIFIED room stickiness violations!")
        print("\nViolation Details:")
        for v in violations:
            print(f"\n  Section {v['section']} on {v['day']} Block {v['block']}:")
            print(f"    Using multiple rooms: {v['rooms']}")
            print(f"    Should use only ONE room for all classes in this block!")
        return False
    else:
        print("✅ UNIFIED Room Stickiness Satisfied!")
        print("   Each section uses exactly ONE room per block")
        print("   Lectures and labs in same block use THE SAME room")
        print("   Room changes only happen after breaks")
        return True

if __name__ == "__main__":
    success = test_unified_room_stickiness()
    exit(0 if success else 1)
