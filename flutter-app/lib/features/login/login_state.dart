import 'package:equatable/equatable.dart';

enum UserRole { student, faculty }

class LoginState extends Equatable {
  final bool isLoading;
  final UserRole? selectedRole;
  final String? error;
  final bool isAuthenticated;
  final UserRole? authenticatedRole;

  const LoginState({
    this.isLoading = false,
    this.selectedRole,
    this.error,
    this.isAuthenticated = false,
    this.authenticatedRole,
  });

  LoginState copyWith({
    bool? isLoading,
    UserRole? selectedRole,
    String? error,
    bool? isAuthenticated,
    UserRole? authenticatedRole,
  }) {
    return LoginState(
      isLoading: isLoading ?? this.isLoading,
      selectedRole: selectedRole ?? this.selectedRole,
      error: error ?? this.error,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      authenticatedRole: authenticatedRole ?? this.authenticatedRole,
    );
  }

  @override
  List<Object?> get props =>
      [isLoading, selectedRole, error, isAuthenticated, authenticatedRole];
}

class LoginInitial extends LoginState {
  const LoginInitial();
}

class LoginLoading extends LoginState {
  const LoginLoading() : super(isLoading: true);
}

class LoginError extends LoginState {
  const LoginError(String error) : super(error: error);
}

class LoginAuthenticated extends LoginState {
  const LoginAuthenticated(UserRole role)
      : super(isAuthenticated: true, authenticatedRole: role);
}
