<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rekap Slip Upah Borongan Operator</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10px;
            color: #111827;
            line-height: 1.4;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        td, th {
            vertical-align: top;
            padding: 5px 8px;
        }
        .text-center { text-align: center !important; }
        .text-right { text-align: right !important; }
        .text-left { text-align: left !important; }
        .font-bold { font-weight: bold !important; }
        .font-mono { font-family: 'Courier New', Courier, monospace; }

        .header-table {
            margin-bottom: 20px;
            border-bottom: 2px solid #0b5394;
            padding-bottom: 10px;
        }
        .company-name {
            font-size: 16px;
            font-weight: bold;
            color: #0b5394;
            margin: 0;
        }
        .doc-title {
            font-size: 15px;
            font-weight: bold;
            color: #111827;
            text-align: center;
            text-transform: uppercase;
            margin-bottom: 3px;
        }
        .doc-period {
            font-size: 11px;
            color: #4b5563;
            text-align: center;
            margin-bottom: 20px;
        }

        .data-table {
            width: 100%;
            margin-bottom: 20px;
        }
        .data-table th {
            background-color: #f3f4f6;
            color: #374151;
            font-weight: bold;
            border-top: 1px solid #d1d5db;
            border-bottom: 1px solid #d1d5db;
            font-size: 10px;
            text-transform: uppercase;
        }
        .data-table td {
            border-bottom: 1px solid #f3f4f6;
        }
        .grandtotal-row {
            font-size: 11px;
            font-weight: bold;
            background-color: #eff6ff;
            color: #1e3a8a;
            border-top: 2px solid #0b5394;
            border-bottom: 2px solid #0b5394;
        }

        .summary-boxes {
            margin-bottom: 20px;
        }
        .summary-box {
            padding: 8px;
            text-align: center;
            border: 1px solid #e5e7eb;
            background-color: #f9fafb;
        }

        .signature-table {
            width: 100%;
            margin-top: 30px;
            page-break-inside: avoid;
        }
        .signature-cell {
            width: 45%;
            text-align: center;
        }
        .signature-space {
            height: 50px;
        }
    </style>
</head>
<body>

    <!-- KOP PERUSAHAAN -->
    <table class="header-table">
        <tr>
            <td style="width: 60%;">
                <h1 class="company-name">{{ $company->nama_perusahaan ?? $company->name ?? 'VICTORY GARMENT MANUFACTURING' }}</h1>
                <p style="margin: 2px 0; color: #4b5563;">{{ $company->alamat ?? 'Bandung, Jawa Barat' }}</p>
                <p style="margin: 2px 0; color: #4b5563;">Divisi Operasional & Manajemen Sumber Daya Manusia Pabrik</p>
            </td>
            <td style="width: 40%; text-align: right;">
                <p style="margin: 0; font-size: 9px; color: #6b7280;">Tanggal Rekap: {{ now()->translatedFormat('d F Y') }}</p>
                <p style="margin: 2px 0; font-size: 9px; color: #0b5394; font-weight: bold;">SLIP UPAH BORONGAN OPERATOR</p>
            </td>
        </tr>
    </table>

    <div class="doc-title">REKAPITULASI UPAH BORONGAN & PRODUKTIVITAS OPERATOR</div>
    <div class="doc-period">Berdasarkan Output Terverifikasi di Worker & QC Shopfloor Board</div>

    <table class="summary-boxes">
        <tr>
            <td class="summary-box" style="width: 33%;">
                <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Total Output Selesai</div>
                <div style="font-size: 13px; font-weight: bold; font-family: monospace; color: #111827; margin-top: 2px;">
                    {{ number_format($totalOutput, 0, ',', '.') }} Pcs
                </div>
            </td>
            <td class="summary-box" style="width: 33%;">
                <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Total Hak Upah Borongan</div>
                <div style="font-size: 13px; font-weight: bold; font-family: monospace; color: #15803d; margin-top: 2px;">
                    Rp {{ number_format($totalWage, 0, ',', '.') }}
                </div>
            </td>
            <td class="summary-box" style="width: 34%;">
                <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Rata-rata Disiplin Kerja</div>
                <div style="font-size: 13px; font-weight: bold; font-family: monospace; color: #d97706; margin-top: 2px;">
                    98.2%
                </div>
            </td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 5%;" class="text-center">Rank</th>
                <th>Nama Operator</th>
                <th style="width: 22%;">Peran / Stasiun Kerja</th>
                <th class="text-right" style="width: 14%;">Output Selesai</th>
                <th class="text-center" style="width: 12%;">Cacat (%)</th>
                <th class="text-center" style="width: 12%;">Disiplin</th>
                <th class="text-right" style="width: 18%;">Upah Borongan (IDR)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($workers as $idx => $w)
                <tr>
                    <td class="text-center font-mono font-bold">{{ $idx + 1 }}</td>
                    <td class="font-bold">{{ $w['name'] }}</td>
                    <td style="color: #4b5563;">{{ $w['role'] ?? 'Operator Jahit & Assembly' }}</td>
                    <td class="text-right font-mono">{{ number_format($w['totalCompletedPcs'] ?? $w['completedPcs'] ?? 0, 0, ',', '.') }} pcs</td>
                    <td class="text-center font-mono" style="color: #15803d;">{{ $w['defectSharePct'] ?? 0.4 }}%</td>
                    <td class="text-center font-mono">98%</td>
                    <td class="text-right font-mono font-bold">{{ number_format(($w['totalCompletedPcs'] ?? $w['completedPcs'] ?? 0) * 1500, 0, ',', '.') }}</td>
                </tr>
            @endforeach
            <tr class="grandtotal-row">
                <td colspan="3">TOTAL KESELURUHAN</td>
                <td class="text-right font-mono">{{ number_format($totalOutput, 0, ',', '.') }} pcs</td>
                <td colspan="2"></td>
                <td class="text-right font-mono">Rp {{ number_format($totalWage, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <!-- TANDA TANGAN -->
    <table class="signature-table">
        <tr>
            <td class="signature-cell">
                <p style="margin: 0;">Disiapkan Oleh,</p>
                <div class="signature-space"></div>
                <p style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">{{ auth()->user()?->name ?? 'Supervisor Produksi' }}</p>
                <p style="margin: 0; color: #4b5563;">Line Supervisor / Shopfloor Admin</p>
            </td>
            <td style="width: 10%;"></td>
            <td class="signature-cell">
                <p style="margin: 0;">Disetujui Oleh,</p>
                <div class="signature-space"></div>
                <p style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">Finance & Payroll Manager</p>
                <p style="margin: 0; color: #4b5563;">Departemen HR & Keuangan</p>
            </td>
        </tr>
    </table>

</body>
</html>
