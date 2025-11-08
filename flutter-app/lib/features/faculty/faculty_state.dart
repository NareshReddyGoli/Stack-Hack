import 'package:equatable/equatable.dart';

class FacultyState extends Equatable {
  final bool isLoading;
  final List<Map<String, dynamic>> schedule;
  final List<Map<String, dynamic>> absents;
  final String? error;

  const FacultyState({
    this.isLoading = false,
    this.schedule = const [],
    this.absents = const [],
    this.error,
  });

  FacultyState copyWith({
    bool? isLoading,
    List<Map<String, dynamic>>? schedule,
    List<Map<String, dynamic>>? absents,
    String? error,
  }) {
    return FacultyState(
      isLoading: isLoading ?? this.isLoading,
      schedule: schedule ?? this.schedule,
      absents: absents ?? this.absents,
      error: error ?? this.error,
    );
  }

  @override
  List<Object?> get props => [isLoading, schedule, absents, error];
}

class FacultyInitial extends FacultyState {
  const FacultyInitial();
}

class FacultyLoading extends FacultyState {
  const FacultyLoading() : super(isLoading: true);
}

class FacultyLoaded extends FacultyState {
  const FacultyLoaded({
    required List<Map<String, dynamic>> schedule,
    required List<Map<String, dynamic>> absents,
  }) : super(schedule: schedule, absents: absents);
}

class FacultyError extends FacultyState {
  const FacultyError(String error) : super(error: error);
}
