import 'package:flutter/material.dart';
import 'package:my_app/shared/widgets/buttons/app_text_button.dart';

/// Custom dialog with consistent styling
class AppDialog extends StatelessWidget {
  const AppDialog({
    required this.title,
    required this.content,
    this.icon,
    this.primaryButtonLabel = 'OK',
    this.secondaryButtonLabel,
    this.onPrimaryPressed,
    this.onSecondaryPressed,
    super.key,
  });

  final String title;
  final String content;
  final IconData? icon;
  final String primaryButtonLabel;
  final String? secondaryButtonLabel;
  final VoidCallback? onPrimaryPressed;
  final VoidCallback? onSecondaryPressed;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      title: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, size: 28),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      content: Text(
        content,
        style: const TextStyle(
          fontSize: 16,
          height: 1.6,
        ),
      ),
      actions: [
        if (secondaryButtonLabel != null)
          AppTextButton(
            onPressed: onSecondaryPressed ?? () => Navigator.pop(context),
            label: secondaryButtonLabel!,
          ),
        AppTextButton(
          onPressed: onPrimaryPressed ?? () => Navigator.pop(context),
          label: primaryButtonLabel,
        ),
      ],
    );
  }

  /// Show confirmation dialog
  static Future<bool?> showConfirmation(
    BuildContext context, {
    required String title,
    required String content,
    IconData? icon = Icons.warning_amber_rounded,
    String confirmLabel = 'Confirm',
    String cancelLabel = 'Cancel',
  }) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AppDialog(
        title: title,
        content: content,
        icon: icon,
        primaryButtonLabel: confirmLabel,
        secondaryButtonLabel: cancelLabel,
        onPrimaryPressed: () => Navigator.pop(context, true),
        onSecondaryPressed: () => Navigator.pop(context, false),
      ),
    );
  }

  /// Show information dialog
  static Future<void> showInfo(
    BuildContext context, {
    required String title,
    required String content,
    IconData? icon = Icons.info_outline_rounded,
    String buttonLabel = 'OK',
  }) {
    return showDialog(
      context: context,
      builder: (context) => AppDialog(
        title: title,
        content: content,
        icon: icon,
        primaryButtonLabel: buttonLabel,
      ),
    );
  }

  /// Show error dialog
  static Future<void> showError(
    BuildContext context, {
    required String title,
    required String content,
    String buttonLabel = 'OK',
  }) {
    return showDialog(
      context: context,
      builder: (context) => AppDialog(
        title: title,
        content: content,
        icon: Icons.error_outline_rounded,
        primaryButtonLabel: buttonLabel,
      ),
    );
  }
}
