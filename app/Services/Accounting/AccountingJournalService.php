<?php

namespace App\Services\Accounting;

use App\Models\Accounting\ChartOfAccount;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Purchasing;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AccountingJournalService
{
    /**
     * Create a balanced double-entry journal entry.
     *
     * @param array $entryData [entry_date, reference_type, reference_id, job_ticket_id, description, is_auto_generated, created_by]
     * @param array $lines [[account_id or account_code, debit, credit, memo]]
     * @return JournalEntry
     */
    public function createEntry(array $entryData, array $lines): JournalEntry
    {
        return DB::transaction(function () use ($entryData, $lines) {
            $totalDebit = 0;
            $totalCredit = 0;
            $resolvedLines = [];

            foreach ($lines as $line) {
                $accountId = $line['account_id'] ?? null;
                if (!$accountId && isset($line['account_code'])) {
                    $acc = ChartOfAccount::where('account_code', $line['account_code'])->first();
                    if ($acc) {
                        $accountId = $acc->id;
                    }
                }

                if (!$accountId) {
                    throw new InvalidArgumentException("Akun jurnal tidak ditemukan: " . json_encode($line));
                }

                $debit = round((float) ($line['debit'] ?? 0), 2);
                $credit = round((float) ($line['credit'] ?? 0), 2);

                $totalDebit += $debit;
                $totalCredit += $credit;

                $resolvedLines[] = [
                    'account_id' => $accountId,
                    'debit' => $debit,
                    'credit' => $credit,
                    'memo' => $line['memo'] ?? null,
                ];
            }

            // Verify balanced entry
            if (abs($totalDebit - $totalCredit) > 0.01) {
                throw new InvalidArgumentException("Jurnal tidak seimbang: Total Debit (Rp $totalDebit) != Total Kredit (Rp $totalCredit)");
            }

            $entryNumber = $entryData['entry_number'] ?? $this->generateEntryNumber($entryData['entry_date'] ?? now());

            $journalEntry = JournalEntry::create([
                'entry_number' => $entryNumber,
                'entry_date' => $entryData['entry_date'] ?? now(),
                'reference_type' => $entryData['reference_type'] ?? 'manual',
                'reference_id' => $entryData['reference_id'] ?? null,
                'job_ticket_id' => $entryData['job_ticket_id'] ?? null,
                'description' => $entryData['description'] ?? 'Jurnal Transaksi',
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'is_auto_generated' => $entryData['is_auto_generated'] ?? true,
                'status' => $entryData['status'] ?? 'posted',
                'created_by' => $entryData['created_by'] ?? auth()->id(),
            ]);

            foreach ($resolvedLines as $resolvedLine) {
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_id' => $resolvedLine['account_id'],
                    'debit' => $resolvedLine['debit'],
                    'credit' => $resolvedLine['credit'],
                    'memo' => $resolvedLine['memo'],
                ]);
            }

            return $journalEntry;
        });
    }

    /**
     * Generate unique journal entry number
     */
    public function generateEntryNumber($date): string
    {
        $d = is_string($date) ? strtotime($date) : (is_numeric($date) ? $date : now()->timestamp);
        $prefix = 'JV-' . date('Ym', $d) . '-';
        $last = JournalEntry::where('entry_number', 'LIKE', $prefix . '%')->orderByDesc('id')->first();
        $next = 1;
        if ($last) {
            $seq = (int) substr($last->entry_number, strlen($prefix));
            $next = $seq + 1;
        }

        return $prefix . str_pad((string)$next, 4, '0', STR_PAD_LEFT);
    }
}
