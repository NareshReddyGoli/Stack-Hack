import 'package:flutter/material.dart';
import 'package:my_app/shared/app_colours.dart';
import 'package:my_app/shared/typography/text_style.dart';

/// Namespace for Default Exp [ThemeData].
class BaseTheme {
  /// Light Theme
  static final light = ThemeData(
    brightness: Brightness.light,
    primarySwatch: BaseColors.primary,
    primaryColor: BaseColors.primary[500],
    scaffoldBackgroundColor: BaseColors.white,
    canvasColor: BaseColors.white,
    cardColor: BaseColors.white,
    dividerColor: BaseColors.neutral[200],
    disabledColor: BaseColors.neutral[500],
    hintColor: BaseColors.neutral[500],
    focusColor: BaseColors.primary[100],
    highlightColor: BaseColors.primary[50],
    splashColor: BaseColors.primary[100]?.withValues(alpha: 0.2),
    appBarTheme: AppBarTheme(
      backgroundColor: BaseColors.white,
      foregroundColor: BaseColors.neutral[950],
      elevation: 0,
      surfaceTintColor: Colors.transparent,
    ),
    textTheme: BaseTextStyle.getTextTheme(color: BaseColors.neutral[950]),
    colorScheme: ColorScheme.light(
      primary: BaseColors.primary[500]!,
      secondary: BaseColors.secondary[500]!,
      surface: BaseColors.white,
      error: BaseColors.danger,
      onPrimary: BaseColors.white,
      onSecondary: BaseColors.white,
      onSurface: BaseColors.neutral[950]!, // text primary
      onError: BaseColors.white,
      outline: BaseColors.neutral[400]!,
      outlineVariant: BaseColors.neutral[200]!,
      shadow: BaseColors.neutral[950]!,
      primaryContainer: BaseColors.primary[100]!,
      onPrimaryContainer: BaseColors.primary[900]!,
      secondaryContainer: BaseColors.secondary[100]!,
      onSecondaryContainer: BaseColors.secondary[900]!,
      surfaceContainerHighest: BaseColors.neutral[100]!,
      onSurfaceVariant: BaseColors.neutral[600]!,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: BaseColors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: BaseColors.neutral[300]!, width: 1),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: BaseColors.neutral[300]!, width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: BaseColors.primary[500]!, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: BaseColors.danger, width: 1),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: BaseColors.danger, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      hintStyle: TextStyle(color: BaseColors.neutral[500]),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        side: BorderSide(color: BaseColors.neutral[400]!, width: 1.5),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        foregroundColor: BaseColors.primary[500],
        minimumSize: const Size(0, 48), // Mobile touch target
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: BaseColors.primary[500],
        foregroundColor: BaseColors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        minimumSize: const Size(0, 48), // Mobile touch target
      ),
    ),
    cardTheme: CardThemeData(
      color: BaseColors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: BaseColors.neutral[200]!, width: 1),
      ),
      margin: const EdgeInsets.all(8),
    ),
  );

  /// Dark Theme
  static final dark = ThemeData(
    brightness: Brightness.dark,
    primarySwatch: BaseColors.primary,
    primaryColor: BaseColors.primary[400],
    scaffoldBackgroundColor: BaseColors.neutral[950],
    canvasColor: BaseColors.neutral[900],
    cardColor: BaseColors.neutral[800],
    dividerColor: BaseColors.neutral[700],
    disabledColor: BaseColors.neutral[500],
    hintColor: BaseColors.neutral[500],
    focusColor: BaseColors.primary[700],
    highlightColor: BaseColors.primary[800],
    splashColor: BaseColors.primary[700]?.withValues(alpha: 0.25),
    appBarTheme: AppBarTheme(
      backgroundColor: BaseColors.neutral[900],
      foregroundColor: BaseColors.neutral[950],
      elevation: 0,
    ),
    textTheme: BaseTextStyle.getTextTheme(color: BaseColors.neutral[0]),
    colorScheme: ColorScheme.dark(
        primary: BaseColors.primary[400]!,
        secondary: BaseColors.secondary[400]!,
        surface: BaseColors.neutral[900]!,
        error: BaseColors.danger,
        onPrimary: BaseColors.white,
        onSecondary: BaseColors.white,
        onSurface: BaseColors.neutral[950]!, // text primary
        onError: BaseColors.white,
        outline: BaseColors.neutral[700]),
  );
}
