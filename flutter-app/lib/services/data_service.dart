import '../features/login/login_state.dart';

class DataService {
  static final DataService _instance = DataService._internal();
  factory DataService() => _instance;
  DataService._internal();

  // In-memory users for login (already in cubit, but can expand)

  // Student timetables
  static List<Map<String, dynamic>> getStudentTimetables(String studentId) {
    return [
      {
        'day': 'Monday',
        'time': '9:00 AM - 10:30 AM',
        'subject': 'Mathematics',
        'room': 'A-101',
        'faculty': 'Dr. Smith',
      },
      {
        'day': 'Monday',
        'time': '11:00 AM - 12:30 PM',
        'subject': 'Physics',
        'room': 'B-202',
        'faculty': 'Prof. Johnson',
      },
      {
        'day': 'Tuesday',
        'time': '10:00 AM - 11:30 AM',
        'subject': 'Chemistry',
        'room': 'C-303',
        'faculty': 'Dr. Lee',
      },
      // Add more sample data
    ];
  }

  // Student notifications
  static List<Map<String, dynamic>> getStudentNotifications(String studentId) {
    return [
      {
        'title': 'Class Cancellation',
        'message': 'Mathematics class on Wednesday is cancelled.',
        'date': '2025-11-07',
        'type': 'warning',
      },
      {
        'title': 'Exam Schedule',
        'message': 'Midterm exams start next week. Check details.',
        'date': '2025-11-06',
        'type': 'info',
      },
      {
        'title': 'Assignment Due',
        'message': 'Submit Physics assignment by Friday.',
        'date': '2025-11-05',
        'type': 'urgent',
      },
    ];
  }

  // Faculty schedules
  static List<Map<String, dynamic>> getFacultySchedule(String facultyId) {
    return [
      {
        'day': 'Monday',
        'time': '9:00 AM - 10:30 AM',
        'subject': 'Mathematics',
        'room': 'A-101',
        'batch': 'Batch A',
      },
      {
        'day': 'Monday',
        'time': '2:00 PM - 3:30 PM',
        'subject': 'Advanced Calculus',
        'room': 'D-404',
        'batch': 'Batch B',
      },
      {
        'day': 'Tuesday',
        'time': '11:00 AM - 12:30 PM',
        'subject': 'Algebra',
        'room': 'A-102',
        'batch': 'Batch C',
      },
    ];
  }

  // Faculty absent notifications (sent to admin)
  static List<Map<String, dynamic>> getFacultyAbsents(String facultyId) {
    return [
      {
        'date': '2025-11-07',
        'subject': 'Mathematics',
        'time': '9:00 AM - 10:30 AM',
        'status': 'Replacement Arranged',
      },
    ];
  }

  static void sendAbsentNotification(
      String facultyId, String subject, String time) {
    // Simulate sending to admin - add to a list
    _absentNotifications.add({
      'facultyId': facultyId,
      'date': DateTime.now().toString().split(' ')[0],
      'subject': subject,
      'time': time,
      'status': 'Pending',
    });
  }

  static final List<Map<String, dynamic>> _absentNotifications = [];
}
