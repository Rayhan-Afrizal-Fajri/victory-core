<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Support\Facades\Notification;

class NotificationService
{
    /**
     * Helper general untuk mengirim notifikasi berdasarkan permission
     */
    public static function notifyByPermission(string $permission, string $title, string $message, string $url, string $type = 'info', ?int $actorId = null): void
    {
        $users = User::permission($permission)->get();

        if ($users->isNotEmpty()) {
            Notification::send($users, new SystemNotification($title, $message, $url, $type, $actorId));
        }
    }

    /**
     * Helper untuk mengirim notifikasi langsung ke daftar User
     */
    public static function notifyUsers($users, string $title, string $message, string $url, string $type = 'info', ?int $actorId = null): void
    {
        $userCollection = collect($users);
        if ($userCollection->isNotEmpty()) {
            Notification::send($userCollection, new SystemNotification($title, $message, $url, $type, $actorId));
        }
    }

    /**
     * Method spesifik untuk Approval Desain
     */
    public static function sendDesignApprovalNotification($pesanan, ?int $actorId = null): void
    {
        self::notifyByPermission(
            'designs.approve',
            'Desain Menunggu Approval',
            "Desain untuk produk '{$pesanan->produk}' telah diunggah dan menunggu persetujuan Anda.",
            "/purchase-orders/{$pesanan->job_ticket_id}?tab=design",
            'info',
            $actorId
        );
    }

    /**
     * Desain disetujui -> notifikasi ke tim BOM / Produksi
     */
    public static function sendDesignApprovedNotification($pesanan, ?int $actorId = null): void
    {
        self::notifyByPermission(
            'boms.sync',
            'Desain Disetujui',
            "Desain untuk produk '{$pesanan->produk}' telah disetujui, silakan sinkronkan spesifikasi BOM.",
            "/purchase-orders/{$pesanan->job_ticket_id}?tab=design",
            'success',
            $actorId
        );
    }

    /**
     * Quotation menunggu approval
     */
    public static function sendQuotationApprovalNotification($quotation, $jobTicket, ?int $actorId = null): void
    {
        self::notifyByPermission(
            'quotation.approve',
            'Quotation Baru Dibuat',
            "Surat penawaran {$quotation->quotation_number} untuk PO {$jobTicket->no_job_ticket} telah dibuat dan menunggu persetujuan.",
            "/purchase-orders/{$jobTicket->id}?tab=overview",
            'info',
            $actorId
        );
    }

    /**
     * Quotation disetujui
     */
    public static function sendQuotationApprovedNotification($quotation, $jobTicket, ?int $actorId = null): void
    {
        self::notifyByPermission(
            'quotation.approve',
            'Quotation Disetujui',
            "Surat penawaran {$quotation->quotation_number} untuk PO {$jobTicket->no_job_ticket} telah disetujui.",
            "/purchase-orders/{$jobTicket->id}?tab=overview",
            'success',
            $actorId
        );
    }

    /**
     * Invoice terbit (Sample / Produksi)
     */
    public static function sendInvoiceCreatedNotification($invoice, $jobTicket, string $categoryLabel = 'Produksi', ?int $actorId = null): void
    {
        self::notifyByPermission(
            'invoices.pay',
            "Invoice {$categoryLabel} Diterbitkan",
            "Invoice {$categoryLabel} {$invoice->no_invoice} untuk PO {$jobTicket->no_job_ticket} telah diterbitkan.",
            "/purchase-orders/{$jobTicket->id}?tab=invoices",
            'info',
            $actorId
        );
    }

    /**
     * Pembayaran diinput -> notifikasi ke finance untuk diverifikasi
     */
    public static function sendPaymentSubmittedNotification($invoice, $payment, ?int $actorId = null): void
    {
        $amountFmt = 'Rp ' . number_format($payment->jumlah_bayar, 0, ',', '.');
        self::notifyByPermission(
            'payment.verify',
            'Pembayaran Menunggu Verifikasi',
            "Pembayaran sebesar {$amountFmt} untuk invoice {$invoice->no_invoice} telah diinput dan menunggu verifikasi finance.",
            "/purchase-orders/{$invoice->job_ticket_id}?tab=invoices",
            'info',
            $actorId
        );
    }

    /**
     * Pembayaran diverifikasi
     */
    public static function sendPaymentVerifiedNotification($invoice, $payment, ?int $actorId = null): void
    {
        $amountFmt = 'Rp ' . number_format($payment->jumlah_bayar, 0, ',', '.');
        self::notifyByPermission(
            'invoices.pay',
            'Pembayaran Terverifikasi',
            "Pembayaran sebesar {$amountFmt} untuk invoice {$invoice->no_invoice} telah diverifikasi oleh finance.",
            "/purchase-orders/{$invoice->job_ticket_id}?tab=invoices",
            'success',
            $actorId
        );
    }