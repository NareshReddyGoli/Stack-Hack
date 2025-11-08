import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:my_app/features/faculty/faculty_cubit.dart';
import 'package:my_app/features/home/home_cubit.dart';
import 'package:my_app/features/login/login_cubit.dart';
import 'package:my_app/features/student/student_cubit.dart';
import 'package:my_app/features/startup/startup_view.dart';
import 'package:my_app/shared/theme/theme.dart';
import 'package:my_app/services/api_client.dart';

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    ApiClient().init();
    return MultiBlocProvider(
      providers: [
        BlocProvider<HomeCubit>(
          create: (context) => HomeCubit(),
        ),
        BlocProvider<LoginCubit>(
          create: (context) => LoginCubit(),
        ),
        BlocProvider<StudentCubit>(
          create: (context) => StudentCubit(),
        ),
        BlocProvider<FacultyCubit>(
          create: (context) => FacultyCubit(),
        ),
      ],
      child: MaterialApp(
        title: 'Schedule Sentinel',
        theme: BaseTheme.light,
        themeMode: ThemeMode.light,
        home: const StartupView(),
      ),
    );
  }
}
