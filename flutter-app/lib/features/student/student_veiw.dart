import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:my_app/features/student/student_cubit.dart';
import 'package:my_app/features/student/student_state.dart';
import 'package:my_app/shared/app_colours.dart';
import 'package:my_app/shared/typography/text_style.dart';
import 'package:my_app/shared/widgets/cards/app_card.dart';
import 'package:my_app/shared/widgets/widgets.dart';
import 'package:my_app/features/common/profile_view.dart';
import 'package:my_app/services/auth_service.dart';
import 'package:my_app/features/login/login_view.dart';
import 'package:my_app/services/api_client.dart';

class StudentView extends StatefulWidget {
  const StudentView({super.key});

  @override
  State<StudentView> createState() => _StudentViewState();
}

class _StudentViewState extends State<StudentView>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  final _api = ApiClient();

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

    // Load data for student 'student1'
    context.read<StudentCubit>().loadData('student1');
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<StudentCubit, StudentState>(
      builder: (context, state) {
        if (state.isLoading) {
          return Scaffold(
            backgroundColor: BaseColors.white,
            body: const Center(child: CircularProgressIndicator()),
          );
        }

        if (state.error != null) {
          return Scaffold(
            backgroundColor: BaseColors.white,
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    state.error!,
                    style: BaseTextStyle.bodyLarge
                        .copyWith(color: Colors.grey[600]),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () =>
                        context.read<StudentCubit>().loadData('student1'),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          );
        }

        return Scaffold(
          backgroundColor: BaseColors.white,
          appBar: AppBar(
            title: Text(
              'Student Dashboard',
              style: BaseTextStyle.titleLarge.copyWith(
                color: Colors.black87,
                fontWeight: FontWeight.w600,
              ),
            ),
            backgroundColor: BaseColors.white,
            foregroundColor: Colors.black87,
            elevation: 0,
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_none_rounded),
                onPressed: _showNotificationsPopup,
                tooltip: 'Notifications',
              ),
              PopupMenuButton<String>(
                onSelected: (v) async {
                  if (v == 'profile') {
                    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProfileView()));
                  } else if (v == 'logout') {
                    await AuthService().logout();
                    if (!mounted) return;
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const LoginView()),
                      (route) => false,
                    );
                  }
                },
                itemBuilder: (_) => const [
                  PopupMenuItem(value: 'profile', child: Text('Profile')),
                  PopupMenuItem(value: 'logout', child: Text('Logout')),
                ],
              ),
            ],
          ),
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
                      // Header
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: BaseColors.primary.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            Icon(
                              Icons.school_rounded,
                              size: 48,
                              color: BaseColors.primary,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Welcome, Student!',
                              style: BaseTextStyle.headlineSmall.copyWith(
                                color: Colors.black87,
                                fontWeight: FontWeight.w600,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Your weekly schedule and updates',
                              style: BaseTextStyle.bodyLarge.copyWith(
                                color: Colors.grey[600],
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                      // Timetable Table
                      Text('This Week\'s Timetable', style: BaseTextStyle.titleLarge.copyWith(color: Colors.black87, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 16),
                      _TimetableTable(entries: state.timetables),
                      const SizedBox(height: 32),
                      // Notifications Section
                      Text(
                        'Notifications',
                        style: BaseTextStyle.titleLarge.copyWith(
                          color: Colors.black87,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 16),
                      ...state.notifications.map((notification) => Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: AppCard(
                              child: ListTile(
                                leading: Icon(
                                  _getNotificationIcon(notification['type']),
                                  color: _getNotificationColor(
                                      notification['type']),
                                ),
                                title: Text(
                                  notification['title'],
                                  style: BaseTextStyle.titleMedium.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                subtitle: Text(
                                  notification['message'],
                                  style: BaseTextStyle.bodyMedium.copyWith(
                                    color: Colors.grey[600],
                                  ),
                                ),
                                trailing: Text(
                                  notification['date'],
                                  style: BaseTextStyle.bodySmall.copyWith(
                                    color: Colors.grey[500],
                                  ),
                                ),
                              ),
                            ),
                          )),
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

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'warning':
        return Icons.warning_amber_rounded;
      case 'info':
        return Icons.info_outline_rounded;
      case 'urgent':
        return Icons.priority_high_rounded;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _getNotificationColor(String type) {
    switch (type) {
      case 'warning':
        return BaseColors.warning;
      case 'info':
        return BaseColors.info;
      case 'urgent':
        return BaseColors.danger;
      default:
        return Colors.grey;
    }
  }
}

class _TimetableTable extends StatelessWidget {
  final List<Map<String, dynamic>> entries;
  const _TimetableTable({required this.entries});

  static const List<String> _dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) {
      return const Text('No timetable found');
    }
    final daysSet = <String>{};
    int maxPeriod = 0;
    for (final e in entries) {
      final d = (e['day'] ?? '').toString();
      if (d.isNotEmpty) daysSet.add(d);
      final p = (e['period'] is int) ? e['period'] as int : int.tryParse('${e['period'] ?? 0}') ?? 0;
      if (p > maxPeriod) maxPeriod = p;
    }
    final days = _dayOrder.where(daysSet.contains).toList() + daysSet.where((d) => !_dayOrder.contains(d)).toList();
    final columns = <DataColumn>[
      const DataColumn(label: Text('Day')),
      ...List.generate(maxPeriod, (i) => DataColumn(label: Text('P${i+1}'))),
    ];
    final rows = days.map((day) {
      final cells = <DataCell>[
        DataCell(Text(day)),
        ...List.generate(maxPeriod, (i) {
          final period = i + 1;
          final cellEntries = entries.where((e) => (e['day'] ?? '') == day && ((e['period'] ?? 0) == period)).toList();
          if (cellEntries.isEmpty) return const DataCell(Text('-'));
          final e = cellEntries.first;
          final subject = (e['subject'] ?? '').toString();
          final room = (e['room'] ?? '').toString();
          return DataCell(Text(subject.isEmpty ? room : '$subject\n$room'));
        })
      ];
      return DataRow(cells: cells);
    }).toList();
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(columns: columns, rows: rows, headingRowHeight: 40, dataRowMinHeight: 40, dataRowMaxHeight: 64),
    );
  }
}

extension on _StudentViewState {
  void _showNotificationsPopup() {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) {
        return FutureBuilder(
          future: _api.get('/api/notifications'),
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const SizedBox(height: 240, child: Center(child: CircularProgressIndicator()));
            }
            if (snapshot.hasError) {
              return Padding(
                padding: const EdgeInsets.all(16),
                child: Text('Failed to load notifications: ${snapshot.error}'),
              );
            }
            final data = (snapshot.data?.data as List<dynamic>? ?? []);
            if (data.isEmpty) {
              return const SizedBox(height: 160, child: Center(child: Text('No notifications')));
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              itemCount: data.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final n = data[i] as Map<String, dynamic>;
                return ListTile(
                  leading: const Icon(Icons.notifications_outlined),
                  title: Text((n['title'] ?? 'Notification').toString()),
                  subtitle: Text((n['message'] ?? '').toString()),
                  trailing: Text(((n['createdAt'] ?? '').toString()).substring(0, 10)),
                );
              },
            );
          },
        );
      },
    );
  }
}
