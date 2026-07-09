<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\SignatureService;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'info' => $request->session()->get('info'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request, SignatureService $signatureService): RedirectResponse
    {
        $user = $request->user();
        
        // 1. Ambil semua data yang sudah divalidasi dulu (jangan di-fill ke user sekarang)
        $validated = $request->validated();

        // 2. PROSES SIGNATURE
        if ($request->filled('signature') && str_contains($request->signature, 'base64')) {
            // Ubah base64 menjadi file fisik .png
            $path = $signatureService->saveBase64(
                $request->signature, 
                $user->signature // Path file lama untuk dihapus otomatis
            );
            
            // Ganti teks base64 di array dengan path file yang pendek
            $validated['signature'] = $path;
        } else {
            // Jika tidak ada input, hapus dari array agar tidak menimpa data lama jadi null
            unset($validated['signature']);
        }

        // 3. SEKARANG baru kita masukkan data yang sudah final (termasuk path gambar) ke model
        $user->fill($validated);

        // 4. Pengecekan email bawaan Laravel Breeze
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        // 5. Simpan ke database!
        $user->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
