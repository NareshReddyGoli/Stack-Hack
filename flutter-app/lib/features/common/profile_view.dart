import 'package:flutter/material.dart';
import 'package:my_app/services/auth_service.dart';
import 'package:my_app/features/login/login_view.dart';
import 'package:my_app/shared/typography/text_style.dart';

class ProfileView extends StatefulWidget {
  const ProfileView({super.key});

  @override
  State<ProfileView> createState() => _ProfileViewState();
}

class _ProfileViewState extends State<ProfileView> {
  final _auth = AuthService();
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _auth.me();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            if (snapshot.hasError) {
              return Center(child: Text('Failed: ${snapshot.error}', style: BaseTextStyle.bodyMedium));
            }
            return const Center(child: CircularProgressIndicator());
          }
          final me = snapshot.data!;
          final role = me['role'] ?? '';
          final user = (me['user'] as Map<String, dynamic>? ?? {});
          return Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Role: $role', style: BaseTextStyle.titleMedium),
                const SizedBox(height: 8),
                Text('Name: ${user['name'] ?? ''}'),
                if (user['email'] != null) ...[
                  const SizedBox(height: 8),
                  Text('Email: ${user['email']}'),
                ],
                if (user['registration_no'] != null) ...[
                  const SizedBox(height: 8),
                  Text('Reg No: ${user['registration_no']}'),
                ],
                const Spacer(),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      await _auth.logout();
                      if (!mounted) return;
                      Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(builder: (_) => const LoginView()),
                        (route) => false,
                      );
                    },
                    icon: const Icon(Icons.logout_rounded),
                    label: const Text('Logout'),
                  ),
                )
              ],
            ),
          );
        },
      ),
    );
  }
}





