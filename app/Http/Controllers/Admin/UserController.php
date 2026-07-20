<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $users = User::query()
            ->with('roles:id,name')
            ->latest()
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_active' => $user->is_active,
                'roles' => $user->roles->map(fn ($role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                ])->all(),
                'role' => $user->roles?->first()->name,
            ]);

        $roles = Role::query()
            ->with('permissions:id,name')
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'description' => $role->description,
                'permissions' => $role->permissions->map(fn ($permission) => [
                    'id' => $permission->id,
                    'name' => $permission->name,
                ])->all(),
                'users_count' => $role->users_count,
            ]);

        $permissions = Permission::query()
            ->select('id', 'name')
            ->orderBy('id')
            ->get();

        return Inertia::render('admin/users/Index', [
            'users' => $users,
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'min:8'], 
            'role' => ['required', 'exists:roles,name'],  
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
        ]);

        $user->assignRole($validated['role']);

        return back()->with('success', 'User berhasil dibuat');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        if ($user->hasRole('owner')) {
            return back()->with('error', 'User owner tidak dapat diubah.');
        }

        // dd($request->all());

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 
                'email', 
                Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'min:8'], 
            'role_id' => ['required', 'exists:roles,id'], 
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'] ? bcrypt($validated['password']) : $user->password,
        ]);

        $role = Role::findOrFail($validated['role_id']);

        $user->syncRoles([$role->name]);

        return back()->with('success', "User {$user->name} berhasil diperbarui");
    }

    /**
     * Update user password.
     */
    public function updatePassword(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        if ($user->hasRole('owner')) {
            return back()->with('error', 'Password user owner tidak dapat diubah.');
        }

        $validated = $request->validate([
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $user->update([
            'password' => bcrypt($validated['password']),
        ]);

        return back()->with('success', 'Password berhasil diperbarui');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);

        if ($user->hasRole('owner')) {
            return back()->with('error', 'User owner tidak dapat dihapus.');
        }

        $user->delete();

        return back()->with('success', 'User berhasil dihapus');
    }
}
