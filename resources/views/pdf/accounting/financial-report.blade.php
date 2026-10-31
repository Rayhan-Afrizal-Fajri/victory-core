<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
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
            font-size: 16px;
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
        .section-header {
            background-color: #f8fafc;
            font-weight: bold;
            color: #0b5394;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
            padding: 6px 8px;
        }
        .subtotal-row {
            font-weight: bold;
            background-color: #fafafa;
            border-top: 1px dashed #9ca3af;
            border-bottom: 1px dashed #9ca3af;
        }
        .grandtotal-row {
            font-size: 11px;
            font-weight: bold;
            background-color: #eff6ff;
            color: #1e3a8a;
            border-top: 2px solid #0b5394;
            border-bottom: 2px solid #0b5394;
        }

        .signature-table {
            width: 100%;
            margin-top: 40px;
            page-break-inside: avoid;
        }
        .signature-cell {
            width: 45%;
            text-align: center;
        }
        .signature-space {
            height: 60px;
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
                <p style="margin: 2px 0; color: #4b5563;">Telp: {{ $company->telepon ?? $company->phone ?? '(022) 8765-4321' }} | Email: {{ $company->email ?? 'finance@victorygarment.id' }}</p>
            </td>
            <td style="width: 40%; text-align: right;">
                <p style="margin: 0; font-size: 9px; color: #6b7280;">Tanggal Cetak: {{ now()->translatedFormat('d F Y H:i') }}</p>
                <p style="margin: 2px 0; font-size: 9px; color: #6b7280;">Dicetak oleh: {{ auth()->user()?->name ?? 'Admin Finance' }}</p>
                <p style="margin: 2px 0; font-size: 9px; color: #0b5394; font-weight: bold;">Dokumen Resmi Akuntansi</p>
            </td>
        </tr>
    </table>

    <div class="doc-title">{{ $title }}</div>
    <div class="doc-period">{{ $subtitle }}</div>

    @if($reportType === 'income-statement')
        <!-- LABA RUGI KOMPREHENSIF (MULTI-STEP) -->
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 18%;">Kode Akun</th>
                    <th>Nama Akun & Keterangan</th>
                    <th class="text-right" style="width: 25%;">Nominal (IDR)</th>
                </tr>
            </thead>
            <tbody>
                <!-- PENDAPATAN -->
                <tr>
                    <td colspan="3" class="section-header">1. PENDAPATAN OPERASIONAL (REVENUE)</td>
                </tr>
                @forelse($data['revenues'] as $rev)
                    <tr>
                        <td class="font-mono text-muted">{{ $rev['code'] }}</td>
                        <td>{{ $rev['name'] }}</td>
                        <td class="text-right font-mono">{{ number_format($rev['amount'], 0, ',', '.') }}</td>
                    </tr>
                @empty
                    <tr>
                        <td class="font-mono">4-1000</td>
                        <td>Pendapatan Produksi Pakaian Jadi</td>
                        <td class="text-right font-mono">{{ number_format($data['totalRevenue'], 0, ',', '.') }}</td>
                    </tr>
                @endforelse
                <tr class="subtotal-row">
                    <td colspan="2">TOTAL PENDAPATAN BERSIH</td>
                    <td class="text-right font-mono font-bold">{{ number_format($data['totalRevenue'], 0, ',', '.') }}</td>
                </tr>

                <!-- HPP -->
                <tr>
                    <td colspan="3" class="section-header" style="padding-top: 10px;">2. HARGA POKOK PENJUALAN (HPP / COGS)</td>
                </tr>
                @forelse($data['cogs'] as $cg)
                    <tr>
                        <td class="font-mono text-muted">{{ $cg['code'] }}</td>
                        <td>{{ $cg['name'] }}</td>
                        <td class="text-right font-mono">{{ number_format($cg['amount'], 0, ',', '.') }}</td>
                    </tr>
                @empty
                    <tr>
                        <td class="font-mono">5-1000</td>
                        <td>Beban Pokok Produksi (Material, Upah, Makloon)</td>
                        <td class="text-right font-mono">{{ number_format($data['totalCogs'], 0, ',', '.') }}</td>
                    </tr>
                @endforelse
                <tr class="subtotal-row">
                    <td colspan="2">TOTAL HARGA POKOK PENJUALAN (HPP)</td>
                    <td class="text-right font-mono font-bold">{{ number_format($data['totalCogs'], 0, ',', '.') }}</td>
                </tr>

                <!-- LABA KOTOR -->
                <tr class="grandtotal-row">
                    <td colspan="2">LABA KOTOR (GROSS PROFIT)</td>
                    <td class="text-right font-mono">{{ number_format($data['grossProfit'], 0, ',', '.') }}</td>
                </tr>

                <!-- BEBAN OPERASIONAL -->
                <tr>
                    <td colspan="3" class="section-header" style="padding-top: 10px;">3. BEBAN OPERASIONAL (OPEX)</td>
                </tr>
                @forelse($data['expenses'] as $exp)
                    <tr>
                        <td class="font-mono text-muted">{{ $exp['code'] }}</td>
                        <td>{{ $exp['name'] }}</td>
                        <td class="text-right font-mono">{{ number_format($exp['amount'], 0, ',', '.') }}</td>
                    </tr>
                @empty
                    <tr>
                        <td class="font-mono">6-1000</td>
                        <td>Beban Operasional Pabrik & Umum</td>
                        <td class="text-right font-mono">{{ number_format($data['totalExpense'], 0, ',', '.') }}</td>
                    </tr>
                @endforelse
                <tr class="subtotal-row">
                    <td colspan="2">TOTAL BEBAN OPERASIONAL</td>
                    <td class="text-right font-mono font-bold">{{ number_format($data['totalExpense'], 0, ',', '.') }}</td>
                </tr>

                <!-- LABA BERSIH -->
                <tr class="grandtotal-row" style="background-color: {{ $data['netProfit'] >= 0 ? '#dcfce7' : '#fee2e2' }}; color: {{ $data['netProfit'] >= 0 ? '#15803d' : '#b91c1c' }};">
                    <td colspan="2">LABA (RUGI) BERSIH OPERASIONAL (NET PROFIT)</td>
                    <td class="text-right font-mono">{{ number_format($data['netProfit'], 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>

    @elseif($reportType === 'balance-sheet')
        <!-- NERACA KEUANGAN (BALANCE SHEET) -->
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 18%;">Kode Akun</th>
                    <th>Nama Akun / Pos Finansial</th>
                    <th class="text-right" style="width: 25%;">Saldo (IDR)</th>
                </tr>
            </thead>
            <tbody>
                <!-- ASET -->
                <tr>
                    <td colspan="3" class="section-header">ASET / AKTIVA</td>
                </tr>
                @foreach($data['assets'] as $asset)
                    <tr>
                        <td class="font-mono">{{ $asset['code'] }}</td>
                        <td>{{ $asset['name'] }}</td>
                        <td class="text-right font-mono">{{ number_format($asset['amount'], 0, ',', '.') }}</td>
                    </tr>
                @endforeach
                <tr class="grandtotal-row">
                    <td colspan="2">TOTAL ASET</td>
                    <td class="text-right font-mono">{{ number_format($data['totalAssets'], 0, ',', '.') }}</td>
                </tr>

                <!-- KEWAJIBAN -->
                <tr>
                    <td colspan="3" class="section-header" style="padding-top: 15px;">KEWAJIBAN / LIABILITAS</td>
                </tr>
                @foreach($data['liabilities'] as $liab)
                    <tr>
                        <td class="font-mono">{{ $liab['code'] }}</td>
                        <td>{{ $liab['name'] }}</td>
                        <td class="text-right font-mono">{{ number_format($liab['amount'], 0, ',', '.') }}</td>
                    </tr>
                @endforeach
                <tr class="subtotal-row">
                    <td colspan="2">TOTAL KEWAJIBAN (HUTANG)</td>
                    <td class="text-right font-mono">{{ number_format($data['totalLiabilities'], 0, ',', '.') }}</td>
                </tr>

                <!-- EKUITAS -->
                <tr>
                    <td colspan="3" class="section-header" style="padding-top: 10px;">EKUITAS / MODAL</td>
                </tr>
                <tr>
                    <td class="font-mono">3-1000</td>
                    <td>Modal Pemilik & Laba Ditahan</td>
                    <td class="text-right font-mono">{{ number_format($data['totalEquity'], 0, ',', '.') }}</td>
                </tr>
                <tr class="grandtotal-row">
                    <td colspan="2">TOTAL KEWAJIBAN & EKUITAS</td>
                    <td class="text-right font-mono">{{ number_format($data['totalLiabilities'] + $data['totalEquity'], 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>

    @elseif($reportType === 'trial-balance')
        <!-- NERACA SALDO (TRIAL BALANCE) -->
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 15%;">Kode Akun</th>
                    <th>Nama Akun</th>
                    <th class="text-right" style="width: 22%;">Total Debit (IDR)</th>
                    <th class="text-right" style="width: 22%;">Total Kredit (IDR)</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $sumDebit = 0;
                    $sumCredit = 0;
                @endphp
                @foreach($data['trialBalance'] as $tb)
                    @php
                        $sumDebit += $tb['debit'];
                        $sumCredit += $tb['credit'];
                    @endphp
                    <tr>
                        <td class="font-mono">{{ $tb['code'] }}</td>
                        <td>{{ $tb['name'] }}</td>
                        <td class="text-right font-mono">{{ number_format($tb['debit'], 0, ',', '.') }}</td>
                        <td class="text-right font-mono">{{ number_format($tb['credit'], 0, ',', '.') }}</td>
                    </tr>
                @endforeach
                <tr class="grandtotal-row">
                    <td colspan="2">TOTAL NERACA SALDO</td>
                    <td class="text-right font-mono">{{ number_format($sumDebit, 0, ',', '.') }}</td>
                    <td class="text-right font-mono">{{ number_format($sumCredit, 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>
    @endif

    <!-- TANDA TANGAN AUDIT TRAIL -->
    <table class="signature-table">
        <tr>
            <td class="signature-cell">
                <p style="margin: 0;">Disiapkan Oleh,</p>
                <div class="signature-space"></div>
                <p style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">{{ auth()->user()?->name ?? 'Staf Akuntansi' }}</p>
                <p style="margin: 0; color: #4b5563;">Accounting & Finance</p>
            </td>
            <td style="width: 10%;"></td>
            <td class="signature-cell">
                <p style="margin: 0;">Disetujui Oleh,</p>
                <div class="signature-space"></div>
                <p style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">Direktur Utama</p>
                <p style="margin: 0; color: #4b5563;">Direksi / Owner</p>
            </td>
        </tr>
    </table>

</body>
</html>
