<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $invoice->no_invoice ?? 'Invoice' }}</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #1f2937;
            line-height: 1.45;
        }

        * {
            box-sizing: border-box;
        }

        .header {
            width: 100%;
            margin-bottom: 18px;
        }

        .header-table {
            width: 100%;
            border: none;
        }

        .header-table td {
            border: none;
            vertical-align: top;
            padding: 0;
        }

        .company-name {
            font-size: 22px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 2px;
        }

        .company-type {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 8px;
        }

        .company-info {
            font-size: 10px;
            color: #374151;
            line-height: 1.6;
        }

        .document-title {
            font-size: 24px;
            font-weight: bold;
            text-align: right;
            letter-spacing: 1px;
            color: #111827;
            margin-bottom: 12px;
        }

        .info-table {
            width: 100%;
            border: none;
        }

        .info-table td {
            border: none;
            padding: 2px 0;
            font-size: 10px;
        }

        .info-table td:first-child {
            width: 95px;
            color: #6b7280;
        }

        .section-title {
            margin-top: 18px;
            margin-bottom: 6px;
            font-weight: bold;
            font-size: 12px;
            color: #111827;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 4px;
        }

        .customer-table {
            width: 100%;
            border: none;
            margin-bottom: 18px;
        }

        .customer-table td {
            border: none;
            padding: 2px 0;
            font-size: 10px;
        }

        .customer-table td:first-child {
            width: 95px;
            color: #6b7280;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th,
        td {
            border: 1px solid #d1d5db;
            padding: 7px;
        }

        th {
            background: #f3f4f6;
            font-size: 10px;
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .summary {
            width: 42%;
            margin-left: auto;
            margin-top: 18px;
        }

        .summary td:first-child {
            background: #f9fafb;
            font-weight: bold;
        }

        .payment-box {
            margin-top: 24px;
        }

        .footer {
            margin-top: 40px;
            font-size: 10px;
            color: #6b7280;
            text-align: center;
        }

        .badge {
            display: inline-block;
            border: 1px solid #9ca3af;
            padding: 3px 8px;
            font-size: 10px;
            font-weight: bold;
            border-radius: 3px;
        }

        .breakdown-tag {
            display: inline-block;
            background: #f3f4f6;
            color: #4b5563;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 9px;
            margin-right: 4px;
            margin-top: 3px;
        }
    </style>
</head>

<body>

    <div class="header">

        <table class="header-table">

            <tr>

                <td width="60%">

                    <div class="company-name">
                        {{ $company->company_name ?? 'Victory Labs' }}
                    </div>

                    <div class="company-info">

                        {{ $company->address ?? '-' }}

                        <br>

                        Bank :
                        {{ $company->bank_type ?? '-' }}

                        <br>

                        No. Rek :
                        {{ $company->account_number ?? '-' }}

                    </div>

                </td>

                <td width="40%" align="right">

                    <div class="document-title">
                        INVOICE
                    </div>

                    <table class="info-table">

                        <tr>
                            <td>No Invoice</td>
                            <td>: {{ $invoice->no_invoice }}</td>
                        </tr>

                        <tr>
                            <td>Kategori</td>
                            <td>: {{ ucfirst($invoice->kategori_invoice) }}</td>
                        </tr>

                        <tr>
                            <td>Tanggal</td>
                            <td>: {{ optional($invoice->created_at)->format('d M Y') }}</td>
                        </tr>

                        <tr>
                            <td>Jatuh Tempo</td>
                            <td>: {{ $invoice->tgl_jatuh_tempo }}</td>
                        </tr>

                        <tr>
                            <td>Status</td>
                            <td>
                                :
                                <span class="badge">
                                    {{ strtoupper($invoice->status_tagihan) }}
                                </span>
                            </td>
                        </tr>

                    </table>

                </td>

            </tr>

        </table>

    </div>

    <div class="section-title">
        Customer Information
    </div>

    <table class="customer-table">

        <tr>
            <td>Nama</td>
            <td>: {{ $customer->nama ?? '-' }}</td>
        </tr>

        <tr>
            <td>Perusahaan</td>
            <td>: {{ $customer->nama_perusahaan ?? '-' }}</td>
        </tr>

        <tr>
            <td>Email</td>
            <td>: {{ optional($customer->user)->email ?? '-' }}</td>
        </tr>

        <tr>
            <td>No. HP</td>
            <td>: {{ $customer->no_hp ?? '-' }}</td>
        </tr>

        <tr>
            <td>Alamat</td>
            <td>: {{ $customer->alamat ?? '-' }}</td>
        </tr>

    </table>

    <div class="section-title">
    Detail Produk
    </div>

    <table>

        <thead>

            <tr>
                <th width="4%">No</th>
                <th width="24%">Produk</th>
                <th>Deskripsi</th>
                <th width="10%">Qty</th>
                <th width="16%">Harga / Pcs</th>
                <th width="18%">Subtotal</th>
            </tr>

        </thead>

        <tbody>

            @php
                $grandSubtotal = 0;
            @endphp

            @foreach ($pesanans as $index => $pesanan)

                @php
                    $qty = $invoice->kategori_invoice === 'sample'
                        ? ($pesanan->sample_qty ?? 0)
                        : ($pesanan->q ?? $pesanan->quantity ?? 0);

                    $price = $pesanan->harga_jual_per_pcs ?? 0;

                    $subtotal = $qty * $price;

                    $grandSubtotal += $subtotal;
                @endphp

                <tr>

                    <td class="text-center">
                        {{ $index + 1 }}
                    </td>

                    <td>

                        <strong>
                            {{ $pesanan->requested_product_name ?? $pesanan->produk ?? '-' }}
                        </strong>

                        @if($pesanan->product)
                            <br>
                            <span style="font-size:9px;color:#6b7280">
                                {{ $pesanan->product->category }}
                            </span>
                        @endif

                    </td>

                    <td>                        
                        @if($pesanan && $pesanan->sizeBreakdowns && $pesanan->sizeBreakdowns->count() > 0)
                            <div style="font-size: 9px;">
                                @foreach($pesanan->sizeBreakdowns as $breakdown)
                                    <span class="breakdown-tag">
                                        {{ $breakdown->color ? $breakdown->color . ' - ' : '' }}<strong>{{ $breakdown->size_label }}</strong>: {{ $breakdown->qty }}pcs ({{ $breakdown->fabric_spec }})
                                    </span>
                                @endforeach
                            </div>
                        @endif
                    </td>

                    <td class="text-center">

                        {{ number_format($qty) }}

                    </td>

                    <td class="text-right">

                        Rp {{ number_format($price,0,',','.') }}

                    </td>

                    <td class="text-right">

                        Rp {{ number_format($subtotal,0,',','.') }}

                    </td>

                </tr>

            @endforeach

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