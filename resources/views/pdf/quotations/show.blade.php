<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $quotation->quotation_number }}</title>
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

        /* Header Section */
        .doc-header {
            margin-bottom: 20px;
        }
        .doc-title {
            font-size: 22px;
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
            /* margin-top: 4px; */
            margin-bottom: 0;
            line-height: 1.5;
            color: #111827;
            max-width: 100%;
        }
        .pesan-list li {
            margin-bottom: 2px;
        }
        
        /* Tambahkan kode ini di bagian bawah dalam tag <style> */
        .pesan-list li p {
            margin: 0 !important;
            padding: 0 !important;
            display: inline !important;
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
    <!-- Header: Logo & Meta Info -->
    <table class="doc-header">
        <tr>
            <td style="width: 30%; vertical-align: top;">
                <img src="{{ public_path('images/logo.png') }}" alt="Victory Labs" style="max-height: 45px;">
            </td>
            <td style="width: 50%; vertical-align: top;" class="text-right">
                <div class="doc-title">Penawaran</div>
                <table class="meta-table">
                    <tr>
                        <td class="text-right" style="color: #111827;">Nomor</td>
                        <td class="font-bold text-left">{{ $quotation->quotation_number }}</td>
                    </tr>
                    <tr>
                        <td class="text-right" style="color: #111827;">Tanggal</td>
                        <td class="text-left">{{ \Carbon\Carbon::parse($quotation->created_at)->format('d/m/Y') }}</td>
                    </tr>
                    <tr>
                        <td class="text-right" style="color: #111827;">Tgl. Jatuh Tempo</td>
                        <td class="text-left">{{ $quotation->valid_until ? \Carbon\Carbon::parse($quotation->valid_until)->format('d/m/Y') : '-' }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- Address Boxes (Dibuat full border-less, hanya garis bawah di title) -->
    <table class="address-container">
        <tr>
            <!-- Informasi Perusahaan -->
            <td style="width: 50%; padding-right: 15px;">
                <div class="address-title">Informasi Perusahaan</div>
                <div class="address-content">
                    <div class="company-name">
                        {{ $jobTicket->companyProfile->company_name ?? 'PT. Victorylab Global Industries' }}
                    </div>
                    Headquarters : {!! nl2br(e($jobTicket->companyProfile->address ?? 'Ruko Kopo Plaza F - 9, Kota Bandung, Jawa Barat 40233')) !!}<br>
                    Telp: {{ $jobTicket->companyProfile->phone ?? '081212228900' }}<br>
                    Email: {{ $jobTicket->companyProfile->email ?? 'marketing@victorylabs.id' }}
                </div>
            </td>

            <!-- Penawaran Kepada -->
            <td style="width: 50%; padding-left: 15px;">
                <div class="address-title">Penawaran Kepada</div>
                <div class="address-content">
                    <div class="company-name">
                        {{ $jobTicket->customer_perusahaan_snapshot ?? $jobTicket->customer->nama_perusahaan ?? $jobTicket->customer->nama }}
                    </div>
                    {{ $jobTicket->customer->alamat ?? '' }}<br>
                    Telp: {{ $jobTicket->customer->kontak ?? $jobTicket->customer->no_hp ?? '-' }}<br>
                    Up: {{ $jobTicket->customer_nama_snapshot ?? $jobTicket->customer->nama }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Items Table (Produk & Deskripsi) -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 25%;" class="text-center">Produk</th>
                <th style="width: 35%;" class="text-center">Deskripsi</th>
                <th style="width: 10%;" class="text-center">Kuantitas</th>
                <th style="width: 10%;" class="text-center">Satuan</th>
                <th style="width: 20%;" class="text-center">Harga</th>
            </tr>
        </thead>
        <tbody>
            @foreach($quotation->items as $index => $item)
                @php
                    $pesanan = $jobTicket->pesanans->get($index);
                @endphp
                <tr>
                    <td>
                        <div class="item-name">{{ $item->item_name }}</div>
                    </td>
                    <td>
                        @if($item->fabric || $item->print_method)
                            <div style="color: #4b5563;">
                                @if($item->fabric) <span>Bahan: {{ $item->fabric }}</span><br> @endif
                                @if($item->print_method) <span>Metode: {{ $item->print_method }}</span> @endif
                            </div>
                        @endif
                        
                        @if($pesanan && $pesanan->sizeBreakdowns && $pesanan->sizeBreakdowns->count() > 0)
                            <div style="margin-top: 4px;">
                                @foreach($pesanan->sizeBreakdowns as $breakdown)
                                    <span class="breakdown-tag">
                                        {{ $breakdown->color ? $breakdown->color . ' - ' : '' }}{{ $breakdown->size_label }}:{{ $breakdown->qty }}pcs
                                    </span>
                                @endforeach
                            </div>
                        @endif
                    </td>
                    <td class="text-center">{{ number_format($item->quantity, 0, ',', '.') }}</td>
                    <td class="text-center">Pcs</td>
                    <td class="text-right">{{ number_format($item->price_per_pcs, 0, ',', '.') }}</td>
                </tr>
            @endforeach
            
            @if($quotation->delivery_cost > 0)
            <tr>
                <td><div class="item-name">Ongkos Kirim</div></td>
                <td></td>
                <td class="text-center">1</td>
                <td class="text-center">Kirim</td>
                <td class="text-right">{{ number_format($quotation->delivery_cost, 0, ',', '.') }}</td>
            </tr>
            @endif
        </tbody>
    </table>

    <!-- Bottom Container (Pesan Kiri, Total Kanan) -->
    <table class="bottom-container">
        <tr>
            <!-- PESAN -->
            <td style="width: 60%; padding-right: 15px;">
                <div class="address-title">Pesan</div>
                <ul class="pesan-list">
                    @if ($quotation->quotationNotes)
                        @foreach ($quotation->quotationNotes as $note)
                            <li>{!! $note->notes !!}</li>                        
                        @endforeach
                    @endif
                    <li>Untuk pembayaran mohon untuk ditransfer ke 
                        {{ $jobTicket->companyProfile->bank_type ?? 'BCA' }}, no acc 
                        <b>{{ $jobTicket->companyProfile->account_number ?? '453.12.06660' }}</b>, 
                        Atas nama <b>{{ strtoupper($jobTicket->companyProfile->account_name) ?? 'VICTOR HARLIM.MBA' }}</b>.
                    </li>
                </ul>
            </td>

            <!-- SUBTOTAL & TOTAL -->
            <td style="width: 40%; vertical-align: top;">
                <table class="summary-table">
                    <tr>
                        <td class="summary-label text-right">Subtotal</td>
                        <td class="text-right font-bold">Rp {{ number_format($quotation->subtotal, 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td class="summary-label text-right">
                            Pajak PPN
                            @if($jobTicket->companyProfile && $jobTicket->companyProfile->company_type === 'pkp')
                                ({{ $jobTicket->companyProfile->tax_percentage }}%)
                            @endif
                        </td>
                        <td class="text-right font-bold">Rp {{ number_format($quotation->tax, 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td class="summary-label text-right">Biaya Pengiriman</td>
                        <td class="text-right font-bold">Rp{{ number_format($quotation->delivery_cost, 0, ',', '.') }}</td>
                    </tr>
                    <tr class="grand-total-row">
                        <td class="text-right" style="padding-top: 10px;">Total</td>
                        <td class="text-right" style="padding-top: 10px;">Rp {{ number_format($quotation->grand_total, 0, ',', '.') }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    @php
        $signature = storage_path('app/public/' . $owner->signature);
    @endphp
    <!-- Signature (Tanya Direktur Saja) -->
    <table class="signature-container">
        <tr>
            <td style="width: 65%;"></td> <!-- Spacer Kiri -->
            <td class="signature-cell">
                <p style="color: #111827;">Dengan Hormat,</p>
                <div class="signature-space">
                   <img src={{ $signature }} alt="" style="max-height: 50px;">
                </div>
                <p style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">{{ $owner->name ?? 'Nama Direktur' }}</p>
                <p style="margin-top: 0; color: #111827;">Direktur</p>
            </td>
        </tr>
    </table>

</body>
</html>