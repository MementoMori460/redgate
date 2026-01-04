
// Correction map for specific typos found in analysis
const TYPO_MAP: Record<string, string> = {
    'abkara': 'Ankara',
    'ankaya': 'Ankara',
    'anlara': 'Ankara',
    'istanbul': 'İstanbul',
    'i̇stanbul': 'İstanbul',
    'istnbul': 'İstanbul',
    'istnabul': 'İstanbul',
    'balıkeir': 'Balıkesir',
    'balıkesir': 'Balıkesir',
    'blıkesir': 'Balıkesir',
    'kayser': 'Kayseri',
    'esjişehir': 'Eskişehir',
    'trabzan': 'Trabzon',
    'antep': 'Gaziantep',
    'urfa': 'Şanlıurfa',
    'izmir': 'İzmir',
    'izmit': 'İzmit',
    'kocaeli': 'İzmit',
    'v an': 'Van',
    'van': 'Van',
    'çorum': 'Çorum',
};

// Turkish-aware title case function
function toTitleCaseTR(str: string): string {
    if (!str) return str;
    return str.toLocaleLowerCase('tr-TR').split(' ').map(word =>
        word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1)
    ).join(' ');
}

export function normalizeCityName(rawCity: string): string {
    if (!rawCity) return 'Unknown';

    let city = rawCity.trim();
    if (city.length === 0) return 'Unknown';

    // Check for date pattern (e.g. 26.03.2025) which indicates a column shift error
    if (/^\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4}$/.test(city)) {
        return 'Unknown';
    }

    // Check strict typo map (lowercase lookup)
    const lower = city.toLocaleLowerCase('tr-TR');
    if (TYPO_MAP[lower]) {
        return TYPO_MAP[lower];
    }

    // Generic fixes
    return toTitleCaseTR(city);
}
