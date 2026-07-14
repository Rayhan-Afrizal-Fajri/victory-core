<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $invoice->no_invoice ?? 'Invoice' }}</title>

    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10px; /* Ukuran font disesuaikan agar compact dan rapi */
            color: #111827;
            line-height: 1.4;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        td, th {
            vertical-align: top;
        }
        .text-center { text-align: center !important; }
        .text-right { text-align: right !important; }
        .text-left { text-align: left !important; }
        .font-bold { font-weight: bold !important; }

        .title {
            font-size: 22px;
            font-weight: bold;
            color: #0b5394; /* Warna Biru Tema */
            text-transform: capitalize;
            margin-bottom: 8px;
            align-items: center;
            width: 100%;
            text-align: center;
        }

        /* Header Section */
        .doc-header {
            margin-bottom: 20px;
        }
        .doc-title {
            font-size: 16px;
            font-weight: bold;
            color: #0b5394; /* Warna Biru Tema */
            text-transform: capitalize;
            margin-bottom: 8px;
        }
        .meta-table {
            width: auto;
            /* HAPUS float: right; dan ganti dengan margin di bawah ini */
            margin-left: auto; 
            margin-right: 0;
            font-size: 10px;
        }

        /* Border dihilangkan untuk Meta Table */
        .meta-table td {
            padding: 2px 8px;
            border: none; 
        }

         /* Address Section */
        .address-container {
            width: 100%;
            margin-top: 30px; /* Ini memberikan jarak dari tabel meta di atasnya */
            margin-bottom: 15px;
            clear: both; /* Ini KUNCI agar tabel tidak naik menabrak tabel di atasnya */
        }
        
        .address-title {
            font-size: 11px;
            font-weight: bold;
            color: #111827;
            padding-bottom: 4px;
            margin-bottom: 8px;
            border-bottom: 1px solid #111827; /* Garis Bawah Title */
        }
        .address-content {
            font-size: 10px;
            line-height: 1.5;
        }
        .company-name {
            font-size: 11px;
            font-weight: bold;
            color: #0b5394;
            margin-bottom: 3px;
        }

        /* Items Table (Tetap seperti sebelumnya) */
        .items-table {
            margin-top: 10px;
            border: 1px solid #d1d5db;
        }
        .items-table th {
            background-color: #0b5394;
            color: #ffffff;
            font-size: 10px;
            font-weight: bold;
            padding: 6px 8px;
            border: 1px solid #0b5394;
        }
        .items-table td {
            border: 1px solid #d1d5db;
            padding: 6px 8px;
            font-size: 10px;
        }
        .items-table .item-name {
            font-size: 11px;
            font-weight: bold;
            color: #111827;
        }
        .breakdown-tag {
            display: inline-block;
            color: #374151;
            font-size: 9px;
            margin-right: 4px;
            margin-top: 2px;
        }

        /* Section Pesan & Summary bersebelahan */
        .bottom-container {
            width: 100%;
            margin-top: 15px;
        }
        .pesan-list {
            padding-left: 12px;
            margin-top: 4px;
            margin-bottom: 0;
            line-height: 1.5;
            color: #111827;
            font-weight: regular;
        }
        .pesan-list li {
            margin-bottom: 2px;
        }

        /* Summary Table */
        .summary-table {
            width: 100%;
            font-size: 10px;
        }
        .summary-table td {
            padding: 4px 8px;
        }
        .summary-label {
            font-weight: bold;
            color: #111827;
        }
        .grand-total-row td {
            font-size: 12px;
            font-weight: bold;
            color: #111827;
        }

        /* Signature */
        .signature-container {
            width: 100%;
            margin-top: 30px;
            page-break-inside: avoid;
        }
        .signature-cell {
            text-align: center;
            width: 200px;
            float: right;
        }
        .signature-space {
            height: 60px;
        }
    </style>
</head>

<body>

    <table class="doc-header">
        <tr>
            <td style="width: 30%; vertical-align: top;">
                <img src="{{ public_path('images/logo.png') }}" alt="Victory Labs" style="max-height: 45px;">
            </td>
            <td style="width: 50%; vertical-align: top;" class="text-right">
                <div class="doc-title">INVOICE</div>
                <table class="meta-table">
                    <tr>
                        <td class="text-right" style="color: #111827;">No Invoice</td>
                        <td class="font-bold text-left">{{ $invoice->no_invoice }}</td>
                    </tr>
                    <tr>
                        <td class="text-right" style="color: #111827;">Kategori</td>
                        <td class="font-bold text-left">{{ ucfirst($invoice->kategori_invoice) }}</td>
                    </tr>
                    <tr>
                        <td class="text-right" style="color: #111827;">Tanggal</td>
                        <td class="text-left">{{ \Carbon\Carbon::parse($invoice->created_at)->format('d/m/Y') }}</td>
                    </tr>
                    <tr>
                        <td class="text-right" style="color: #111827;">Tgl. Jatuh Tempo</td>
                        <td class="text-left">{{ $invoice->tgl_jatuh_tempo ? \Carbon\Carbon::parse($invoice->tgl_jatuh_tempo)->format('d/m/Y') : '-' }}</td>
                    </tr>
                    <tr>
                        <td class="text-right" style="color: #111827;">Status</td>
                        <td class="text-left">
                            <span class="badge">
                                {{ strtoupper($invoice->status_tagihan) }}
                            </span>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="title">
        {{ $invoice->kategori_invoice === 'sample' ? 'SAMPLE' : '' }} <br>
        {{ $invoice->kategori_invoice === 'sample' ? 'PROFORMA ' : '' }}
        INVOICE
    </div>

    <table class="address-container">
        <tr>
            <!-- Informasi Perusahaan -->
            <td style="width: 50%; padding-right: 15px;">
                <div class="address-title">Informasi Perusahaan</div>
                <div class="address-content">
                    <div class="company-name">
                        {{ $invoice->jobTicket->companyProfile->company_name ?? 'PT. Victorylab Global Industries' }}
                    </div>
                    Headquarters : {!! nl2br(e($invoice->jobTicket->companyProfile->address ?? 'Ruko Kopo Plaza F - 9, Kota Bandung, Jawa Barat 40233')) !!}<br>
                    Telp: {{ $invoice->jobTicket->companyProfile->phone ?? '081212228900' }}<br>
                    Email: {{ $invoice->jobTicket->companyProfile->email ?? 'marketing@victorylabs.id' }} <br>
                    Rek: {{ $invoice->jobTicket->companyProfile->bank_type ?? 'Rekening' }} <br>
                    No Rek: {{ $invoice->jobTicket->companyProfile->account_number ?? 'Rekening' }}
                </div>
            </td>

            <!-- Penawaran Kepada -->
            <td style="width: 50%; padding-left: 15px;">
                <div class="address-title">Informasi Customer</div>
                <div class="address-content">
                    <div class="company-name">
                        {{ $invoice->jobTicket->customer_perusahaan_snapshot ?? $invoice->jobTicket->customer->nama_perusahaan ?? $invoice->jobTicket->customer->nama }}
                    </div>
                    {{ $invoice->jobTicket->customer->alamat ?? '' }}<br>
                    Telp: {{ $invoice->jobTicket->customer->kontak ?? $invoice->jobTicket->customer->no_hp ?? '-' }}<br>
                    Up: {{ $invoice->jobTicket->customer_nama_snapshot ?? $invoice->jobTicket->customer->nama }}
                </div>
            </td>
        </tr>
    </table>

    <table class="items-table">

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

            @foreach ($items as $index => $item)

                @php
                    // $pesanan = $item->pesanan;
                    // $kategoriInvoice = $invoice->kategori_invoice;
                    // $qty = $kategoriInvoice === 'sample'
                    //     ? ($pesanan->sample_qty ?? 0)
                    //     : ($pesanan->qty ?? $pesanan->quantity ?? 0);
                    // $price = $kategoriInvoice === 'sample'
                    //     ? ($pesanan->harga_sample_per_pcs ?? 0)
                    //     : ($pesanan->harga_jual_per_pcs ?? 0);

                    $subtotal = $item->subtotal ?? $item->quantity * $item->price_per_pcs;

                    $grandSubtotal += $subtotal;
                @endphp

                <tr>

                    <td class="text-center">
                        {{ $index + 1 }}
                    </td>

                    <td>

                        <strong>
                            {{ $item->item_name ?? '-' }}
                        </strong>

                        @if($item->pesanan && $item->pesanan->product)
                            <br>
                            <span style="font-size:9px;color:#6b7280">
                                {{ $item->pesanan->product->category }}
                            </span>
                        @endif

                    </td>

                    <td>                        
                        @if($item->pesanan && $item->pesanan->sizeBreakdowns && $item->pesanan->sizeBreakdowns->count() > 0)
                            <div style="font-size: 9px;">
                                @foreach($item->pesanan->sizeBreakdowns as $breakdown)
                                    <span class="breakdown-tag">
                                        {{ $breakdown->color ? $breakdown->color . ' - ' : '' }}<strong>{{ $breakdown->size_label }}</strong>: {{ $breakdown->qty }}pcs ({{ $breakdown->fabric_spec }})
                                    </span>
                                @endforeach
                            </div>
                        @endif
                    </td>

                    <td class="text-center">

                        {{ number_format($item->quantity) }}

                    </td>

                    <td class="text-right">

                        Rp {{ number_format($item->price_per_pcs,0,',','.') }}

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

    <table class="bottom-container">
        <tr>
            <!-- PESAN -->
            <td style="width: 60%; padding-right: 15px;">
                <div class="address-title">Pesan</div>
                <ul class="pesan-list">
                    <li>Untuk pembayaran mohon untuk ditransfer ke 
                        <b>{{ $invoice->jobTicket->companyProfile->bank_type ?? 'BCA' }}</b>, no acc 
                        <b>{{ $invoice->jobTicket->companyProfile->account_number ?? '453.12.06660' }}</b>, 
                        Atas nama <b>{{ strtoupper($invoice->jobTicket->companyProfile->account_name) ?? 'VICTOR HARLIM.MBA' }}</b>.
                    </li>
                </ul>
            </td>
           <!-- SUBTOTAL & TOTAL -->
            <td style="width: 40%; vertical-align: top;">
                <table class="summary-table">
                    <tr>
                        <td class="summary-label text-right">Subtotal</td>
                        <td class="text-right font-bold">Rp {{ number_format($grandSubtotal, 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td class="summary-label text-right">Total Amount</td>
                        <td class="text-right font-bold">Rp{{ number_format($invoice->total_tagihan ?? $invoice->amount ?? 0, 0, ',', '.') }}</td>
                    </tr>
                    <tr class="summary-label text-right">
                        <td class="summary-label text-right">Paid</td>
                        <td class="text-right font-bold">Rp {{ number_format($totalPaid, 0, ',', '.') }}</td>
                    </tr>
                    <tr class="grand-total-row">
                        <td class="text-right" style="padding-top: 10px;">Remaining</td>
                        <td class="text-right" style="padding-top: 10px;">Rp {{ number_format($remaining, 0, ',', '.') }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>