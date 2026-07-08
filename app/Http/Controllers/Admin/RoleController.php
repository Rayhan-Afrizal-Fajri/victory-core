<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'description' => ['nullable', 'string', 'max:255'],
            'permission_ids' => ['array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        if (strtolower($validated['name']) === 'owner') {
            return response()->json([
                'message' => 'Role owner tidak dapat dibuat lewat antarmuka ini.',
            ], 422);
        }

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
            'description' => $validated['description'] ?? null,
        ]);

        $role->syncPermissions($validated['permission_ids'] ?? []);

        return response()->json([
            'message' => 'Role berhasil dibuat',
        ]);
    }

    public function update(Request $request, string $id)
    {
        $role = Role::findOrFail($id);

        if (strtolower($role->name) === 'owner') {
            return response()->json([
                'message' => 'Role owner tidak dapat diubah.',
            ], 422);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles')->ignore($role->id)],
            'description' => ['nullable', 'string', 'max:255'],
            'permission_ids' => ['array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        $role->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        $role->syncPermissions($validated['permission_ids'] ?? []);

        return response()->json([
            'message' => 'Role berhasil diperbarui',
        ]);
    }

    public function destroy(string $id)
    {
        $role = Role::findOrFail($id);

        if (strtolower($role->name) === 'owner') {
            return response()->json([
                'message' => 'Role owner tidak dapat dihapus.',
            ], 422);
        }

        $role->delete();

        return response()->json([
            'message' => 'Role berhasil dihapus',
        ]);
    }
}
