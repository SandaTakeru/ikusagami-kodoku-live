// ========================================
// キャラクターデータ定義
// ========================================

/**
 * キャラクターデータベース
 * キー: キャラクターID（番号）
 * 値: { name, nameEn, icon, iconEn, color, volume }
 *   - name: キャラクター名（フルネーム・日本語）
 *   - nameEn: キャラクター名（フルネーム・英語）
 *   - icon: 地図上に表示する1文字アイコン（日本語）
 *   - iconEn: 地図上に表示する1文字アイコン（英語）
 *   - color: 表示色（カラーコード）
 *   - volume: 登場巻数（ネタバレフィルタ用）
 */
const CHARACTERS = {
    // ========== 主要キャラクター（1巻） ==========
    108: { name: '嵯峨 愁二郎',   nameEn: 'Saga Shujiro',         icon: '愁', iconEn: 'SS', color: '#C73E3A', volume: 1 },
    120: { name: '香月 双葉',     nameEn: 'Katsuki Futaba',       icon: '双', iconEn: 'KF', color: '#E9A368', volume: 1 },
    99:  { name: '柘植 響陣',     nameEn: 'Tsuge Kyojin',         icon: '響', iconEn: 'TK', color: '#316745', volume: 1 },

    // ========== 1巻登場キャラクター ==========
    199: { name: '祇園 三助',     nameEn: 'Gion Sansuke',         icon: '三', iconEn: 'GS', color: '#D66A35', volume: 1 },
    7:   { name: '化野 四蔵',     nameEn: 'Adashino Shikura',       icon: '四', iconEn: 'AS', color: '#674598', volume: 1 },
    168: { name: '衣笠 彩八',     nameEn: 'Kinugasa Iroha',    icon: '八', iconEn: 'KI', color: '#5F7C8A', volume: 1 },

    4:   { name: '安藤 神兵衛',   nameEn: 'Andou Jinbei',          icon: '安', iconEn: 'AJ', color: '#00A0BC', volume: 1 },
    107: { name: '立川 幸右衛門',   nameEn: 'Tachikawa Kouemon',      icon: '考', iconEn: 'TK', color: '#7B3F00', volume: 1 },
    277: { name: 'カムイコチャ',   nameEn: 'Kamuikotcha',          icon: 'カ', iconEn: 'K', color: '#00A0BC', volume: 1 },
    19:  { name: '菊臣 右京',     nameEn: 'Kikuomi Ukyo',         icon: '右', iconEn: 'KU', color: '#4C6CB3', volume: 1 },
    66:  { name: '貫地谷 無骨',   nameEn: 'Kanjiya Bukotsu',      icon: '無', iconEn: 'KB', color: '#3E4145', volume: 1 },
    269: { name: '狭山 進次郎',   nameEn: 'Sayama Shinjiro',      icon: '進', iconEn: 'SS', color: '#E6B422', volume: 1 },
    30:  { name: '番場 大悟郎',   nameEn: 'Bamba Daigoro',        icon: '番', iconEn: 'BD', color: '#D57835', volume: 1 },
    230: { name: '赤山 宋適',   nameEn: 'Akayama Souteki',      icon: '宋', iconEn: 'AS', color: '#7B3F00', volume: 1 },
    231: { name: '川本 寅松',   nameEn: 'Kawamoto Toramatsu',   icon: '寅', iconEn: 'KT', color: '#005D7B', volume: 1 },

    // ========== 2巻登場キャラクター ==========
    292: { name: '蹴上 甚六',     nameEn: 'Keage Jinroku',        icon: '六', iconEn: 'KJ', color: '#6A8D3A', volume: 2 },
    142: { name: '岡部 幻刀斎',   nameEn: 'Okabe Gentosai',       icon: '幻', iconEn: 'OG', color: '#7A5C3E', volume: 2 },
    92:  { name: 'ギルバート',    nameEn: 'Gilbert Capel Coleman', icon: 'ギ', iconEn: 'GC', color: '#D7A233', volume: 2 },
    
    48:  { name: '宝蔵院 袁駿',   nameEn: 'Hozoin Enshun',        icon: '袁', iconEn: 'HE', color: '#44916D', volume: 2 },
    202: { name: '坂巻 伝内',   nameEn: 'Sakamaki Dennai',        icon: '伝', iconEn: 'SD', color: '#A0D8D0', volume: 2 },

    // ========== 3巻登場キャラクター ==========
    1:  { name: '軸丸 鈴介',       nameEn: 'Jikumaru Suzusuke',         icon: '鈴', iconEn: 'JS', color: '#4C8E6B', volume: 3 },
    11:  { name: '伊刈 武虎',   nameEn: 'Ikari Taketora',           icon: '武', iconEn: 'IT', color: '#4C6B8E', volume: 3 },
    24:  { name: '中桐 傭馬',       nameEn: 'Nakagiri Youma',         icon: '傭', iconEn: 'NY', color: '#D0485C', volume: 3 },
    84:  { name: '郷間 玄治',       nameEn: 'Gouma Genji',         icon: '玄', iconEn: 'GG', color: '#8E4C4C', volume: 3 },
    111: { name: '秋津 楓',       nameEn: 'Akitsu Kaede',         icon: '楓', iconEn: 'AK', color: '#D0485C', volume: 3 },
    139: { name: '陸乾',          nameEn: 'Riku Ken',             icon: '陸', iconEn: 'RK', color: '#8E4C4C', volume: 3 },
    160: { name: '轟 重左衛門',     nameEn: 'Todoroki Juuzaemon',   icon: '重', iconEn: 'TJ', color: '#3E4C4C', volume: 3 },
    161: { name: '竿本 嘉一郎',   nameEn: 'Saomoto Kaichiro',   icon: '嘉', iconEn: 'SK', color: '#4C6B8E', volume: 3 },
    163: { name: '竿本 勇次郎',   nameEn: 'Saomoto Yujiro',     icon: '勇', iconEn: 'SY', color: '#4C6B8E', volume: 3 },
    186: { name: '石井 音三郎',     nameEn: 'Ishii Otozaburo',       icon: '音', iconEn: 'IO', color: '#6B4C8E', volume: 3 },
    215: { name: '眠',            nameEn: 'Mifty',                  icon: '眠', iconEn: 'M', color: '#8B5A96', volume: 3 },
    251: { name: '自見 隼人',     nameEn: 'Jiken Hayato',          icon: '隼', iconEn: 'JH', color: '#4D8B55', volume: 3 },

    222: { name: '天明 刀弥',     nameEn: 'Tenmyo Toya',          icon: '刀', iconEn: 'TT', color: '#D8A237', volume: 3 }
};

/**
 * キャラクター表示順序（定義順を保持）
 * JavaScriptのオブジェクトは数値キーを自動的にソートするため、
 * 表示順序を明示的に指定する配列を用意
 */
const CHARACTER_ORDER = [
    // 主要キャラクター（1巻）
    108, 120, 99, 269,
    // 京八流キャラクター
    199, 7, 292, 168,
    // 準レギュラーキャラクター
    19, 66, 92, 142, 222, 277,
    // モブ以上
    1, 4, 11, 24, 30, 48, 84, 107, 111, 139, 160, 161, 163, 186, 202, 215, 251,
];

/**
 * IDからキャラクター情報を取得
 * @param {number} id - キャラクターID
 * @returns {Object|null} キャラクター情報、存在しない場合はnull
 */
function getCharacterById(id) {
    return CHARACTERS[id] || null;
}

/**
 * 指定巻数までのキャラクターIDリストを取得（定義順）
 * @param {number} maxVolume - 最大巻数
 * @returns {Array} キャラクターIDの配列（定義順）
 */
function getCharacterIdsByVolume(maxVolume) {
    return CHARACTER_ORDER.filter(id => {
        const char = CHARACTERS[id];
        return char && char.volume <= maxVolume;
    });
}

/**
 * 全キャラクターIDのリストを取得（定義順）
 * @returns {Array} キャラクターIDの配列（定義順）
 */
function getAllCharacterIds() {
    return [...CHARACTER_ORDER];
}
