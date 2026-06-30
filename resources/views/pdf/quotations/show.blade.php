<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $quotation->quotation_number }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #1f2937;
            line-height: 1.4;
        }
        .container-table {
            width: 100%;
            border-collapse: collapse;
        }
        .logo-section {
            font-size: 18px;
            font-weight: bold;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .brand-sub {
            font-size: 9px;
            color: #6b7280;
            font-style: italic;
        }
        .doc-header-title {
            font-size: 22px;
            font-weight: bold;
            color: #111827;
            text-align: right;
            text-transform: uppercase;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
        }
        .items-table th {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 8px;
            font-weight: bold;
            text-align: left;
            color: #374151;
        }
        .items-table td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            vertical-align: top;
        }
        .text-right {
            text-align: right !important;
        }
        .text-center {
            text-align: center !important;
        }
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .summary-table td {
            padding: 5px 8px;
        }
        .terms-section {
            margin-top: 30px;
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 12px;
            border-radius: 4px;
        }
        .bank-box {
            margin-top: 12px;
            border-left: 3px solid #111827;
            padding-left: 10px;
        }
        .signature-container {
            width: 100%;
            margin-top: 40px;
        }
        .signature-cell {
            width: 50%;
            vertical-align: top;
        }
        .signature-space {
            height: 70px;
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

    <table class="container-table">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                <div class="logo-section">VICTORYLABS</div>
                <div class="brand-sub">Pursuit of Perfection</div>
            </td>
            <td style="width: 50%; vertical-align: top;" class="text-right">
                <div class="doc-header-title">Penawaran</div>
                <table style="float: right; margin-top: 5px; font-size: 11px;">
                    <tr>
                        <td style="padding: 2px 5px; color: #6b7280; text-align: right;">Nomor:</td>
                        <td style="padding: 2px 5px; font-weight: bold;">{{ $quotation->quotation_number }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 5px; color: #6b7280; text-align: right;">Tanggal:</td>
                        <td style="padding: 2px 5px;">{{ \Carbon\Carbon::parse($quotation->created_at)->format('d/m/Y') }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 5px; color: #6b7280; text-align: right;">Berlaku S/D:</td>
                        <td style="padding: 2px 5px;">{{ $quotation->valid_until ? \Carbon\Carbon::parse($quotation->valid_until)->format('d/m/Y') : '-' }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table class="container-table" style="margin-top: 25px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 15px;">
                <div style="font-weight: bold; font-size: 10px; color: #4b5563; text-transform: uppercase; margin-bottom: 5px;">Perusahaan:</div>
                <div style="font-size: 12px; font-weight: bold; color: #111827; margin-bottom: 3px;">
                    {{ $jobTicket->companyProfile->company_name ?? 'PT. Victorylab Global Industries' }}
                </div>
                <div style="color: #4b5563; font-size: 10px; line-height: 1.4;">
                    {!! nl2br(e($jobTicket->companyProfile->address ?? '')) !!}<br>
                    <strong>Telp:</strong> {{ $jobTicket->companyProfile->phone ?? '081212228900' }}<br>
                    <strong>Email:</strong> {{ $jobTicket->companyProfile->email ?? 'marketing@victorylabs.id' }}
                </div>
            </td>
            
            <td style="width: 50%; vertical-align: top; border-left: 1px solid #e5e7eb; padding-left: 15px;">
                <div style="font-weight: bold; font-size: 10px; color: #4b5563; text-transform: uppercase; margin-bottom: 5px;">Penawaran Kepada:</div>
                <div style="font-size: 12px; font-weight: bold; color: #111827; margin-bottom: 3px;">
                    {{ $jobTicket->customer->nama_perusahaan ?? "perusahaan" }}
                </div>
                <div style="color: #4b5563; font-size: 10px; line-height: 1.4;">
                    {{ $jobTicket->customer->alamat ?? '' }}<br>
                    <strong>Telp:</strong> {{ $jobTicket->customer->no_hp ?? '-' }}<br>
                    <strong>Up:</strong> {{ $jobTicket->customer->nama ?? "Nama" }}
                </div>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 25%;">Produk</th>
                <th style="width: 40%;">Deskripsi & Spesifikasi</th>
                <th style="width: 10%;" class="text-center">Kuantitas</th>
                <th style="width: 10%;" class="text-center">Satuan</th>
                <th style="width: 15%;" class="text-right">Harga</th>
                <th style="width: 15%;" class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($quotation->items as $index => $item)
                @php
                    // Ambil object pesanan yang sesuai dari list JobTicket untuk mengekstrak size breakdown
                    $pesanan = $jobTicket->pesanans->get($index);
                @endphp
                <tr>
                    <td>
                        <strong style="color: #111827;">{{ $item->item_name }}</strong>
                    </td>
                    <td>
                        <div style="color: #4b5563; font-size: 10px; margin-bottom: 4px;">
                            @if($item->fabric) <span>Bahan: {{ $item->fabric }}</span> @endif
                            @if($item->print_method) | <span>Metode: {{ $item->print_method }}</span> @endif
                        </div>
                        
                        @if($pesanan && $pesanan->sizeBreakdowns && $pesanan->sizeBreakdowns->count() > 0)
                            <div style="margin-top: 6px; font-size: 9px; border-top: 1px dashed #e5e7eb; padding-top: 4px;">
                                @foreach($pesanan->sizeBreakdowns as $breakdown)
                                    <span class="breakdown-tag">
                                        {{ $breakdown->color ? $breakdown->color . ' - ' : '' }}<strong>{{ $breakdown->size_label }}</strong>: {{ $breakdown->qty }}pcs ({{ $breakdown->fabric_spec }})
                                    </span>
                                @endforeach
                            </div>
                        @endif
                    </td>
                    <td class="text-center">{{ number_format($item->quantity, 0, ',', '.') }}</td>
                    <td class="text-center">Pcs</td>
                    <td class="text-right">Rp{{ number_format($item->price_per_pcs, 0, ',', '.') }}</td>
                    <td class="text-right">Rp{{ number_format($item->subtotal, 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="container-table" style="margin-top: 15px;">
        <tr>
            <td style="width: 50%;"></td>
            <td style="width: 50%;">
                <table class="summary-table">
                    <tr>
                        <td style="color: #4b5563;">Subtotal</td>
                        <td class="text-right">Rp{{ number_format($quotation->subtotal, 0, ',', '.') }}</td>
                    </tr>
                    
                    <tr>
                        <td style="color: #4b5563;">
                            Pajak PPN 
                            @if($jobTicket->companyProfile && $jobTicket->companyProfile->company_type === 'pkp')
                                ({{ $jobTicket->companyProfile->tax_percentage }}%)
                            @else
                                (0%)
                            @endif
                        </td>
                        <td class="text-right">Rp{{ number_format($quotation->tax ?? 0, 0, ',', '.') }}</td>
                    </tr>

                    @if($quotation->delivery_cost > 0)
                        <tr>
                            <td style="color: #4b5563;">Biaya Pengiriman</td>
                            <td class="text-right">Rp{{ number_format($quotation->delivery_cost, 0, ',', '.') }}</td>
                        </tr>
                    @endif
                    <tr style="font-weight: bold; font-size: 12px; border-top: 1px solid #d1d5db;">
                        <td style="padding-top: 6px; color: #111827;">Grand Total</td>
                        <td class="text-right" style="padding-top: 6px;">Rp{{ number_format($quotation->grand_total, 0, ',', '.') }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="terms-section">
        <strong style="color: #111827;">Syarat & Ketentuan:</strong>
        <div style="margin-top: 4px; color: #4b5563; font-size: 10px; line-height: 1.5;">
            @if($quotation->notes) <div>• {{ $quotation->notes }}</div> @endif
            @if($quotation->payment_terms) <div>• <strong>Pembayaran:</strong> {{ $quotation->payment_terms }}</div> @endif
            @if($quotation->delivery_terms) <div>• <strong>Pengiriman:</strong> {{ $quotation->delivery_terms }}</div> @endif
        </div>

        @if($jobTicket->companyProfile)
            <div class="bank-box">
                <span style="font-weight: bold; color: #111827;">Metode Pembayaran Transfer Rekening Resmi:</span><br>
                <span style="font-size: 11px; font-weight: bold; color: #111827;">
                    {{ $jobTicket->companyProfile->bank_type }} — {{ $jobTicket->companyProfile->account_number }}
                </span><br>
                <span style="color: #4b5563;">A/N: {{ $jobTicket->companyProfile->account_name }}</span>
            </div>
        @endif
    </div>

    <table class="signature-container">
        <tr>
            <td class="signature-cell">
                <p style="color: #4b5563;">Hormat Kami,</p>
                <div class="signature-space"></div>
                <p><strong>{{ $jobTicket->companyProfile->company_name ?? 'Victory Labs' }}</strong></p>
            </td>
        </tr>
    </table>

</body>
</html>