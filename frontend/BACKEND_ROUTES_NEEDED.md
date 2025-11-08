# Backend API Routes Required

This document lists all the backend API routes that need to be implemented to support the new frontend features.

---

## 1. Faculty Timetables (Admin)

### Get All Faculty
```
GET /api/admin/faculty
```
**Response:**
```json
[
  {
    "_id": "faculty123",
    "teacherId": "VU001",
    "name": "Dr. John Smith",
    "email": "john.smith@college.edu"
  }
]
```

### Get Faculty Schedule
```
GET /api/admin/faculty/:facultyId/schedule
```
**Response:**
```json
{
  "entries": [
    {
      "day": "Monday",
      "periodIndex": 0,
      "courseCode": "CN",
      "courseId": "CN",
      "section": "3A1",
      "sectionId": "3A1",
      "room": "N412",
      "roomId": "N412",
      "kind": "lecture"
    }
  ]
}
```

---

## 2. Faculty Unavailability (Faculty Side)

### Get My Unavailabilities
```
GET /api/faculty/unavailability
```
**Response:**
```json
[
  {
    "_id": "unav123",
    "facultyId": "faculty123",
    "date": "2025-11-11",
    "day": "Monday",
    "startPeriod": 3,
    "endPeriod": 5,
    "reason": "Medical appointment",
    "status": "pending",
    "createdAt": "2025-11-07T14:30:00Z"
  }
]
```

### Create Unavailability
```
POST /api/faculty/unavailability
Content-Type: application/json
```
**Body:**
```json
{
  "date": "2025-11-11",
  "day": "Monday",
  "startPeriod": "3",
  "endPeriod": "5",
  "reason": "Medical appointment"
}
```
**Response:**
```json
{
  "message": "Unavailability marked successfully",
  "unavailability": { /* created object */ }
}
```

### Delete Unavailability
```
DELETE /api/faculty/unavailability/:id
```
**Response:**
```json
{
  "message": "Unavailability deleted successfully"
}
```

---

## 3. Faculty Unavailability (Admin Side)

### Get All Unavailability Requests
```
GET /api/admin/faculty-unavailability
```
**Response:**
```json
[
  {
    "_id": "unav123",
    "facultyId": "faculty123",
    "facultyName": "Dr. John Smith",
    "facultyEmail": "john.smith@college.edu",
    "date": "2025-11-11",
    "day": "Monday",
    "startPeriod": 3,
    "endPeriod": 5,
    "reason": "Medical appointment",
    "status": "pending",
    "createdAt": "2025-11-07T14:30:00Z"
  }
]
```

### Update Unavailability Status
```
PATCH /api/admin/faculty-unavailability/:id/status
Content-Type: application/json
```
**Body:**
```json
{
  "status": "approved"
}
```
Allowed values: `"approved"`, `"rejected"`, `"pending"`

**Response:**
```json
{
  "message": "Status updated successfully",
  "unavailability": { /* updated object */ }
}
```

---

## 4. Python Scheduler - Enhanced Response

### Run Solver
```
POST /api/admin/python-scheduler/run
```
**Enhanced Response (add these fields):**
```json
{
  "timetableId": "tt123",
  "solver": {
    "status": "optimal",
    "warnings": [],
    
    // NEW FIELDS TO ADD:
    "availableRooms": ["R101", "R102", "Lab-A"],
    "availableFaculty": ["Dr. Smith", "Prof. Johnson"],
    
    // Existing fields:
    "sections": { /* ... */ },
    "faculty": { /* ... */ },
    "sectionGrids": { /* ... */ },
    "facultyGrids": { /* ... */ }
  }
}
```

**Note:** The `availableRooms` and `availableFaculty` arrays can contain:
- Simple strings: `["R101", "R102"]`
- Or objects: `[{ "roomId": "R101" }, { "name": "Dr. Smith" }]`

The frontend now handles both formats!

---

## Database Schema Suggestions

### Unavailability Collection
```javascript
{
  facultyId: ObjectId,          // Reference to Faculty
  date: Date,                    // Date of unavailability
  day: String,                   // Day name (Monday, Tuesday, etc.)
  startPeriod: Number,           // Starting period (1-9)
  endPeriod: Number,             // Ending period (1-9)
  reason: String,                // Reason for unavailability
  status: String,                // 'pending', 'approved', 'rejected'
  createdAt: Date,
  updatedAt: Date
}
```

---

## Implementation Priority

1. **High Priority** (for Python Scheduler to work):
   - Enhance `/api/admin/python-scheduler/run` response to include `availableRooms` and `availableFaculty`

2. **Medium Priority** (for admin features):
   - `/api/admin/faculty` - Get faculty list
   - `/api/admin/faculty/:id/schedule` - Get faculty schedule

3. **Low Priority** (for unavailability feature):
   - All `/api/faculty/unavailability` routes
   - All `/api/admin/faculty-unavailability` routes

---

## Notes

- All routes should require authentication
- Admin routes require admin role verification
- Faculty routes require faculty role verification
- Use appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Include proper error messages in responses
- The frontend has been updated to gracefully handle 404s until routes are implemented
