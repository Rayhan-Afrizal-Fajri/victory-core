<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $quotation->quotation_number }}</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #111827;
            line-height: 1.5;
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

        .company-name {
            font-size: 18px;
            font-weight: bold;
        }

        .muted {
            color: #6b7280;
        }

        .title {
            margin: 24px 0 12px;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            text-decoration: underline;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }

        th {
            background: #f3f4f6;
            font-weight: bold;
        }

        th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
        }

        .text-right {
            text-align: right;
        }

        .terms {
            margin-top: 20px;
        }

        .signature {
            margin-top: 48px;
            display: table;
            width: 100%;
        }

        .signature-col {
            display: table-cell;
            width: 50%;
            text-align: center;
            vertical-align: bottom;
        }

        .signature-space {
            height: 72px;
        }

        .total-row td {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="company-name">Victory Labs</div>
            <div class="muted">Garment Production</div>
            <div class="muted">Surat Penawaran Harga</div>
        </div>

        <div class="header-right">
            <div><strong>No:</strong> {{ $quotation->quotation_number }}</div>
            <div><strong>Tanggal:</strong> {{ $quotation->created_at->format('d/m/Y') }}</div>
            <div><strong>Valid Until:</strong> {{ optional($quotation->valid_until)->format('d/m/Y') ?? '-' }}</div>
        </div>
    </div>

    <p>Kepada Yth,</p>
    <p>
        <strong>{{ $customer->nama ?? $pesanan->customer_nama_snapshot ?? '-' }}</strong><br>
        {{ $customer->nama_perusahaan ?? $pesanan->customer_perusahaan_snapshot ?? '' }}
    </p>

    <div class="title">SURAT PENAWARAN HARGA</div>

    <p>
        Bersama ini kami sampaikan penawaran harga untuk kebutuhan produksi
        <strong>{{ $pesanan->requested_product_name ?? $pesanan->produk }}</strong>
        dengan rincian sebagai berikut:
    </p>

    <table>
        <thead>
            <tr>
                <th style="width: 30px;">No</th>
                <th>Item</th>
                <th>Fabric</th>
                <th>Print</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price / Pcs</th>
                <th class="text-right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($quotation->items as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $item->item_name }}</td>
                    <td>{{ $item->fabric ?? '-' }}</td>
                    <td>{{ $item->print_method ?? '-' }}</td>
                    <td class="text-right">{{ number_format($item->quantity, 0, ',', '.') }}</td>
                    <td class="text-right">Rp{{ number_format($item->price_per_pcs, 0, ',', '.') }}</td>
                    <td class="text-right">Rp{{ number_format($item->subtotal, 0, ',', '.') }}</td>
                </tr>
            @endforeach

            <tr>
                <td colspan="6" class="text-right">Subtotal</td>
                <td class="text-right">Rp{{ number_format($quotation->subtotal, 0, ',', '.') }}</td>
            </tr>

            <tr>
                <td colspan="6" class="text-right">Tax</td>
                <td class="text-right">Rp{{ number_format($quotation->tax, 0, ',', '.') }}</td>
            </tr>

            <tr>
                <td colspan="6" class="text-right">Delivery Cost</td>
                <td class="text-right">Rp{{ number_format($quotation->delivery_cost, 0, ',', '.') }}</td>
            </tr>

            <tr class="total-row">
                <td colspan="6" class="text-right">Grand Total</td>
                <td class="text-right">Rp{{ number_format($quotation->grand_total, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <div class="terms">
        <p><strong>Terms & Conditions:</strong></p>

        @if ($quotation->notes)
            <p>{{ $quotation->notes }}</p>
        @endif

        @if ($quotation->payment_terms)
            <p><strong>Payment:</strong> {{ $quotation->payment_terms }}</p>
        @endif

        @if ($quotation->delivery_terms)
            <p><strong>Delivery:</strong> {{ $quotation->delivery_terms }}</p>
        @endif
    </div>

    <div class="signature">
        <div class="signature-col">
            <p>Hormat Kami,</p>
            <div class="signature-space"></div>
            <p><strong>Victory Labs</strong></p>
        </div>

        <div class="signature-col">
            <p>Disetujui Oleh,</p>

            @if ($quotation->signature_path)
                <div style="height: 72px;">
                    <img
                        src="{{ storage_path('app/public/' . $quotation->signature_path) }}"
                        style="max-height: 70px; max-width: 180px;"
                    >
                </div>
            @else
                <div class="signature-space"></div>
            @endif

            <p>
                <strong>{{ $quotation->approved_by_name ?? 'Customer' }}</strong>
            </p>
        </div>
    </div>
</body>
</html>