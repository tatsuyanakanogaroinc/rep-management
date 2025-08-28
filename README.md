# SNS経営管理システム (SMS - SNS Management System)

招待制SNSサービスの経営管理をデジタル化し、リアルタイムでのデータ可視化と意思決定の高速化を実現するシステムです。

## 技術スタック

- **Frontend**: Next.js 14 (App Router), TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: Zustand, TanStack Query
- **Charts**: Recharts

## 主要機能

- 📊 リアルタイムダッシュボード
- 📝 日報機能（AI音声入力対応）
- 👥 顧客管理
- 💰 支出管理・承認フロー
- 🎯 KPI・目標設定
- 📈 予実管理
- 🔮 AI予測・アラート機能

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. データベースを作成後、`supabase-schema.sql` を実行
3. Supabaseの設定から API keys を取得

### 3. 環境変数の設定

`.env.local` ファイルを作成し、以下を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. データベース初期化

```bash
# Supabaseにスキーマを適用
# Supabase Dashboard の SQL Editor で supabase-schema.sql を実行
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
├── components/            # React コンポーネント
│   ├── ui/               # shadcn/ui コンポーネント
│   └── features/         # 機能別コンポーネント
├── lib/                  # ユーティリティ・設定
├── types/                # TypeScript型定義
├── hooks/                # カスタムフック
└── store/                # 状態管理
```

## 開発フェーズ

### Phase 1: MVP (完了)
- [x] プロジェクト構造とNext.js 14セットアップ
- [x] Supabaseプロジェクト作成とデータベース設計
- [ ] 認証システム実装
- [ ] 基本的なCRUD機能
- [ ] 基本ダッシュボード

### Phase 2: 分析機能
- [ ] コホート分析
- [ ] ユニットエコノミクス
- [ ] グラフ機能強化

### Phase 3: AI機能
- [ ] 予測機能
- [ ] 異常検知
- [ ] レコメンデーション

### Phase 4: 最適化
- [ ] パフォーマンス改善
- [ ] UI/UX改善
- [ ] テスト強化

## ユーザーロール

- **Member**: 実績入力・閲覧、日報入力
- **Manager**: 全機能、目標/KPI設定、予算設定、承認機能
- **Admin**: システム管理、ユーザー管理、マスタデータ管理

## API仕様

REST API エンドポイント:

- `GET/POST /api/reports` - 日報管理
- `GET/POST /api/customers` - 顧客管理
- `GET/POST /api/expenses` - 支出管理
- `GET /api/analytics/*` - 分析データ
- `GET /api/dashboard/*` - ダッシュボードデータ

## ライセンス

このプロジェクトは社内システムです。
