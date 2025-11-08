import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:my_app/services/api_client.dart';

enum AuthRole { student, faculty }

class AuthService {
  final ApiClient _api = ApiClient();

  Future<void> init() => _api.init();

  Future<Map<String, dynamic>> me() async {
    final res = await _api.get('/api/auth/me');
    return (res.data as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> login({
    required AuthRole role,
    required String username,
    required String password,
  }) async {
    try {
      final body = _buildLoginPayload(role, username, password);
      final Response res = await _api.post('/api/auth/login', data: body);
      if (res.statusCode != 200) {
        throw Exception('Login failed');
      }
      final meRes = await _api.get('/api/auth/me');
      return (meRes.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final code = e.response?.statusCode;
      final msg = (e.response?.data is Map && (e.response?.data['message'] is String))
          ? e.response?.data['message'] as String
          : null;
      if (code == 401) {
        throw Exception(msg ?? 'Invalid credentials');
      }
      if (code == 400) {
        throw Exception(msg ?? 'Bad request');
      }
      if (code == 500) {
        throw Exception(msg ?? 'Server error');
      }
      throw Exception(msg ?? 'Network error');
    } catch (e) {
      throw Exception('Unexpected error');
    }
  }

  Map<String, dynamic> _buildLoginPayload(AuthRole role, String user, String pw) {
    if (role == AuthRole.student) {
      return { 'registration_no': user, 'password': pw };
    }
    // faculty: accept teacherId or email
    if (user.contains('@')) {
      return { 'email': user, 'password': pw };
    }
    // backend expects teacher_id
    return { 'teacher_id': user, 'password': pw };
  }

  Future<void> logout() async {
    await _api.post('/api/auth/logout');
  }
}



