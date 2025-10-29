# コード構造改善 (2025-10-20)

## 概要
VSCodeのパフォーマンス向上とAIによる管理の効率化のため、大きなJSファイルを機能別に分割しました。

## 変更内容

### 新規作成ファイル

#### 1. `js/utils/geometryUtils.js` (106行)
幾何計算に関するユーティリティ関数を集約
- `interpolateCoordinates()` - 2点間の線形補間
- `calculateDistance()` - Haversine公式による距離計算
- `calculateCumulativeDistances()` - ルート上の累積距離計算
- `getPositionAtDistance()` - 指定距離における位置取得

#### 2. `js/utils/interpolationUtils.js` (186行)
東海道ルート上での補間計算を担当
- `interpolateAlongTokaido()` - ルート上での2点間補間
- `findNearestPointOnLine()` - ライン上の最近接点探索
- `extractRouteSegment()` - ルートの部分抽出

### 変更ファイル

#### 3. `js/characterMarkers.js` (703行 → 426行)
**削減: 277行 (39%削減)**
- 幾何計算・補間ロジックをユーティリティに移動
- マーカー表示とタイムライン管理に専念
- 読み込み速度とメンテナンス性が向上

#### 4. `index.html`
スクリプト読み込み順序を論理的に再構成：
```html
<!-- Utility Functions -->
<script src="js/utils/geometryUtils.js"></script>
<script src="js/utils/interpolationUtils.js"></script>

<!-- Character Features -->
<script src="js/characterMarkers.js"></script>
<script src="js/characterTracking.js"></script>
<script src="js/characterFilter.js"></script>

<!-- UI Controls -->
<script src="js/timeControl.js"></script>
<script src="js/ui.js"></script>
<script src="js/main.js"></script>
```

## ファイル構造 (更新後)

```
js/
├── config.js (84行) - 設定・定数
├── map.js (166行) - 地図初期化
├── characterData.js (94行) - キャラクターデータ
├── routeDisplay.js (89行) - ルート表示
│
├── utils/
│   ├── geometryUtils.js (106行) - 幾何計算
│   └── interpolationUtils.js (186行) - 補間計算
│
├── characterMarkers.js (426行) - マーカー表示
├── characterTracking.js (383行) - トラッキング機能
├── characterFilter.js (215行) - フィルタ機能
│
├── timeControl.js (204行) - 時系列制御
├── ui.js (135行) - UI制御
└── main.js (81行) - メインエントリーポイント
```

## メリット

### 1. パフォーマンス向上
- ファイルサイズ削減により読み込み速度向上
- VSCodeの構文解析負荷軽減
- IntelliSenseの応答性改善

### 2. メンテナンス性向上
- 機能ごとに明確に分離
- 依存関係が視覚的に理解しやすい
- バグ修正時の影響範囲が限定的

### 3. AI管理の効率化
- ファイルが小さく、コンテキストに収まりやすい
- 機能単位での修正が容易
- コードレビューが効率的

## バックアップ

念のため、以下のバックアップを保持：
- `js/characterMarkers_old.js` - 分割前のオリジナル

動作確認後、不要であれば削除可能です。

## 動作確認

すべての機能が正常に動作することを確認済み：
- ✅ キャラクターマーカー表示
- ✅ ルート上での補間
- ✅ トラッキング機能
- ✅ 時系列アニメーション
