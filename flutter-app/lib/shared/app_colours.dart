import 'package:flutter/material.dart';

/// Color palette
abstract class BaseColors {
  /// White
  static const Color white = Colors.white;

  /// Transparent
  static const Color transparent = Colors.transparent;

  /// Disabled color
  static const Color disabled = Color(0xFF8894A8);

  /// Warning color
  static const Color info = Color(0xFF3264E4);

  /// Warning color
  static const Color warning = Color(0xFFFFAF20);

  /// Danger color
  static final Color danger = Color(0xFFE81A5C);

  /// Success color
  static final Color success = Color(0xFF02BB7F);

  /// Neutral color swatch
  static final neutral = MaterialColor(0xFF69778E, const {
    0: Color(0xFFFFFFFF),
    50: Color(0xFFF6F7F9),
    100: Color(0xFFECEEF2),
    200: Color(0xFFD6DAE1),
    300: Color(0xFFB2B9C7),
    400: Color(0xFF8894A8),
    500: Color(0xFF69778E),
    600: Color(0xFF546075),
    700: Color(0xFF444D60),
    800: Color(0xFF3B4251),
    900: Color(0xFF353A45),
    950: Color(0xFF16181D)
  });

  /// Primary color swatch - Professional Blue
  static const primary = MaterialColor(0xFF2196F3, {
    50: Color(0xFFE3F2FD),
    100: Color(0xFFBBDEFB),
    200: Color(0xFF90CAF9),
    300: Color(0xFF64B5F6),
    400: Color(0xFF42A5F5),
    500: Color(0xFF2196F3),
    600: Color(0xFF1E88E5),
    700: Color(0xFF1976D2),
    800: Color(0xFF1565C0),
    900: Color(0xFF0D47A1),
    950: Color(0xFF0A3D8F)
  });

  /// Secondary color swatch
  static const secondary = MaterialColor(0xFFFE9611, {
    50: Color(0xFFFFFAED),
    100: Color(0xFFFFF4D4),
    200: Color(0xFFFFE4A8),
    300: Color(0xFFFFD071),
    400: Color(0xFFFFB74A),
    500: Color(0xFFFE9611),
    600: Color(0xFFEF7A07),
    700: Color(0xFFC65C08),
    800: Color(0xFF94D490F),
    900: Color(0xFF7E3D10),
  });
}
