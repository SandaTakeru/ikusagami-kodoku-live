# JavaScript ファイル構成の変更

## 変更日: 2025年10月16日

## 変更内容
コードベースが大きくなってきたため、JavaScriptファイルを機能別に分割し、管理しやすくしました。

## 新しいファイル構成

### `/js/` ディレクトリ
すべてのJavaScriptファイルを`js/`ディレクトリに移動し、以下の6つのファイルに分割しました：

#### 1. `config.js` (~60行)
- グローバル設定と定数
- 時間範囲（START_DATE, END_DATE）
- 再生速度オプション（SPEED_OPTIONS）
- アプリケーション状態管理（AppState）

#### 2. `characterData.js` (~100行)
- キャラクターデータベース（CHARACTERS）
- キャラクター表示順序（CHARACTER_ORDER）
- キャラクター検索・取得関数
  - `getCharacterById(id)`
  - `getCharacterIdsByVolume(maxVolume)`
  - `getAllCharacterIds()`

#### 3. `timeControl.js` (~160行)
- 時系列スライダーの制御
- 再生/一時停止機能
- アニメーション制御
- 速度調整機能
- 日時表示の更新

#### 4. `ui.js` (~100行)
- ハンバーガーメニュー
- ネタバレフィルタ
- 言語トグル
- インフォメーションリンク

#### 5. `characterFilter.js` (~190行)
- キャラクターフィルタUIの生成
- キャラクターの選択/解除
- 全選択/全解除機能
- 言語切り替え対応

#### 6. `main.js` (~40行)
- アプリケーションのエントリーポイント
- 各モジュールの初期化
- イベントハンドラの統合

## 旧ファイル
以下のファイルは`js/`ディレクトリへの移行により不要になりました：
- `app.js` (ルートディレクトリ)
- `characters.js` (ルートディレクトリ)

## ロード順序
`index.html`では以下の順序でファイルを読み込みます：

```html
<script src="js/config.js"></script>         <!-- 1. 設定 -->
<script src="js/characterData.js"></script>  <!-- 2. データ -->
<script src="js/timeControl.js"></script>    <!-- 3. 時系列制御 -->
<script src="js/ui.js"></script>              <!-- 4. UI制御 -->
<script src="js/characterFilter.js"></script><!-- 5. キャラクターフィルタ -->
<script src="js/main.js"></script>            <!-- 6. 初期化 -->
```

## 利点
1. **可読性向上**: 各ファイルが200行以下で、機能ごとに整理
2. **保守性向上**: 関連するコードがまとまっており、変更が容易
3. **モジュール化**: 機能が独立しており、テストやデバッグが簡単
4. **拡張性**: 新機能の追加が容易

## 動作
従来と同じ機能を提供します。内部構造の変更のみで、ユーザー体験に変更はありません。
