import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:my_app/services/api_client.dart';
import 'student_state.dart';

class StudentCubit extends Cubit<StudentState> {
  final ApiClient _api = ApiClient();
  StudentCubit() : super(const StudentInitial()) { _api.init(); }

  void loadData(String studentId) async {
    emit(const StudentLoading());
    try {
      final ttRes = await _api.get('/api/student/my-timetable');
      final entries = (ttRes.data as Map<String, dynamic>)['entries'] as List<dynamic>? ?? [];
      final timetables = entries.map((e) {
        final int periodIndex = (e['periodIndex'] is int)
            ? (e['periodIndex'] as int)
            : int.tryParse('${e['periodIndex'] ?? 0}') ?? 0;
        return {
          'day': (e['day'] ?? e['dayName'] ?? ''),
          'period': periodIndex + 1,
          'subject': e['courseId'] ?? '',
          'room': e['roomId'] ?? '',
          'faculty': e['facultyId'] ?? '',
        };
      }).toList();

      final notifRes = await _api.get('/api/notifications');
      final notifs = (notifRes.data as List<dynamic>).map((n) => {
        'title': n['title'] ?? 'Notification',
        'message': n['message'] ?? '',
        'date': (n['createdAt'] ?? '').toString().substring(0,10),
        'type': 'info',
      }).toList();

      emit(StudentLoaded(timetables: timetables, notifications: notifs));
    } catch (e) {
      emit(StudentError('Failed to load data: $e'));
    }
  }
}
