<?php

namespace App\Support;

class DocumentFilename
{
    public static function make(string $number, ?string $company, array $articles, ?string $documentType = null): string
    {
        $articles = array_values(array_unique(array_filter(array_map(
            static fn ($article) => trim((string) $article),
            $articles
        ))));

        $parts = [
            self::sanitize($number, 48),
            self::sanitize($company ?: 'Customer', 48),
            self::sanitize($articles ? implode(', ', $articles) : 'Multi-Artikel', 96),
        ];

        if ($documentType) {
            $parts[] = self::sanitize($documentType, 32);
        }

        return implode(' - ', array_filter($parts)) . '.pdf';
    }

    private static function sanitize(string $value, int $limit): string
    {
        $value = str_replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], '-', $value);
        $value = preg_replace('/[\x00-\x1F\x7F]/u', '', $value) ?? '';
        $value = preg_replace('/\s+/u', ' ', trim($value)) ?? '';
        $value = trim($value, " .-");

        return mb_substr($value, 0, $limit);
    }
}