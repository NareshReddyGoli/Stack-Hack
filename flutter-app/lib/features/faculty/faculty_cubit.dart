import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:my_app/services/api_client.dart';
import 'faculty_state.dart';

class FacultyCubit extends Cubit<FacultyState> {
  final ApiClient _api = ApiClient();
  FacultyCubit() : super(const FacultyInitial()) { _api.init(); }

  void loadData(String facultyId) async {
    emit(const FacultyLoading());
    try {
      final routineRes = await _api.get('/api/faculty/my-routine');
      final entries = (routineRes.data as Map<String, dynamic>)['entries'] as List<dynamic>? ?? [];
      final schedule = entries.map((e) {
        final int periodIndex = (e['periodIndex'] is int)
            ? (e['periodIndex'] as int)
            : int.tryParse('${e['periodIndex'] ?? 0}') ?? 0;
        return {
          'day': e['day'],
          'period': periodIndex + 1,
          'subject': e['courseId'] ?? e['courseCode'] ?? '',
          'room': e['roomId'] ?? e['room'] ?? '',
          'section': e['section'] ?? '',
        };
      }).toList();

      // We can later map to leave requests list; using empty for now
      final absents = <Map<String, dynamic>>[];
      emit(FacultyLoaded(schedule: schedule, absents: absents));
    } catch (e) {
      emit(FacultyError('Failed to load data: $e'));
    }
  }

  Future<void> sendAbsentNotification({String reason = 'Absent Today'}) async {
    try {
      await _api.post('/api/faculty/unavailability', data: {
        'date': DateTime.now().toIso8601String(),
        'reason': reason,
      });
    } catch (_) {
      // surface via UI if needed; keeping silent here
    }
  }
}
