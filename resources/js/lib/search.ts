/**
 * Universal Search & Matching Utilities
 * Mendukung pencarian multi-token (AND logic across words) dan multi-field.
 */

/**
 * Mengambil value dari nested object menggunakan dot notation (misal 'customer.company_name')
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  if (!path.includes('.')) return obj[path];
  return path.split('.').reduce((acc, part) => (acc != null ? acc[part] : undefined), obj);
}

/**
 * Memeriksa apakah semua token/kata dalam query terdapat pada field-field target.
 *
 * Contoh:
 * targets = ["Kemeja Basic Panjang", "Atasan"]
 * query = "kemeja panjang"
 * -> true (karena "kemeja" dan "panjang" keduanya ditemukan)
 *
 * targets = ["Budi Santoso", "PT Victory Abadi", "08123456789"]
 * query = "budi victory"
 * -> true (karena "budi" ada di nama, "victory" ada di perusahaan)
 */
export function multiTokenMatch(
  targets: (string | number | boolean | null | undefined)[] | string | null | undefined,
  searchQuery: string
): boolean {
  if (!searchQuery || !searchQuery.trim()) {
    return true;
  }

  const rawTargets = Array.isArray(targets) ? targets : [targets];
  const combinedText = rawTargets
    .filter((t): t is string | number | boolean => t !== null && t !== undefined)
    .map((t) => String(t).trim().toLowerCase())
    .join(' ');

  if (!combinedText) {
    return false;
  }

  // Pisahkan query berdasarkan spasi menjadi token kata yang unik & non-kosong
  const tokens = searchQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  // Semua token harus ditemukan dalam gabungan teks target (AND logic)
  return tokens.every((token) => combinedText.includes(token));
}

/**
 * Helper untuk menyaring array object berdasarkan pencarian multi-token.
 */
export function filterByMultiToken<T>(
  items: T[],
  searchQuery: string,
  getTargets: (item: T) => (string | number | boolean | null | undefined)[]
): T[] {
  if (!searchQuery || !searchQuery.trim()) {
    return items;
  }

  return items.filter((item) => multiTokenMatch(getTargets(item), searchQuery));
}

/**
 * Factory filterOption untuk library react-select agar otomatis mendukung
 * pencarian multi-token pada label, value, dan data tambahan.
 */
export function createMultiTokenFilterOption<OptionType extends { label?: any; value?: any; data?: any }>(
  extraExtractor?: (option: OptionType) => (string | number | boolean | null | undefined)[]
) {
  return (candidate: OptionType, input: string): boolean => {
    if (!input || !input.trim()) return true;

    const baseTargets: (string | number | boolean | null | undefined)[] = [
      candidate.label,
      candidate.value,
    ];

    if (candidate.data && typeof candidate.data === 'object') {
      // Ambil nilai string umum dari data jika ada
      Object.values(candidate.data).forEach((val) => {
        if (typeof val === 'string' || typeof val === 'number') {
          baseTargets.push(val);
        }
      });
    }

    if (extraExtractor) {
      baseTargets.push(...extraExtractor(candidate));
    }

    return multiTokenMatch(baseTargets, input);
  };
}
