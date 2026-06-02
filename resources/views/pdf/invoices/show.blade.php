<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $invoice->no_invoice ?? 'Invoice' }}</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #111827;
        }

        .header {
            display: table;
            width: 100%;
            margin-bottom: 24px;
        }

        .header-left,
        .header-right {
            display: table-cell;
            vertical-align: top;
        }

        .header-right {
            text-align: right;
        }

        .company {
            font-size: 18px;
            font-weight: bold;
        }

        .title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 28px 0 18px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }

        th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
        }

        th {
            background: #f3f4f6;
        }

        .text-right {
            text-align: right;
        }

        .summary {
            margin-top: 20px;
            width: 45%;
            margin-left: auto;
        }

        .muted {
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="company">Victory Labs</div>
            <div class="muted">Garment Production</div>
        </div>

        <div class="header-right">
            <div><strong>No Invoice:</strong> {{ $invoice->no_invoice ?? '-' }}</div>
            <div><strong>Tanggal:</strong> {{ optional($invoice->created_at)->format('d/m/Y') }}</div>
            <div><strong>Jatuh Tempo:</strong> {{ $invoice->tgl_jatuh_tempo ?? '-' }}</div>
        </div>
    </div>

    <div class="title">INVOICE</div>

    <p>
        <strong>Customer:</strong><br>
        {{ $customer->nama ?? $pesanan->customer_nama_snapshot ?? '-' }}<br>
        {{ $customer->nama_perusahaan ?? $pesanan->customer_perusahaan_snapshot ?? '' }}
    </p>

    <table>
        <thead>
            <tr>
                <th>Deskripsi</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Harga / Pcs</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $invoice->title ?? $pesanan->requested_product_name ?? $pesanan->produk ?? '-' }}</td>
                <td class="text-right">{{ number_format($pesanan->quantity ?? $pesanan->q ?? 1, 0, ',', '.') }}</td>
                <td class="text-right">
                    Rp{{ number_format($pesanan->harga_jual_per_pcs ?? 0, 0, ',', '.') }}
                </td>
                <td class="text-right">
                    Rp{{ number_format($invoice->total_tagihan ?? $invoice->amount ?? 0, 0, ',', '.') }}
                </td>
            </tr>
        </tbody>
    </table>

    @php
        $totalPaid = $payments
            ->where('status', 'verified')
            ->sum('jumlah_bayar');

        $remaining = max(($invoice->total_tagihan ?? $invoice->amount ?? 0) - $totalPaid, 0);
    @endphp

    <table class="summary">
        <tr>
            <td>Total Tagihan</td>
            <td class="text-right">
                Rp{{ number_format($invoice->total_tagihan ?? $invoice->amount ?? 0, 0, ',', '.') }}
            </td>
        </tr>
        <tr>
            <td>Terbayar</td>
            <td class="text-right">
                Rp{{ number_format($totalPaid, 0, ',', '.') }}
            </td>
        </tr>
        <tr>
            <td><strong>Sisa</strong></td>
            <td class="text-right">
                <strong>Rp{{ number_format($remaining, 0, ',', '.') }}</strong>
            </td>
        </tr>
    </table>
</body>
</html>