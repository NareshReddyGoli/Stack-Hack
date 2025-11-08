import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:my_app/services/auth_service.dart';
import 'login_state.dart';

class LoginCubit extends Cubit<LoginState> {
  final AuthService _auth = AuthService();
  LoginCubit() : super(const LoginInitial()) { _auth.init(); }

  void selectRole(UserRole role) {
    emit(state.copyWith(selectedRole: role, error: null));
  }

  void login(String username, String password) async {
    final roleSelection = state.selectedRole;
    if (roleSelection == null) {
      emit(LoginError('Please select a role first'));
      return;
    }

    emit(const LoginLoading());

    try {
      final role = roleSelection == UserRole.student ? AuthRole.student : AuthRole.faculty;
      await _auth.login(role: role, username: username, password: password);
      emit(LoginAuthenticated(roleSelection));
    } catch (e) {
      emit(LoginError(e.toString().replaceFirst('Exception: ', '')));
    }
  }

  void logout() {
    emit(const LoginInitial());
  }

  // Removed in-memory validation
}
