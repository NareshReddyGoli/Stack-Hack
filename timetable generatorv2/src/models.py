from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from pydantic import BaseModel, Field, field_validator


class DayPeriod(BaseModel):
    day_index: int = Field(..., ge=0)
    day_name: str
    period_index: int = Field(..., ge=1)
    is_break: bool = False


class Section(BaseModel):
    section_id: str
    section_name: str
    num_students: int = Field(..., ge=0)


class Faculty(BaseModel):
    faculty_id: str
    faculty_name: str


class Course(BaseModel):
    course_id: str
    course_name: str
    is_lab: bool = False
    lecture_periods_per_week: int = Field(0, ge=0)
    lab_sessions_per_week: int = Field(0, ge=0)
    lab_block_size: int = Field(2, ge=0)

    @validator("lab_sessions_per_week")
    def labs_impl_requires_lab_flag(cls, v, values):
        if v and not values.get("is_lab", False):
            raise ValueError("lab_sessions_per_week > 0 but is_lab is False")
        return v


class SectionCourseRequirement(BaseModel):
    section_id: str
    course_id: str
    weekly_lectures: int = Field(0, ge=0)
    weekly_lab_sessions: int = Field(0, ge=0)
    lab_block_size: Optional[int] = Field(None, ge=1)


class FacultyCourseAssignment(BaseModel):
    faculty_id: str
    course_id: str
    section_id: str


class Room(BaseModel):
    room_id: str
    room_name: str
    capacity: int = Field(..., ge=0)
    is_lab: bool = False


@dataclass(frozen=True)
class Timeslot:
    day_index: int
    day_name: str
    period_index: int
    timeslot_id: int
    is_break: bool


class ProblemData(BaseModel):
    day_periods: List[DayPeriod]
    sections: List[Section]
    faculty: List[Faculty]
    courses: List[Course]
    section_requirements: List[SectionCourseRequirement]
    faculty_courses: List[FacultyCourseAssignment]
    rooms: Optional[List[Room]] = None

    class Config:
        arbitrary_types_allowed = True

    def build_timeslots(self) -> List[Timeslot]:
        sorted_rows = sorted(self.day_periods, key=lambda r: (r.day_index, r.period_index))
        timeslots: List[Timeslot] = []
        t_id = 0
        for row in sorted_rows:
            timeslots.append(
                Timeslot(
                    day_index=row.day_index,
                    day_name=row.day_name,
                    period_index=row.period_index,
                    timeslot_id=t_id,
                    is_break=row.is_break,
                )
            )
            t_id += 1
        return timeslots

    def section_ids(self) -> List[str]:
        return [s.section_id for s in self.sections]

    def faculty_ids(self) -> List[str]:
        return [f.faculty_id for f in self.faculty]

    def course_ids(self) -> List[str]:
        return [c.course_id for c in self.courses]

    def course_by_id(self) -> Dict[str, Course]:
        return {c.course_id: c for c in self.courses}

    def faculty_assignment_map(self) -> Dict[Tuple[str, str], str]:
        # (section_id, course_id) -> faculty_id
        mapping: Dict[Tuple[str, str], str] = {}
        for a in self.faculty_courses:
            mapping[(a.section_id, a.course_id)] = a.faculty_id
        return mapping

    def section_course_requirements_map(self) -> Dict[Tuple[str, str], SectionCourseRequirement]:
        m: Dict[Tuple[str, str], SectionCourseRequirement] = {}
        for r in self.section_requirements:
            m[(r.section_id, r.course_id)] = r
        return m


