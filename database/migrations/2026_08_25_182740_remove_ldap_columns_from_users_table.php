<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'guid')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique('users_guid_unique');
                $table->dropColumn('guid');
            });
        }

        if (Schema::hasColumn('users', 'domain')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('domain');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('guid')->nullable()->unique();
            $table->string('domain')->nullable();
        });
    }
};
