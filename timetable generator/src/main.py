from __future__ import annotations

import argparse
import os
import sys

from .exporter import export_all
from .feasibility import pre_solve_feasibility_check
from .loader import load_problem_from_directory
from .timetable_solver import solve


def main() -> int:
    parser = argparse.ArgumentParser(description="Automatic Timetable Generator")
    parser.add_argument("--inputs", required=True, help="Directory containing input CSV files")
    parser.add_argument("--output", required=True, help="Directory to write outputs")
    parser.add_argument("--time_limit_sec", type=int, default=60, help="Solver time limit in seconds")
    parser.add_argument("--optimize_gaps", action="store_true", help="Minimize gaps (slower)")
    args = parser.parse_args()

    problem = load_problem_from_directory(args.inputs)
    report = pre_solve_feasibility_check(problem)
    if not report.ok():
        print("Feasibility errors detected:")
        for e in report.errors:
            print(f" - {e}")
        if report.warnings:
            print("Warnings:")
            for w in report.warnings:
                print(f" - {w}")
        return 2
    if report.warnings:
        print("Feasibility warnings:")
        for w in report.warnings:
            print(f" - {w}")

    result = solve(problem, time_limit_sec=args.time_limit_sec, optimize_gaps=args.optimize_gaps)
    if result.status == "INFEASIBLE":
        print("Solver could not find a feasible timetable.")
        return 3

    export_all(result, args.output)
    print(f"Solver status: {result.status}")
    if result.objective_value is not None:
        print(f"Objective value: {result.objective_value}")
    print(f"Outputs written to: {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())


