import type { TranslationKey } from './ko';

/**
 * 日本語訳. 추후 팀원이 채워 넣을 수 있게 ko 와 동일 키 사용.
 */
export const ja: Record<TranslationKey, string> = {
  'common.save': '保存',
  'common.cancel': 'キャンセル',
  'common.close': '閉じる',
  'common.enabled': '有効',
  'common.disabled': '無効',
  'common.signin': 'サインイン',
  'common.signout': 'サインアウト',

  'login.username': 'Username',
  'login.password': 'Password',
  'login.submit': 'サインイン',

  'tab.dashboard': 'Dashboard',
  'tab.mapping': 'Mapping',
  'tab.versions': 'Versions',
  'tab.execution': 'Execution',
  'tab.artifacts': 'Artifacts',
  'tab.logs': 'Log viewer',
  'tab.settings': 'Settings',

  'account.title': 'アカウントプロフィール',
  'account.subtitle': 'ローカルアカウント詳細。外部ディレクトリなし。',
  'account.username': 'ユーザー名',
  'account.role': '役割',
  'account.lastSignIn': '最終サインイン',
  'account.activeSession': 'アクティブセッション',
  'account.changePassword': 'パスワード変更',
  'account.lastChanged': '最終変更',

  'solution.title': 'ソリューション設定',
  'solution.subtitle': 'ツール全体の設定 · すべてのサイトに適用',
  'solution.appearance': '外観',
  'solution.language': '言語',
  'solution.theme': 'テーマ',
  'solution.theme.light': 'ライト',
  'solution.theme.dark': 'ダーク',
  'solution.notifications': '通知',
  'solution.notifications.desc': 'アプリ内通知(🔔)の使用可否。受信イベントは Project Settings › Notifications で管理。',
  'solution.notifications.enable': '通知を有効化',
  'solution.notifications.enableDesc': 'オフにすると全プロジェクトのアプリ内通知が一括無効化されます。',
  'solution.external': '外部連携',
  'solution.external.desc': '既定では内蔵スケジューラーで run を trigger します。運用チームが既存の外部スケジューラー(Control-M / Airflow / Jenkins / cron)を既に使っていて統合する場合のみオンに。',
  'solution.external.scheduler': 'Scheduler',
  'solution.external.cliPath': 'CLI path',
  'solution.external.apiEndpoint': 'API endpoint',
  'solution.external.apiToken': 'API token',
  'solution.external.syslog': 'Syslog forwarding',

  'about.title': 'About',
  'about.engine': 'Engine',
  'about.metaDb': 'Meta DB',
  'about.backend': 'Backend',
  'about.frontend': 'Frontend',
  'about.vendor': 'Vendor',
};
