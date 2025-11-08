import 'dart:io';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  static const String _prefsKeyBaseUrl = 'api_base_url';
  static String get _platformDefaultBase {
    // Android emulator maps host loopback to 10.0.2.2
    if (Platform.isAndroid) return 'http://10.0.2.2:4000';
    return 'http://localhost:4000';
  }

  static final String kDefaultApiBase = const String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  ).isNotEmpty
      ? const String.fromEnvironment('API_BASE_URL')
      : _platformDefaultBase;

  final Dio _dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 20),
      sendTimeout: const Duration(seconds: 20),
      headers: {'Accept': 'application/json'},
    ),
  );
  final CookieJar _cookieJar = CookieJar();
  String _baseUrl = kDefaultApiBase;

  Future<void> init() async {
    _dio.interceptors.clear();
    _dio.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) {
      options.baseUrl = _baseUrl;
      return handler.next(options);
    }));
    _dio.interceptors.add(CookieManager(_cookieJar));
    final prefs = await SharedPreferences.getInstance();
    _baseUrl = _normalizeBaseUrl(prefs.getString(_prefsKeyBaseUrl) ?? kDefaultApiBase);
  }

  Future<void> setBaseUrl(String url) async {
    _baseUrl = _normalizeBaseUrl(url);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefsKeyBaseUrl, url);
  }

  String get baseUrl => _baseUrl;

  Future<Response<T>> get<T>(String path, {Map<String, dynamic>? query}) {
    return _dio.get<T>(path, queryParameters: query);
  }

  Future<Response<T>> post<T>(String path, {dynamic data}) {
    return _dio.post<T>(path, data: data);
  }

  Future<Response<T>> put<T>(String path, {dynamic data}) {
    return _dio.put<T>(path, data: data);
  }

  String _normalizeBaseUrl(String raw) {
    var url = raw.trim();
    if (url.isEmpty) return kDefaultApiBase;
    // Ensure scheme
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://$url';
    }
    // If no port specified, default to 4000
    try {
      final parsed = Uri.parse(url);
      if (parsed.hasPort) return url;
      return parsed.replace(port: 4000).toString();
    } catch (_) {
      return url;
    }
  }
}



