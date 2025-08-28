# 社内専用SNS経営管理システム

Last updated: 2025-01-28

## システム概要

このシステムは **社内専用** です。一般会員登録は無効になっており、事前に登録されたメンバーのみがアクセス可能です。

## 環境変数

- `NEXT_PUBLIC_SUPABASE_URL`: https://nykqhkilrhoavelillqw.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: [Supabase Anon Key]

## システム機能

### アクセス制御
- [x] 一般会員登録を削除
- [x] signup ページはログインページにリダイレクト
- [x] 社内専用メッセージを表示

### ユーザー管理
- [ ] 事前登録ユーザーの作成
- [ ] 管理者・マネージャー・メンバー権限の設定

## 事前登録ユーザー作成手順

1. `create-admin-users.sql` を参照
2. Supabase Dashboard でユーザーを手動作成
3. SQLでユーザープロファイルを設定

## アクセス URL

- `/` - ランディングページ（社内専用表示）
- `/login` - ログインページ
- `/signup` - 自動でログインページにリダイレクト
- `/debug` - システム状況確認（開発用）