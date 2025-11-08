"""
Quick test to verify day ordering is correct (Monday -> Saturday).
Run this to confirm the fix is working.
"""
from src.loader import load_problem_from_directory

def test_day_ordering():
    print("Testing day ordering...")
    print("-" * 60)
    
    # Load the template data
    try:
        problem = load_problem_from_directory("data/templates")
        timeslots = problem.build_timeslots()
        
        # Group by day and show order
        days_seen = {}
        for t in timeslots:
            if t.day_index not in days_seen:
                days_seen[t.day_index] = t.day_name
        
        # Display in day_index order
        print("Day ordering in system:")
        print(f"{'Day Index':<12} {'Day Name':<15}")
        print("-" * 30)
        for idx in sorted(days_seen.keys()):
            print(f"{idx:<12} {days_seen[idx]:<15}")
        
        # Expected order
        expected_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        actual_order = [days_seen[i] for i in sorted(days_seen.keys())]
        
        print("\n" + "=" * 60)
        print("VERIFICATION:")
        print("=" * 60)
        print(f"Expected: {expected_order}")
        print(f"Actual:   {actual_order}")
        
        if actual_order == expected_order:
            print("\n✅ SUCCESS! Days are in correct order (Monday -> Saturday)")
            return True
        else:
            print("\n❌ FAILED! Day order is incorrect")
            print("   This might be okay if your data doesn't use all weekdays")
            print("   or uses different day names.")
            return False
            
    except FileNotFoundError as e:
        print(f"❌ Error: Could not find template files")
        print(f"   Make sure 'data/templates' directory exists")
        print(f"   Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_day_ordering()
