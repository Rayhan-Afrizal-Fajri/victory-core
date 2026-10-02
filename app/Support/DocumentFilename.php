<?php

namespace App\Support;

class DocumentFilename
{
    public static function make(string $number, ?string $company, array $articles, ?string $documentType = null): string
    {
        $articles = array_values(array_unique(array_filter(array_map(
            static fn ($article) => self::sanitize(trim((string) $article), 96),
            $articles
        ), static fn ($article) => $article !== '')));

        $articleLabel = implode(', ', $articles);
        if ($articleLabel === '') {
            $articleLabel = 'Tanpa Artikel';
        } elseif (count($articles) > 1 && mb_strlen($articleLabel) > 96) {
            $articleLabel = sprintf('Multi-Artikel (%d)', count($articles));
        } else {
            $articleLabel = mb_substr($articleLabel, 0, 96);
        }

        $number = self::sanitize($number, 48) ?: 'Dokumen';
        $company = self::sanitize($company ?? '', 48) ?: 'Customer';
        $parts = [$number, $company, $articleLabel];

        if ($documentType) {
            $documentType = self::sanitize($documentType, 32);
            if ($documentType !== '') {
                $parts[] = $documentType;
            }
        }

        return implode(' - ', $parts) . '.pdf';
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