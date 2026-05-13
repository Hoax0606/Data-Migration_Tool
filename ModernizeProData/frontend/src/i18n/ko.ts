/**
 * 한국어 번역. 키는 점 표기법으로 영역 구분.
 * 추가 번역은 ja.ts / en.ts 에 동일 키로.
 */
export const ko = {
  // 공통
  'common.save': '저장',
  'common.cancel': '취소',
  'common.close': '닫기',
  'common.enabled': '활성',
  'common.disabled': '비활성',
  'common.signin': '로그인',
  'common.signout': '로그아웃',

  // Login
  'login.username': 'Username',
  'login.password': 'Password',
  'login.submit': '로그인',

  // Tabs
  'tab.dashboard': 'Dashboard',
  'tab.mapping': 'Mapping',
  'tab.versions': 'Versions',
  'tab.execution': 'Execution',
  'tab.artifacts': 'Artifacts',
  'tab.logs': 'Log viewer',
  'tab.settings': 'Settings',

  // Account profile
  'account.title': 'Account profile',
  'account.subtitle': 'Local account details. No external directory.',
  'account.username': 'Username',
  'account.role': 'Role',
  'account.lastSignIn': 'Last sign-in',
  'account.activeSession': 'Active session',
  'account.changePassword': '비밀번호 변경',
  'account.lastChanged': '마지막 변경',

  // Solution settings
  'solution.title': 'Solution settings',
  'solution.subtitle': '도구 전역 설정 · 모든 사이트에 적용',
  'solution.appearance': 'Appearance',
  'solution.language': '언어',
  'solution.theme': '테마',
  'solution.theme.light': 'Light',
  'solution.theme.dark': 'Dark',
  'solution.notifications': 'Notifications',
  'solution.notifications.desc': '인앱 알림(🔔) 사용 여부. 어떤 이벤트를 받을지는 Project Settings › Notifications 에서 관리합니다.',
  'solution.notifications.enable': 'Enable notifications',
  'solution.notifications.enableDesc': '끄면 모든 프로젝트의 인앱 알림이 일괄 비활성화됩니다.',
  'solution.external': 'External integrations',
  'solution.external.desc': '기본은 내장 스케줄러로 run 을 trigger 합니다. 운영팀이 기존 외부 스케줄러(Control-M / Airflow / Jenkins / cron)를 이미 쓰고 있어 그쪽으로 통합하고 싶을 때만 켜세요.',
  'solution.external.scheduler': 'Scheduler',
  'solution.external.cliPath': 'CLI path',
  'solution.external.apiEndpoint': 'API endpoint',
  'solution.external.apiToken': 'API token',
  'solution.external.syslog': 'Syslog forwarding',

  // About
  'about.title': 'About',
  'about.engine': 'Engine',
  'about.metaDb': 'Meta DB',
  'about.backend': 'Backend',
  'about.frontend': 'Frontend',
  'about.vendor': 'Vendor',
} as const;

export type TranslationKey = keyof typeof ko;
