<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Supplier Scorecard Report</title>
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
        .badge {
            display: inline-block;
            padding: 2px 6px;
            font-size: 9px;
            font-weight: bold;
            border-radius: 3px;
        }
        .badge-a { background-color: #dcfce7; color: #15803d; }
        .badge-b { background-color: #dbeafe; color: #1d4ed8; }
        .badge-c { background-color: #fef3c7; color: #b45309; }
        .badge-d { background-color: #fee2e2; color: #b91c1c; }

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
                <p style="margin: 2px 0; color: #4b5563;">Telp: {{ $company->telepon ?? '(022) 8765-4321' }} | Divisi Supply Chain & Purchasing</p>
            </td>
            <td style="width: 40%; text-align: right;">
                <p style="margin: 0; font-size: 9px; color: #6b7280;">Tanggal Laporan: {{ now()->translatedFormat('d F Y') }}</p>
                <p style="margin: 2px 0; font-size: 9px; color: #0b5394; font-weight: bold;">RAPORT EVALUASI SUPPLIER</p>
            </td>
        </tr>
    </table>

    <div class="doc-title">PAPAN PERINGKAT KINERJA MITRA & SUPPLIER</div>
    <div class="doc-period">Evaluasi Supply Chain & Kualitas Pasokan Bahan Garment</div>

    <table class="summary-boxes">
        <tr>
            <td class="summary-box" style="width: 33%;">
                <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Mitra Aktif Dievaluasi</div>
                <div style="font-size: 13px; font-weight: bold; font-family: monospace; color: #111827; margin-top: 2px;">
                    {{ count($suppliers) }} Supplier / Vendor
                </div>
            </td>
            <td class="summary-box" style="width: 33%;">
                <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Rata-rata Lead Time Pasokan</div>
                <div style="font-size: 13px; font-weight: bold; font-family: monospace; color: #0284c7; margin-top: 2px;">
                    {{ $avgLeadTime }} Hari
                </div>
            </td>
            <td class="summary-box" style="width: 34%;">
                <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Rata-rata Material Reject Rate</div>
                <div style="font-size: 13px; font-weight: bold; font-family: monospace; color: #16a34a; margin-top: 2px;">
                    {{ $avgRejectRate }}%
                </div>
            </td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 5%;" class="text-center">No</th>
                <th>Nama Supplier / Mitra</th>
                <th style="width: 18%;">Kategori Pasokan</th>
                <th class="text-center" style="width: 10%;">Total PO</th>
                <th class="text-right" style="width: 18%;">Total Belanja (IDR)</th>
                <th class="text-center" style="width: 10%;">Lead Time</th>
                <th class="text-center" style="width: 10%;">Reject %</th>
                <th class="text-center" style="width: 8%;">Skor</th>
                <th class="text-center" style="width: 8%;">Grade</th>
            </tr>
        </thead>
        <tbody>
            @foreach($suppliers as $idx => $sup)
                <tr>
                    <td class="text-center font-mono">{{ $idx + 1 }}</td>
                    <td class="font-bold">{{ $sup['name'] }}</td>
                    <td style="color: #4b5563;">{{ $sup['category'] }}</td>
                    <td class="text-center font-mono">{{ $sup['totalPos'] }}</td>
                    <td class="text-right font-mono">{{ number_format($sup['totalSpend'], 0, ',', '.') }}</td>
                    <td class="text-center font-mono">{{ $sup['leadTimeAvg'] }} hr</td>
                    <td class="text-center font-mono" style="color: {{ $sup['rejectRate'] > 2 ? '#b91c1c' : '#15803d' }}; font-weight: bold;">
                        {{ $sup['rejectRate'] }}%
                    </td>
                    <td class="text-center font-mono font-bold">{{ $sup['performanceScore'] }}</td>
                    <td class="text-center">
                        <span class="badge badge-{{ strtolower($sup['grade']) }}">
                            {{ $sup['grade'] }}
                        </span>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- TANDA TANGAN -->
    <table class="signature-table">
        <tr>
            <td class="signature-cell">
                <p style="margin: 0;">Disiapkan Oleh,</p>
                <div class="signature-space"></div>
                <p style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">{{ auth()->user()?->name ?? 'Purchasing Manager' }}</p>
                <p style="margin: 0; color: #4b5563;">Bagian Pengadaan & Gudang</p>
            </td>
            <td style="width: 10%;"></td>
            <td class="signature-cell">
                <p style="margin: 0;">Mengetahui & Menyetujui,</p>
                <div class="signature-space"></div>
                <p style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">Direktur Operasional</p>
                <p style="margin: 0; color: #4b5563;">Manajemen Pabrik</p>
            </td>
        </tr>
    </table>

</body>
</html>
