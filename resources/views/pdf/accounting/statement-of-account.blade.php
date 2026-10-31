<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Statement of Account - {{ $customerName }}</title>
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

        .customer-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            margin-bottom: 20px;
        }

        .summary-boxes {
            margin-bottom: 20px;
        }
        .summary-box {
            padding: 10px;
            text-align: center;
            border: 1px solid #e5e7eb;
            background-color: #f9fafb;
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

        .bank-info {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 10px;
            margin-top: 15px;
            margin-bottom: 25px;
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
                <p style="margin: 2px 0; color: #4b5563;">Telp: {{ $company->telepon ?? '(022) 8765-4321' }} | Email: {{ $company->email ?? 'finance@victorygarment.id' }}</p>
            </td>
            <td style="width: 40%; text-align: right;">
                <p style="margin: 0; font-size: 9px; color: #6b7280;">Tanggal Statement: {{ now()->translatedFormat('d F Y') }}</p>
                <p style="margin: 2px 0; font-size: 9px; color: #0b5394; font-weight: bold;">KARTU PIUTANG USAHA (AR)</p>
            </td>
        </tr>
    </table>

    <div class="doc-title">STATEMENT OF ACCOUNT / KARTU PIUTANG CUSTOMER</div>
    <div class="doc-period">Rekapitulasi Kewajiban Pembayaran per {{ now()->translatedFormat('d F Y') }}</div>

    <!-- INFORMASI PELANGGAN -->
    <table class="customer-card">
        <tr>
            <td style="width: 50%; padding: 10px;">
                <p style="margin: 0; font-size: 9px; color: #6b7280; text-transform: uppercase;">Ditujukan Kepada:</p>
                <p style="margin: 2px 0; font-size: 13px; font-weight: bold; color: #0b5394;">{{ $customerName }}</p>
                <p style="margin: 2px 0; color: #374151;">{{ $customerCompany ?: 'Instansi / Perorangan' }}</p>
                <p style="margin: 2px 0; color: #4b5563;">{{ $customerAddress ?: 'Alamat terdaftar pada berkas order' }}</p>
            </td>
            <td style="width: 50%; padding: 10px; text-align: right;">
                <p style="margin: 0; font-size: 9px; color: #6b7280;">Kontak Pelanggan:</p>
                <p style="margin: 2px 0; font-weight: bold;">{{ $customerPhone ?: '-' }}</p>
                <p style="margin: 2px 0; color: #4b5563;">{{ $customerEmail ?: '-' }}</p>
            </td>
        </tr>
    </table>

    <!-- RINGKASAN SALDO -->
    <table class="summary-boxes">
        <tr>
            <td class="summary-box" style="width: 33%;">
                <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Total Tagihan</div>
                <div style="font-size: 13px; font-weight: bold; font-family: monospace; color: #111827; margin-top: 3px;">
                    Rp {{ number_format($totalBilled, 0, ',', '.') }}
                </div>
            </td>
            <td class="summary-box" style="width: 33%;">
                <div style="font-size: 9px; color: #6b7280; text-transform: uppercase;">Sudah Dibayar</div>
                <div style="font-size: 13px; font-weight: bold; font-family: monospace; color: #15803d; margin-top: 3px;">
                    Rp {{ number_format($totalPaid, 0, ',', '.') }}
                </div>
            </td>
            <td class="summary-box" style="width: 34%; background-color: #fef2f2; border-color: #fecaca;">
                <div style="font-size: 9px; color: #991b1b; text-transform: uppercase; font-weight: bold;">Sisa Piutang Berjalan</div>
                <div style="font-size: 14px; font-weight: bold; font-family: monospace; color: #b91c1c; margin-top: 3px;">
                    Rp {{ number_format($outstanding, 0, ',', '.') }}
                </div>
            </td>
        </tr>
    </table>

    <!-- TABEL DAFTAR TAGIHAN -->
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 15%;">No. Invoice</th>
                <th style="width: 15%;">Tgl Invoice</th>
                <th>Deskripsi / Job Ticket</th>
                <th style="width: 13%;">Jatuh Tempo</th>
                <th class="text-right" style="width: 15%;">Nilai Tagihan</th>
                <th class="text-right" style="width: 15%;">Terbayar</th>
                <th class="text-right" style="width: 15%;">Sisa Saldo</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoices as $inv)
                <tr>
                    <td class="font-mono font-bold text-primary">{{ $inv['invoiceNumber'] }}</td>
                    <td class="font-mono">{{ $inv['issueDate'] }}</td>
                    <td>{{ $inv['jobTicketNo'] }} ({{ ucfirst($inv['category']) }})</td>
                    <td class="font-mono" style="color: {{ $inv['daysOverdue'] > 0 ? '#b91c1c' : '#374151' }}; font-weight: {{ $inv['daysOverdue'] > 0 ? 'bold' : 'normal' }};">
                        {{ $inv['dueDate'] }}
                        @if($inv['daysOverdue'] > 0 && $inv['remainingAmount'] > 0)
                            <div style="font-size: 8px; color: #b91c1c;">(Telat {{ $inv['daysOverdue'] }} hari)</div>
                        @endif
                    </td>
                    <td class="text-right font-mono">{{ number_format($inv['totalAmount'], 0, ',', '.') }}</td>
                    <td class="text-right font-mono text-emerald-600">{{ number_format($inv['paidAmount'], 0, ',', '.') }}</td>
                    <td class="text-right font-mono font-bold" style="color: {{ $inv['remainingAmount'] > 0 ? '#b91c1c' : '#15803d' }};">
                        {{ number_format($inv['remainingAmount'], 0, ',', '.') }}
                    </td>
                </tr>
            @endforeach
            <tr class="grandtotal-row">
                <td colspan="4">TOTAL KESELURUHAN</td>
                <td class="text-right font-mono">{{ number_format($totalBilled, 0, ',', '.') }}</td>
                <td class="text-right font-mono">{{ number_format($totalPaid, 0, ',', '.') }}</td>
                <td class="text-right font-mono">{{ number_format($outstanding, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <!-- INSTRUKSI PEMBAYARAN VIA TRANSFER BANK -->
    <div class="bank-info">
        <p style="margin: 0 0 5px 0; font-weight: bold; color: #166534; font-size: 11px;">INSTRUKSI PEMBAYARAN TRANSFER BANK</p>
        <p style="margin: 2px 0;">Mohon melakukan pelunasan sisa tagihan ke rekening resmi perusahaan:</p>
        <table style="width: auto; margin-top: 5px;">
            <tr>
                <td style="padding: 2px 10px 2px 0; font-weight: bold;">Bank Central Asia (BCA)</td>
                <td style="padding: 2px 10px; font-family: monospace; font-size: 11px; font-weight: bold;">873-501-9921</td>
                <td style="padding: 2px 10px;">a.n. PT Victory Garment Indonesia</td>
            </tr>
            <tr>
                <td style="padding: 2px 10px 2px 0; font-weight: bold;">Bank Mandiri</td>
                <td style="padding: 2px 10px; font-family: monospace; font-size: 11px; font-weight: bold;">131-00-9821-4321</td>
                <td style="padding: 2px 10px;">a.n. PT Victory Garment Indonesia</td>
            </tr>
        </table>
        <p style="margin: 5px 0 0 0; font-size: 9px; color: #4b5563;">Setelah transfer, mohon kirimkan konfirmasi bukti transfer via WhatsApp Finance ke <strong>0812-3456-7890</strong>.</p>
    </div>

    <!-- TANDA TANGAN -->
    <table class="signature-table">
        <tr>
            <td class="signature-cell" style="width: 50%;"></td>
            <td class="signature-cell" style="width: 50%;">
                <p style="margin: 0;">Bandung, {{ now()->translatedFormat('d F Y') }}</p>
                <p style="margin: 2px 0;">Hormat Kami, Department Keuangan</p>
                <div class="signature-space"></div>
                <p style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">Finance & AR Department</p>
                <p style="margin: 0; color: #4b5563;">{{ $company->nama_perusahaan ?? 'Victory Core System' }}</p>
            </td>
        </tr>
    </table>

</body>
</html>

