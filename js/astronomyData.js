// ========================================
// 天文データ（日出・日入・月齢・月出・月入）
// ========================================

/**
 * 明治11年(1878年)5月5日〜6月7日の天文データ
 * 各データはJST（日本標準時）で記録
 */
const ASTRONOMY_DATA = [
    { date: '1878-05-05', sunrise: '04:57', sunset: '18:40', moonAge: 2.94, moonrise: '08:52', moonset: '19:09' },
    { date: '1878-05-06', sunrise: '04:57', sunset: '18:41', moonAge: 3.94, moonrise: '09:42', moonset: '19:58' },
    { date: '1878-05-07', sunrise: '04:56', sunset: '18:42', moonAge: 4.94, moonrise: '10:31', moonset: '20:45' },
    { date: '1878-05-08', sunrise: '04:55', sunset: '18:43', moonAge: 5.94, moonrise: '11:21', moonset: '21:33' },
    { date: '1878-05-09', sunrise: '04:54', sunset: '18:44', moonAge: 6.94, moonrise: '12:11', moonset: '22:21' },
    { date: '1878-05-10', sunrise: '04:53', sunset: '18:44', moonAge: 7.94, moonrise: '13:00', moonset: '23:09' },
    { date: '1878-05-11', sunrise: '04:52', sunset: '18:45', moonAge: 8.94, moonrise: '13:49', moonset: '23:56' },
    { date: '1878-05-12', sunrise: '04:51', sunset: '18:46', moonAge: 9.94, moonrise: '14:39', moonset: '00:44' },
    { date: '1878-05-13', sunrise: '04:50', sunset: '18:47', moonAge: 10.94, moonrise: '15:29', moonset: '01:32' },
    { date: '1878-05-14', sunrise: '04:49', sunset: '18:48', moonAge: 11.94, moonrise: '16:19', moonset: '02:20' },
    { date: '1878-05-15', sunrise: '04:49', sunset: '18:48', moonAge: 12.94, moonrise: '17:08', moonset: '03:09' },
    { date: '1878-05-16', sunrise: '04:48', sunset: '18:49', moonAge: 13.94, moonrise: '17:57', moonset: '03:56' },
    { date: '1878-05-17', sunrise: '04:47', sunset: '18:50', moonAge: 14.94, moonrise: '18:47', moonset: '04:44' },
    { date: '1878-05-18', sunrise: '04:46', sunset: '18:51', moonAge: 15.94, moonrise: '19:37', moonset: '05:32' },
    { date: '1878-05-19', sunrise: '04:46', sunset: '18:51', moonAge: 16.94, moonrise: '20:26', moonset: '06:21' },
    { date: '1878-05-20', sunrise: '04:45', sunset: '18:52', moonAge: 17.94, moonrise: '21:15', moonset: '07:08' },
    { date: '1878-05-21', sunrise: '04:44', sunset: '18:53', moonAge: 18.94, moonrise: '22:05', moonset: '07:57' },
    { date: '1878-05-22', sunrise: '04:43', sunset: '18:54', moonAge: 19.94, moonrise: '22:54', moonset: '08:44' },
    { date: '1878-05-23', sunrise: '04:43', sunset: '18:54', moonAge: 20.94, moonrise: '23:44', moonset: '09:33' },
    { date: '1878-05-24', sunrise: '04:42', sunset: '18:55', moonAge: 21.94, moonrise: '00:33', moonset: '10:20' },
    { date: '1878-05-25', sunrise: '04:42', sunset: '18:56', moonAge: 22.94, moonrise: '01:23', moonset: '11:09' },
    { date: '1878-05-26', sunrise: '04:41', sunset: '18:57', moonAge: 23.94, moonrise: '02:13', moonset: '11:57' },
    { date: '1878-05-27', sunrise: '04:41', sunset: '18:57', moonAge: 24.94, moonrise: '03:02', moonset: '12:46' },
    { date: '1878-05-28', sunrise: '04:40', sunset: '18:58', moonAge: 25.94, moonrise: '03:51', moonset: '13:33' },
    { date: '1878-05-29', sunrise: '04:40', sunset: '18:59', moonAge: 26.94, moonrise: '04:41', moonset: '14:22' },
    { date: '1878-05-30', sunrise: '04:40', sunset: '18:59', moonAge: 27.94, moonrise: '05:30', moonset: '15:11' },
    { date: '1878-05-31', sunrise: '04:39', sunset: '19:00', moonAge: 28.94, moonrise: '06:20', moonset: '15:59' },
    { date: '1878-06-01', sunrise: '04:39', sunset: '19:01', moonAge: 0.41, moonrise: '07:10', moonset: '16:48' },
    { date: '1878-06-02', sunrise: '04:39', sunset: '19:01', moonAge: 1.41, moonrise: '07:58', moonset: '17:36' },
    { date: '1878-06-03', sunrise: '04:38', sunset: '19:02', moonAge: 2.41, moonrise: '08:48', moonset: '18:24' },
    { date: '1878-06-04', sunrise: '04:38', sunset: '19:02', moonAge: 3.41, moonrise: '09:37', moonset: '19:13' },
    { date: '1878-06-05', sunrise: '04:38', sunset: '19:03', moonAge: 4.41, moonrise: '10:27', moonset: '20:02' },
    { date: '1878-06-06', sunrise: '04:38', sunset: '19:03', moonAge: 5.41, moonrise: '11:15', moonset: '20:50' },
    { date: '1878-06-07', sunrise: '04:37', sunset: '19:04', moonAge: 6.41, moonrise: '12:05', moonset: '21:38' }
];

/**
 * 時刻文字列(HH:MM)をDateオブジェクトの時刻に変換
 * @param {Date} baseDate - 基準となる日付
 * @param {string} timeStr - 時刻文字列 (HH:MM)
 * @returns {Date} 時刻を設定したDateオブジェクト
 */
function parseTimeString(baseDate, timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
}

/**
 * 指定された日付の天文データを取得
 * @param {Date} date - 取得したい日付
 * @returns {Object|null} 天文データ、または見つからない場合はnull
 */
function getAstronomyData(date) {
    const dateStr = formatDateString(date);
    return ASTRONOMY_DATA.find(data => data.date === dateStr) || null;
}

/**
 * 日付をYYYY-MM-DD形式の文字列に変換
 * @param {Date} date - 変換する日付
 * @returns {string} YYYY-MM-DD形式の文字列
 */
function formatDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 指定された日時に対する天文条件を取得
 * @param {Date} currentDate - 現在の日時
 * @returns {Object} 天文条件の情報
 */
function getAstronomyConditions(currentDate) {
    const data = getAstronomyData(currentDate);
    if (!data) {
        return {
            isDaytime: true,
            isMoonVisible: false,
            moonPhase: 'unknown',
            sunStatus: 'unknown',
            moonStatus: 'unknown',
            data: null
        };
    }

    const sunrise = parseTimeString(currentDate, data.sunrise);
    const sunset = parseTimeString(currentDate, data.sunset);
    let moonrise = parseTimeString(currentDate, data.moonrise);
    let moonset = parseTimeString(currentDate, data.moonset);

    // 現在時刻が日の出と日の入りの間にあるか
    const isDaytime = currentDate >= sunrise && currentDate < sunset;

    // 月の可視判定（複雑なケースに対応）
    let isMoonVisible = false;
    
    // ケース1: 月の出 < 月の入り（同日内で月が出て沈む）
    if (moonrise < moonset) {
        isMoonVisible = currentDate >= moonrise && currentDate < moonset;
    } 
    // ケース2: 月の出 > 月の入り（日を跨いで月が見える）
    // 例: 月の出 23:00、月の入り 01:00 の場合
    else {
        // 当日の月の出から翌日の月の入りまで見える
        const moonsetNextDay = new Date(moonset);
        moonsetNextDay.setDate(moonsetNextDay.getDate() + 1);
        
        isMoonVisible = currentDate >= moonrise || currentDate < moonset;
    }
    
    // 前日の月が日を跨いで見えている可能性もチェック
    if (!isMoonVisible) {
        // 前日のデータを取得
        const prevDate = new Date(currentDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevData = getAstronomyData(prevDate);
        
        if (prevData) {
            const prevMoonrise = parseTimeString(prevDate, prevData.moonrise);
            const prevMoonset = parseTimeString(prevDate, prevData.moonset);
            
            // 前日の月の出 > 月の入り の場合、翌日（今日）にまたがる
            if (prevMoonrise > prevMoonset) {
                const prevMoonsetToday = new Date(currentDate);
                const [hours, minutes] = prevData.moonset.split(':').map(Number);
                prevMoonsetToday.setHours(hours, minutes, 0, 0);
                
                // 今日の0時から前日の月の入り時刻まで見える
                if (currentDate < prevMoonsetToday) {
                    isMoonVisible = true;
                }
            }
        }
    }

    // 月齢から月相を判定
    const moonPhase = getMoonPhase(data.moonAge);

    // 太陽の状態
    let sunStatus;
    if (currentDate < sunrise) {
        sunStatus = 'before-sunrise';
    } else if (currentDate >= sunrise && currentDate < sunset) {
        sunStatus = 'daytime';
    } else {
        sunStatus = 'after-sunset';
    }

    // 月の状態（isMoonVisibleと整合性を持たせる）
    let moonStatus;
    if (isMoonVisible) {
        moonStatus = 'visible';
    } else {
        // 月が見えない場合、月の出前か月の入り後かを判定
        // 同日内の月の出入りの場合
        if (moonrise < moonset) {
            if (currentDate < moonrise) {
                moonStatus = 'before-moonrise';
            } else {
                moonStatus = 'after-moonset';
            }
        } else {
            // 日を跨ぐ場合は簡易判定
            moonStatus = 'after-moonset';
        }
    }

    return {
        isDaytime,
        isMoonVisible,
        moonPhase,
        moonAge: data.moonAge,
        sunStatus,
        moonStatus,
        sunrise: data.sunrise,
        sunset: data.sunset,
        moonrise: data.moonrise,
        moonset: data.moonset,
        data
    };
}

/**
 * 月齢から月相を判定
 * @param {number} moonAge - 月齢（日数）
 * @returns {string} 月相の名称
 */
function getMoonPhase(moonAge) {
    // 月齢を29.5日周期に正規化
    const normalizedAge = moonAge % 29.5;

    if (normalizedAge < 1.84) return 'new-moon';        // 新月
    if (normalizedAge < 7.38) return 'waxing-crescent'; // 三日月（上弦前）
    if (normalizedAge < 9.23) return 'first-quarter';   // 上弦の月
    if (normalizedAge < 14.77) return 'waxing-gibbous'; // 十三夜月（満月前）
    if (normalizedAge < 16.61) return 'full-moon';      // 満月
    if (normalizedAge < 22.15) return 'waning-gibbous'; // 十六夜月（下弦前）
    if (normalizedAge < 23.99) return 'last-quarter';   // 下弦の月
    if (normalizedAge < 29.5) return 'waning-crescent'; // 二十六夜月（新月前）
    return 'new-moon';
}

/**
 * 月相の日本語名を取得
 * @param {string} phase - 月相の英語名
 * @returns {string} 月相の日本語名
 */
function getMoonPhaseName(phase, lang = 'ja') {
    const names = {
        'ja': {
            'new-moon': '新月',
            'waxing-crescent': '三日月',
            'first-quarter': '上弦の月',
            'waxing-gibbous': '十三夜月',
            'full-moon': '満月',
            'waning-gibbous': '十六夜月',
            'last-quarter': '下弦の月',
            'waning-crescent': '二十六夜月',
            'unknown': '不明'
        },
        'en': {
            'new-moon': 'New Moon',
            'waxing-crescent': 'Waxing Crescent',
            'first-quarter': 'First Quarter',
            'waxing-gibbous': 'Waxing Gibbous',
            'full-moon': 'Full Moon',
            'waning-gibbous': 'Waning Gibbous',
            'last-quarter': 'Last Quarter',
            'waning-crescent': 'Waning Crescent',
            'unknown': 'Unknown'
        }
    };
    return names[lang][phase] || names[lang]['unknown'];
}

/**
 * 月相の絵文字を取得
 * @param {string} phase - 月相の英語名
 * @returns {string} 月相を表す絵文字
 */
function getMoonPhaseEmoji(phase) {
    const emojis = {
        'new-moon': '🌑',
        'waxing-crescent': '🌒',
        'first-quarter': '🌓',
        'waxing-gibbous': '🌔',
        'full-moon': '🌕',
        'waning-gibbous': '🌖',
        'last-quarter': '🌗',
        'waning-crescent': '🌘',
        'unknown': '❓'
    };
    return emojis[phase] || emojis['unknown'];
}
