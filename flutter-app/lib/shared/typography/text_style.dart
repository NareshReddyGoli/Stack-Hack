import 'package:flutter/material.dart';
import 'package:my_app/shared/typography/font_weight.dart';

/// All Text Styles
abstract class BaseTextStyle {
  /// Base text style
  static const _baseSfPro = TextStyle(
    fontStyle: FontStyle.normal,
    fontWeight: BaseFontWeight.regular,
  );

  /// Display large text style
  static TextStyle get displayLarge => _baseSfPro.copyWith(
        fontSize: 56,
      );

  /// Display medium text style
  static TextStyle get displayMedium => _baseSfPro.copyWith(
        fontSize: 45,
      );

  /// Display small text style
  static TextStyle get displaySmall => _baseSfPro.copyWith(
        fontSize: 38,
      );

  /// Headline large text style
  static TextStyle get headlineLarge => _baseSfPro.copyWith(
        fontSize: 32,
      );

  /// Headline medium text style
  static TextStyle get headlineMedium => _baseSfPro.copyWith(
        fontSize: 26,
      );

  /// Headline small text style
  static TextStyle get headlineSmall => _baseSfPro.copyWith(
        fontSize: 24,
      );

  /// Title large text style
  static TextStyle get titleLarge => _baseSfPro.copyWith(
        fontSize: 18,
        fontWeight: BaseFontWeight.semiBold,
      );

  /// Title medium text style
  static TextStyle get titleMedium => _baseSfPro.copyWith(
        fontSize: 16,
        fontWeight: BaseFontWeight.semiBold,
      );

  /// Title small text style
  static TextStyle get titleSmall => _baseSfPro.copyWith(
        fontSize: 14,
        fontWeight: BaseFontWeight.semiBold,
      );

  /// Body large text style
  static TextStyle get bodyLarge => _baseSfPro.copyWith(
        fontSize: 16,
        fontWeight: BaseFontWeight.medium,
        letterSpacing: 0,
      );

  /// Body medium text style
  static TextStyle get bodyMedium => _baseSfPro.copyWith(
        fontSize: 14,
        fontWeight: BaseFontWeight.medium,
      );

  /// Body small text style
  static TextStyle get bodySmall => _baseSfPro.copyWith(
        fontSize: 12,
        fontWeight: BaseFontWeight.medium,
        letterSpacing: 0,
      );

  /// Label large text style
  static TextStyle get labelLarge => _baseSfPro.copyWith(
        fontSize: 14,
        fontWeight: BaseFontWeight.medium,
        letterSpacing: .5,
      );

  /// Label medium text style
  static TextStyle get labelMedium => _baseSfPro.copyWith(
        fontSize: 13,
        fontWeight: BaseFontWeight.medium,
        letterSpacing: .1,
      );

  /// Label small text style
  static TextStyle get labelSmall => _baseSfPro.copyWith(
        fontSize: 12,
        fontWeight: BaseFontWeight.regular,
        letterSpacing: .5,
      );

  /// get TextTheme base on the typography color
  static TextTheme getTextTheme({Color? color}) => TextTheme(
        displayLarge: displayLarge.copyWith(color: color),
        displayMedium: displayMedium.copyWith(color: color),
        displaySmall: displaySmall.copyWith(color: color),
        headlineLarge: headlineLarge.copyWith(color: color),
        headlineMedium: headlineMedium.copyWith(color: color),
        headlineSmall: headlineSmall.copyWith(color: color),
        titleLarge: titleLarge.copyWith(color: color),
        titleMedium: titleMedium.copyWith(color: color),
        titleSmall: titleSmall.copyWith(color: color),
        bodyLarge: bodyLarge.copyWith(color: color),
        bodyMedium: bodyMedium.copyWith(color: color),
        bodySmall: bodySmall.copyWith(color: color),
        labelLarge: labelLarge.copyWith(color: color),
        labelMedium: labelMedium.copyWith(color: color),
        labelSmall: labelSmall.copyWith(color: color),
      );
}
