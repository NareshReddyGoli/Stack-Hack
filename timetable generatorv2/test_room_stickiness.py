"""
Test to verify room stickiness is working correctly across blocks.
This checks that sections stay in the same room within a block.
"""
from src.loader import load_problem_from_directory
from src.timetable_solver import solve, _identify_continuous_blocks

def test_room_stickiness_with_breaks():
    print("Testing Room Stickiness with Multiple Breaks")
    print("=" * 70)
    
    # Load data from TT_Flexinput which has breaks at P3 and P7
    try:
        problem = load_problem_from_directory("TT_Flexinput")
    except FileNotFoundError:
        print("❌ TT_Flexinput directory not found")
        print("   Using data/templates instead...")
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
    print("\n\n🔧 Solving timetable...")
    print("-" * 70)
    result = solve(problem, time_limit_sec=60, optimize_gaps=False)
    
    if result.status == "INFEASIBLE":
        print("❌ Solver could not find a feasible solution")
        print("   This might mean room constraints are too strict")
        return False
    
    print(f"✅ Solver Status: {result.status}")
    
    # Check room stickiness per section per block
    print("\n\n🔍 Verifying Room Stickiness:")
    print("-" * 70)
    
    violations = []
    timeslot_by_id = {t.timeslot_id: t for t in timeslots}
    
    for section_id, schedule in result.schedule_by_section.items():
        print(f"\nSection: {section_id}")
        
        # Group by day and block
        for day_idx, blocks in sorted(blocks_by_day.items()):
            day_name = next(t.day_name for t in timeslots if t.day_index == day_idx)
            
            for block_id, timeslot_ids in blocks:
                # Get all rooms used in this block
                rooms_in_block = {}
                for tid in timeslot_ids:
                    if tid in schedule:
                        course_id, faculty_id, room_id, kind = schedule[tid]
                        period = timeslot_by_id[tid].period_index
                        if room_id:
                            if kind not in rooms_in_block:
                                rooms_in_block[kind] = {}
                            if room_id not in rooms_in_block[kind]:
                                rooms_in_block[kind][room_id] = []
                            rooms_in_block[kind][room_id].append((period, course_id))
                
                # Check if multiple rooms used for same type
                for kind, room_dict in rooms_in_block.items():
                    if len(room_dict) > 1:
                        periods = [p for rooms in room_dict.values() for p, _ in rooms]
                        print(f"  ⚠️  {day_name} Block {block_id} (P{min(periods)}-P{max(periods)}): "
                              f"Multiple {kind} rooms: {list(room_dict.keys())}")
                        violations.append({
                            'section': section_id,
                            'day': day_name,
                            'block': block_id,
                            'kind': kind,
                            'rooms': list(room_dict.keys()),
                            'details': room_dict
                        })
                    else:
                        for room_id, classes in room_dict.items():
                            periods = [p for p, _ in classes]
                            print(f"  ✅ {day_name} Block {block_id} (P{min(periods)}-P{max(periods)}): "
                                  f"{kind} uses {room_id}")
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY:")
    print("=" * 70)
    if violations:
        print(f"❌ Found {len(violations)} room stickiness violations!")
        print("\nViolation Details:")
        for v in violations:
            print(f"\n  Section {v['section']} on {v['day']} Block {v['block']}:")
            print(f"    Multiple {v['kind']} rooms used: {v['rooms']}")
            for room, classes in v['details'].items():
                print(f"      Room {room}: Periods {[p for p, _ in classes]} - {[c for _, c in classes]}")
        return False
    else:
        print("✅ All sections maintain room stickiness within blocks!")
        print("   Each section uses at most:")
        print("   - One lecture room per block")
        print("   - One lab room per block")
        return True

if __name__ == "__main__":
    success = test_room_stickiness_with_breaks()
    exit(0 if success else 1)
