import 'package:equatable/equatable.dart';

class StudentState extends Equatable {
  final bool isLoading;
  final List<Map<String, dynamic>> timetables;
  final List<Map<String, dynamic>> notifications;
  final String? error;

  const StudentState({
    this.isLoading = false,
    this.timetables = const [],
    this.notifications = const [],
    this.error,
  });

  StudentState copyWith({
    bool? isLoading,
    List<Map<String, dynamic>>? timetables,
    List<Map<String, dynamic>>? notifications,
    String? error,
  }) {
    return StudentState(
      isLoading: isLoading ?? this.isLoading,
      timetables: timetables ?? this.timetables,
      notifications: notifications ?? this.notifications,
      error: error ?? this.error,
    );
  }

  @override
  List<Object?> get props => [isLoading, timetables, notifications, error];
}

class StudentInitial extends StudentState {
  const StudentInitial();
}

class StudentLoading extends StudentState {
  const StudentLoading() : super(isLoading: true);
}

class StudentLoaded extends StudentState {
  const StudentLoaded({
    required List<Map<String, dynamic>> timetables,
    required List<Map<String, dynamic>> notifications,
  }) : super(timetables: timetables, notifications: notifications);
}

class StudentError extends StudentState {
  const StudentError(String error) : super(error: error);
}
