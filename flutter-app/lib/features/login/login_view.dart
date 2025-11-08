import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:my_app/features/faculty/faculty_view.dart';
import 'package:my_app/features/home/home_view.dart';
import 'package:my_app/features/login/login_cubit.dart';
import 'package:my_app/features/login/login_state.dart';
import 'package:my_app/features/student/student_view.dart';
import 'package:my_app/shared/app_colours.dart';
import 'package:my_app/shared/typography/text_style.dart';

import 'package:my_app/shared/widgets/widgets.dart';
import 'package:my_app/services/api_client.dart';

class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> with TickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LoginCubit, LoginState>(
      builder: (context, state) {
        if (state.isAuthenticated) {
          // Navigate to dashboard based on role (placeholder for now)
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              if (state.authenticatedRole == UserRole.student) {
                Navigator.pushReplacement(
                  context,
                  PageRouteBuilder(
                    pageBuilder: (context, animation, secondaryAnimation) =>
                        const StudentView(),
                    transitionsBuilder:
                        (context, animation, secondaryAnimation, child) {
                      return FadeTransition(opacity: animation, child: child);
                    },
                  ),
                );
              } else if (state.authenticatedRole == UserRole.faculty) {
                Navigator.pushReplacement(
                  context,
                  PageRouteBuilder(
                    pageBuilder: (context, animation, secondaryAnimation) =>
                        const FacultyView(),
                    transitionsBuilder:
                        (context, animation, secondaryAnimation, child) {
                      return FadeTransition(opacity: animation, child: child);
                    },
                  ),
                );
              }
            }
          });
          return const SizedBox.shrink();
        }

        return Scaffold(
          backgroundColor: BaseColors.white,
          body: SafeArea(
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: () async {
                          final api = ApiClient();
                          final ctrl = TextEditingController(text: api.baseUrl);
                          await showDialog(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Server Settings'),
                              content: TextField(
                                controller: ctrl,
                                decoration: const InputDecoration(labelText: 'API Base URL'),
                              ),
                              actions: [
                                TextButton(onPressed: ()=>Navigator.pop(ctx), child: const Text('Cancel')),
                                ElevatedButton(onPressed: () async { await ApiClient().setBaseUrl(ctrl.text.trim()); if (ctx.mounted) Navigator.pop(ctx); }, child: const Text('Save')),
                              ],
                            ),
                          );
                          setState((){});
                        },
                        child: const Text('Server Settings'),
                      ),
                      const SizedBox(height: 24),
                      Icon(
                        Icons.schedule_rounded,
                        size: 80,
                        color: BaseColors.primary,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Schedule Sentinel',
                        style: BaseTextStyle.headlineMedium.copyWith(
                          color: Colors.black87,
                          fontWeight: FontWeight.w600,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Access your timetable and schedules',
                        style: BaseTextStyle.bodyLarge.copyWith(
                          color: Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 40),
                      // Role Selection
                      Text(
                        'Select Role',
                        style: BaseTextStyle.titleMedium.copyWith(
                          color: Colors.black87,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () => context
                                  .read<LoginCubit>()
                                  .selectRole(UserRole.student),
                              icon: Icon(Icons.school_rounded,
                                  color: state.selectedRole == UserRole.student
                                      ? Colors.white
                                      : BaseColors.primary),
                              label: Text(
                                'Student',
                                style: BaseTextStyle.titleMedium.copyWith(
                                  color: state.selectedRole == UserRole.student
                                      ? Colors.white
                                      : BaseColors.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor:
                                    state.selectedRole == UserRole.student
                                        ? BaseColors.primary
                                        : Colors.transparent,
                                foregroundColor:
                                    state.selectedRole == UserRole.student
                                        ? Colors.white
                                        : BaseColors.primary,
                                side: state.selectedRole == UserRole.student
                                    ? null
                                    : BorderSide(color: BaseColors.primary),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(
                                    vertical: 16, horizontal: 24),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () => context
                                  .read<LoginCubit>()
                                  .selectRole(UserRole.faculty),
                              icon: Icon(Icons.person_rounded,
                                  color: state.selectedRole == UserRole.faculty
                                      ? Colors.white
                                      : BaseColors.primary),
                              label: Text(
                                'Faculty',
                                style: BaseTextStyle.titleMedium.copyWith(
                                  color: state.selectedRole == UserRole.faculty
                                      ? Colors.white
                                      : BaseColors.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor:
                                    state.selectedRole == UserRole.faculty
                                        ? BaseColors.primary
                                        : Colors.transparent,
                                foregroundColor:
                                    state.selectedRole == UserRole.faculty
                                        ? Colors.white
                                        : BaseColors.primary,
                                side: state.selectedRole == UserRole.faculty
                                    ? null
                                    : BorderSide(color: BaseColors.primary),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(
                                    vertical: 16, horizontal: 24),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),
                      if (state.selectedRole != null) ...[
                        AppTextField(
                          controller: _usernameController,
                          label: state.selectedRole == UserRole.student ? 'Registration Number' : 'Email or Teacher ID',
                          hint: state.selectedRole == UserRole.student ? 'e.g., 21CS1001' : 'e.g., t001 or faculty@college.edu',
                          prefixIcon: Icons.person_outline_rounded,
                          keyboardType: TextInputType.text,
                        ),
                        const SizedBox(height: 16),
                        AppTextField(
                          controller: _passwordController,
                          label: 'Password',
                          hint: 'Enter your password',
                          prefixIcon: Icons.lock_outline_rounded,
                          obscureText: true,
                        ),
                        const SizedBox(height: 24),
                        if (state.error != null) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0x1AFF0000),
                              borderRadius: BorderRadius.circular(8),
                              border:
                                  Border.all(color: const Color(0x4DFF0000)),
                            ),
                            child: Text(
                              state.error!,
                              style: BaseTextStyle.bodyMedium
                                  .copyWith(color: Colors.red[700]),
                              textAlign: TextAlign.center,
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                        SizedBox(
                          height: 50,
                          child: AppPrimaryButton(
                            label: state.isLoading ? 'Logging in...' : 'Login',
                            icon: state.isLoading ? null : Icons.login_rounded,
                            isLoading: state.isLoading,
                            isFullWidth: true,
                            onPressed: state.isLoading
                                ? null
                                : () => context.read<LoginCubit>().login(
                                      _usernameController.text.trim(),
                                      _passwordController.text,
                                    ),
                          ),
                        ),
                      ] else ...[
                        const SizedBox(height: 100),
                        Text(
                          'Please select a role to continue',
                          style: BaseTextStyle.bodyMedium
                              .copyWith(color: Colors.grey[600]),
                          textAlign: TextAlign.center,
                        ),
                      ],
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
