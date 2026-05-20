<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $role = $this->getRoleNames()->first() ?? $this->role;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'role' => $role,
            'business_id' => $this->business_id,
        ];
    }
}
