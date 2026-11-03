<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $suratJalan->surat_jalan_number ?? 'Surat Jalan' }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10px;
            color: #111827;
            line-height: 1.4;
            margin: 25px 30px;
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
            margin-bottom: 25px;
        }
        .doc-title {
            font-size: 22px;
            font-weight: bold;
            color: #0b5394;
            text-transform: capitalize;
            margin-bottom: 6px;
        }
        .meta-table {
            width: auto;
            margin-left: auto; 
            margin-right: 0;
            font-size: 10px;
        }
        .meta-table td {
            padding: 2px 6px;
            border: none; 
        }

        /* Address Section */
        .address-container {
            width: 100%;
            margin-top: 15px;
            margin-bottom: 20px;
            clear: both;
        }
        .address-title {
            font-size: 11px;
            font-weight: bold;
            color: #111827;
            padding-bottom: 4px;
            margin-bottom: 8px;
            border-bottom: 1px solid #111827;
        }
        .address-content {
            font-size: 10px;
            line-height: 1.5;
        }
        .company-name {
            font-size: 11px;
            font-weight: bold;
            color: #0b5394;
            margin-bottom: 4px;
        }

        /* Items Table */
        .items-table {
            margin-top: 15px;
            margin-bottom: 20px;
            border: 1px solid #d1d5db;
        }
        .items-table th {
            background-color: #0b5394;
            color: #ffffff;
            font-size: 10px;
            font-weight: bold;
            padding: 7px 10px;
            border: 1px solid #0b5394;
        }
        .items-table td {
            border: 1px solid #d1d5db;
            padding: 7px 10px;
            font-size: 10px;
        }
        .items-table .item-name {
            font-size: 10px;
            font-weight: bold;
            color: #111827;
        }
        .total-row td {
            background-color: #f9fafb;
            font-weight: bold;
            font-size: 10px;
        }

        /* Section Pesan */
        .section-pesan {
            margin-top: 20px;
            page-break-inside: avoid;
        }
        .pesan-statement {
            font-size: 10px;
            line-height: 1.5;
            color: #111827;
        }
        .pesan-list {
            margin-top: 4px;
            margin-bottom: 0;
            padding-left: 20px;
            line-height: 1.6;
        }
        .pesan-list li {
            margin-bottom: 4px;
        }

        /* Kurir Info */
        .courier-box {
            margin-top: 12px;
            padding: 6px 10px;
            background-color: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 4px;
            font-size: 9px;
            color: #0369a1;
        }

        /* Signature Section */
        .signature-container {
            width: 100%;
            margin-top: 35px;
            page-break-inside: avoid;
        }
        .signature-cell {
            text-align: center;
            width: 50%;
        }
        .signature-space {
            height: 60px;
            line-height: 60px;
        }
    </style>
</head>
<body>

    <!-- Header: Logo & Meta Info -->
    <table class="doc-header">
        <tr>
            <td style="width: 40%; vertical-align: top;">
                @if(file_exists(public_path('images/logo.png')))
                    <img src="{{ public_path('images/logo.png') }}" alt="Victory Labs" style="max-height: 42px;">
                @else
                    <div style="font-size: 18px; font-weight: bold; color: #0b5394;">VICTORYLABS</div>
                @endif
                <div style="font-size: 8px; color: #4b5563; font-weight: 500; margin-top: 3px; letter-spacing: 0.5px;">
                    Pursuit of Perfection
                </div>
            </td>
            <td style="width: 60%; vertical-align: top;" class="text-right">
                <div class="doc-title">Surat Jalan</div>
                <table class="meta-table">
                    <tr>
                        <td class="text-right" style="color: #111827;">Nomor</td>
                        <td class="font-bold text-left" style="min-width: 90px;">{{ $suratJalan->surat_jalan_number }}</td>
                    </tr>
                    <tr>
                        <td class="text-right" style="color: #111827;">Tanggal</td>
                        <td class="text-left">{{ \Carbon\Carbon::parse($suratJalan->delivery_date)->format('d/m/Y') }}</td>
                    </tr>
                    @if($suratJalan->jobTicket)
                    <tr>
                        <td class="text-right" style="color: #6b7280;">No. Job Ticket</td>
                        <td class="text-left" style="color: #6b7280;">{{ $suratJalan->jobTicket->no_job_ticket }}</td>
                    </tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>

    <!-- Address Boxes (Informasi Perusahaan & Kepada) -->
    <table class="address-container">
        <tr>
            <!-- Informasi Perusahaan -->
            <td style="width: 48%; padding-right: 15px;">
                <div class="address-title">Informasi Perusahaan</div>
                <div class="address-content">
                    <div class="company-name">
                        {{ $companyProfile?->company_name ?? 'CV. Victory Mitra Lestari' }}
                    </div>
                    Headquarters : Ruko Kopo Plaza F - 9,<br>
                    Kota Bandung, Jawa Barat 40233<br>
                    Branch Office : Jl.Teuku Umar Barat<br>
                    No.19M,Kota Denpasar,Bali 80117<br>
                    Telp: 081212228900
                </div>
            </td>

            <!-- Spacer -->
            <td style="width: 4%;"></td>

            <!-- Kepada -->
            <td style="width: 48%; padding-left: 5px;">
                <div class="address-title">Kepada</div>
                <div class="address-content">
                    <div class="company-name">
                        {{ $suratJalan->customer_company_snapshot ?: $suratJalan->customer_name_snapshot ?: 'Customer' }}
                    </div>
                    {!! nl2br(e($suratJalan->customer_address_snapshot ?? '-')) !!}<br>
                    Telp: {{ $suratJalan->customer_phone_snapshot ?? '-' }} 
                    @if($suratJalan->customer_pic_snapshot)
                        &nbsp;Up : {{ $suratJalan->customer_pic_snapshot }}
                    @endif
                </div>
            </td>
        </tr>
    </table>

    @if($suratJalan->courier_name || $suratJalan->tracking_number)
    <!-- Info Ekspedisi / Kurir -->
    <div class="courier-box">
        <strong>Pengiriman via:</strong> {{ $suratJalan->courier_name ?? 'Kurir' }}
        @if($suratJalan->tracking_number)
            &nbsp;|&nbsp; <strong>No. Resi / Tracking:</strong> {{ $suratJalan->tracking_number }}
        @endif
        @if($suratJalan->notes)
            &nbsp;|&nbsp; <strong>Catatan:</strong> {{ $suratJalan->notes }}
        @endif
    </div>
    @endif

    <!-- Items Table (Produk, Deskripsi, Kuantitas, Satuan) -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 25%;" class="text-left">Produk</th>
                <th style="width: 45%;" class="text-left">Deskripsi</th>
                <th style="width: 15%;" class="text-center">Kuantitas</th>
                <th style="width: 15%;" class="text-center">Satuan</th>
            </tr>
        </thead>
        <tbody>
            @forelse($suratJalan->items as $item)
                <tr>
                    <td class="item-name">{{ $item->product_name }}</td>
                    <td>{{ $item->description }}</td>
                    <td class="text-center font-bold">{{ number_format($item->quantity, 0, ',', '.') }}</td>
                    <td class="text-center">{{ $item->unit ?? 'Pcs' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" class="text-center" style="padding: 15px; color: #6b7280;">
                        Tidak ada rincian item pengiriman.
                    </td>
                </tr>
            @endforelse
            <tr class="total-row">
                <td colspan="2" class="text-right" style="padding-right: 15px;">Total Kuantitas</td>
                <td class="text-center">{{ number_format($suratJalan->total_quantity, 0, ',', '.') }}</td>
                <td></td>
            </tr>
        </tbody>
    </table>

    <!-- Section Pesan -->
    <div class="section-pesan">
        <div class="address-title">Pesan</div>
        <div class="pesan-statement">
            <p style="margin-top: 6px; margin-bottom: 4px; font-weight: bold;">Menyatakan bahwa barang yang diterima :</p>
            <ol class="pesan-list">
                <li>Telah dikirim sesuai dengan spesifikasi dan jangka waktu pengiriman sebagaimana yang ditetapkan dalam Purchase Order (PO) dan dokumen lainnya;</li>
                <li>Dalam keadaan baik dan bebas dari segala cacat dan/atau kerusakan dalam bentuk apapun, serta dapat berfungsi dan digunakan sebagaimana mestinya.</li>
            </ol>
        </div>
    </div>

    @php
        $signaturePath = $owner?->signature ? storage_path('app/public/' . $owner->signature) : null;
        $signature = ($signaturePath && file_exists($signaturePath)) ? $signaturePath : null;
        if (!$signature) {
            $available = glob(storage_path('app/public/signatures/*.png'));
            if (!empty($available)) {
                $signature = $available[0];
            }
        }
    @endphp

    <!-- Signatures -->
    <table class="signature-container">
        <tr>
            <!-- Diterima Oleh -->
            <td class="signature-cell" style="text-align: left; padding-left: 30px;">
                <p style="color: #111827; margin-bottom: 0;">Diterima Oleh</p>
                <div class="signature-space"></div>
                <p style="margin-top: 0; color: #111827;">(.............................)</p>
            </td>

            <!-- Dengan Hormat -->
            <td class="signature-cell" style="text-align: right; padding-right: 30px;">
                <p style="color: #111827; margin-bottom: 0;">Dengan Hormat,</p>
                <div class="signature-space">
                    @if($signature)
                        <img src="{{ $signature }}" alt="" style="max-height: 52px; vertical-align: middle;">
                    @endif
                </div>
                <p style="margin-top: 0; font-weight: bold; color: #0b5394;">VictoryLabs</p>
            </td>
        </tr>
    </table>

</body>
</html>
