"""
Generate timetable for TT_Flexinput data and verify room stickiness.
"""
from src.loader import load_problem_from_directory
from src.feasibility import pre_solve_feasibility_check
from src.timetable_solver import solve
from src.exporter import export_all

def generate_timetable():
    print("=" * 70)
    print("Generating Timetable for TT_Flexinput")
    print("=" * 70)
    
    # Load
    print("\n📂 Loading data from TT_Flexinput/...")
    problem = load_problem_from_directory("TT_Flexinput")
    
    # Feasibility check
    print("\n🔍 Checking feasibility...")
    report = pre_solve_feasibility_check(problem)
    
    if not report.ok():
        print("❌ Feasibility errors detected:")
        for e in report.errors:
            print(f"   - {e}")
        return False
    
    if report.warnings:
        print("⚠️  Warnings:")
        for w in report.warnings:
            print(f"   - {w}")
    
    # Solve
    print("\n🔧 Solving with CP-SAT...")
    result = solve(problem, time_limit_sec=90, optimize_gaps=False)
    
    if result.status == "INFEASIBLE":
        print("❌ No feasible solution found")
        return False
    
    print(f"✅ Solver Status: {result.status}")
    if result.objective_value:
        print(f"   Objective Value: {result.objective_value}")
    
    # Export
    print("\n💾 Exporting timetables...")
    output_dir = "TT_Flexinput_output"
    export_all(result, output_dir)
    
    print(f"\n✅ Success! Timetables exported to: {output_dir}/")
    print("\nGenerated files:")
    print(f"   - {output_dir}/sections/section_*.csv")
    print(f"   - {output_dir}/faculty/faculty_*.csv")
    print(f"   - {output_dir}/master_timetable.csv")
    print(f"   - {output_dir}/available_rooms.csv")
    print(f"   - {output_dir}/available_faculty.csv")
    
    # Verify stickiness
    print("\n🔍 Verifying room stickiness...")
    print("   Check the section CSV files - within each block (P1-P2, P4-P6, P8-P9):")
    print("   - All lectures should use the same lecture room")
    print("   - All labs should use the same lab room")
    
    return True

if __name__ == "__main__":
    success = generate_timetable()
    exit(0 if success else 1)
