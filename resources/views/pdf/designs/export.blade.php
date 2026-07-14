<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Design History</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #111827; font-size: 12px; }
        .header { margin-bottom: 18px; padding-bottom: 10px; border-bottom: 2px solid #1d4ed8; }
        .title { font-size: 18px; font-weight: bold; margin: 0 0 4px; }
        .meta { color: #4b5563; margin: 2px 0; }
        .card { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; margin-bottom: 14px; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
        .status-approved { background: #dcfce7; color: #166534; }
        .status-revision-needed { background: #fef3c7; color: #92400e; }
        .status-default { background: #e5e7eb; color: #374151; }
        .image { max-width: 100%; margin-top: 10px; border: 1px solid #e5e7eb; border-radius: 6px; }
        .notes { margin-top: 8px; padding: 8px; font-size: 11px; border-radius: 6px; }
        .notes.revision { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .notes.designer { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
        .footer { margin-top: 20px; font-size: 10px; color: #6b7280; text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">Riwayat Desain</h1>
        <p class="meta">Pesanan: {{ $pesanan->produk ?? $pesanan->requested_product_name ?? 'Tanpa nama' }}</p>
        <p class="meta">Jumlah: {{ $pesanan->q ?? 0 }} pcs</p>
        <p class="meta">Tanggal export: {{ now()->translatedFormat('d F Y H:i') }}</p>
    </div>

    @forelse ($designs as $design)
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <strong>#{{ $design->id }}</strong>
                <span class="badge {{ $design->status === 'approved' ? 'status-approved' : ($design->status === 'revision_needed' ? 'status-revision-needed' : 'status-default') }}">
                    {{ str_replace('_', ' ', $design->status) }}
                </span>
            </div>

            <p class="meta">Diunggah: {{ $design->uploaded_at ? \Carbon\Carbon::parse($design->uploaded_at)->translatedFormat('d F Y H:i') : 'Tidak tercatat' }}</p>
            <p class="meta">Disetujui: {{ $design->approved_at ? \Carbon\Carbon::parse($design->approved_at)->translatedFormat('d F Y H:i') : 'Belum disetujui' }}</p>

            {{-- @if ($design->file_path)
                <img class="image" src="{{ public_path('storage/' . $design->file_path) }}" alt="Design {{ $design->id }}">
            @else
                <p class="meta">Tidak ada file desain.</p>
            @endif --}}

            @php
                $isPdf = \Illuminate\Support\Str::endsWith(strtolower($design->file_path), '.pdf');
            @endphp

            @if ($design->file_path)
                @if ($isPdf)
                    <div style="padding:12px; border:1px solid #ccc; border-radius:6px;">
                        <strong>📄 File Desain (PDF)</strong><br>
                        {{ basename($design->file_path) }}
                    </div>
                @else
                    <img class="image" src="{{ public_path('storage/'.$design->file_path) }}">
                @endif
            @endif

            @if ($design->revision_note)
                <div class="notes revision">
                    <strong>Catatan Revisi:</strong><br>
                    {{ $design->revision_note }}
                </div>
            @endif

            @if ($design->designer_revision_note)
                <div class="notes designer">
                    <strong>Catatan Designer:</strong><br>
                    {{ $design->designer_revision_note }}
                </div>
            @endif
        </div>
    @empty
        <p>Tidak ada desain yang tersedia untuk diekspor.</p>
    @endforelse

    <div class="footer">
        Dibuat otomatis dari sistem Victory Core
    </div>
</body>
</html>
