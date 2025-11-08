import 'package:flutter/material.dart';
import 'package:my_app/services/api_client.dart';
import 'package:my_app/shared/typography/text_style.dart';

class NotificationsView extends StatefulWidget {
  const NotificationsView({super.key});

  @override
  State<NotificationsView> createState() => _NotificationsViewState();
}

class _NotificationsViewState extends State<NotificationsView> {
  final _api = ApiClient();
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Map<String, dynamic>>> _load() async {
    final res = await _api.get('/api/notifications');
    final list = (res.data as List<dynamic>);
    return list.map((n) => {
      'title': n['title'] ?? 'Notification',
      'message': n['message'] ?? '',
      'date': (n['createdAt'] ?? '').toString().substring(0,10),
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            if (snapshot.hasError) {
              return Center(child: Text('Failed: ${snapshot.error}', style: BaseTextStyle.bodyMedium));
            }
            return const Center(child: CircularProgressIndicator());
          }
          final items = snapshot.data!;
          if (items.isEmpty) {
            return const Center(child: Text('No notifications yet'));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final n = items[i];
              return ListTile(
                title: Text(n['title'], style: BaseTextStyle.titleMedium),
                subtitle: Text(n['message']),
                trailing: Text(n['date'], style: BaseTextStyle.bodySmall),
              );
            },
          );
        },
      ),
    );
  }
}





