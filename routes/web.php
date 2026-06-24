<?php

use App\Http\Controllers\AuditController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\RoleManagementController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (request()->user() === null) {
        return redirect()->route('login');
    }

    return redirect()->route('dashboard');
})->name('home');

Route::get('queue-display', [QueueController::class, 'display'])
    ->name('queues.display');
Route::get('queue-display/snapshot', [QueueController::class, 'snapshot'])
    ->name('queues.snapshot');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->middleware('can:dashboard.view')->name('dashboard');

    // Debug pages
    Route::get('debug/notifications', function () {
        return Inertia::render('debug/notifications');
    })->name('debug.notifications');

    Route::get('users', [UserManagementController::class, 'index'])
        ->middleware('can:users.view')
        ->name('users.index');
    Route::patch('users/{user}/role', [UserManagementController::class, 'updateRole'])
        ->middleware('can:users.update')
        ->name('users.update-role');
    Route::patch('users/{user}/activate', [UserManagementController::class, 'activate'])
        ->middleware('can:users.update')
        ->name('users.activate');
    Route::patch('users/{user}/deactivate', [UserManagementController::class, 'deactivate'])
        ->middleware('can:users.update')
        ->name('users.deactivate');

    Route::get('roles', [RoleManagementController::class, 'index'])
        ->middleware('can:roles.view')
        ->name('roles.index');
    Route::post('roles', [RoleManagementController::class, 'store'])
        ->middleware('can:roles.create')
        ->name('roles.store');
    Route::put('roles/{role}', [RoleManagementController::class, 'update'])
        ->middleware('can:roles.update')
        ->name('roles.update');
    Route::delete('roles/{role}', [RoleManagementController::class, 'destroy'])
        ->middleware('can:roles.delete')
        ->name('roles.destroy');

    Route::get('patients', [PatientController::class, 'index'])
        ->middleware('can:patients.view')
        ->name('patients.index');
    Route::get('patients/create', [PatientController::class, 'create'])
        ->middleware('can:patients.create')
        ->name('patients.create');
    Route::post('patients', [PatientController::class, 'store'])
        ->middleware('can:patients.create')
        ->name('patients.store');
    Route::get('patients/{patient}', [PatientController::class, 'show'])
        ->middleware('can:patients.view')
        ->name('patients.show');
    Route::get('patients/{patient}/edit', [PatientController::class, 'edit'])
        ->middleware('can:patients.update')
        ->name('patients.edit');
    Route::put('patients/{patient}', [PatientController::class, 'update'])
        ->middleware('can:patients.update')
        ->name('patients.update');
    Route::patch('patients/{patient}/deactivate', [PatientController::class, 'deactivate'])
        ->middleware('can:patients.deactivate')
        ->name('patients.deactivate');
    Route::get('patients/{patient}/medical-history', [PatientController::class, 'history'])
        ->middleware('can:patients.view')
        ->name('patients.history');

    Route::get('doctors', [DoctorController::class, 'index'])
        ->middleware('can:doctors.view')
        ->name('doctors.index');
    Route::get('doctors/create', [DoctorController::class, 'create'])
        ->middleware('can:doctors.create')
        ->name('doctors.create');
    Route::post('doctors', [DoctorController::class, 'store'])
        ->middleware('can:doctors.create')
        ->name('doctors.store');
    Route::get('doctors/assignment-options', [DoctorController::class, 'assignmentOptions'])
        ->middleware('can:doctors.assign')
        ->name('doctors.assignment-options');
    Route::get('doctors/{doctor}', [DoctorController::class, 'show'])
        ->name('doctors.show');
    Route::get('doctors/{doctor}/edit', [DoctorController::class, 'edit'])
        ->middleware('can:doctors.update')
        ->name('doctors.edit');
    Route::put('doctors/{doctor}', [DoctorController::class, 'update'])
        ->middleware('can:doctors.update')
        ->name('doctors.update');
    Route::get('doctors/{doctor}/schedule', [DoctorController::class, 'schedule'])
        ->name('doctors.schedule');

    Route::get('queues', [QueueController::class, 'index'])
        ->middleware('can:queues.view')
        ->name('queues.index');
    Route::get('queues/check-in', [QueueController::class, 'create'])
        ->middleware('can:queues.check-in')
        ->name('queues.create');
    Route::post('queues/check-in', [QueueController::class, 'store'])
        ->middleware('can:queues.check-in')
        ->name('queues.store');
    Route::get('doctor-queue', [QueueController::class, 'doctor'])
        ->name('queues.doctor');
    Route::patch('queues/call-next', [QueueController::class, 'callNext'])
        ->middleware('can:queues.call')
        ->name('queues.call-next');
    Route::patch('queues/{queue}/recall', [QueueController::class, 'recall'])
        ->middleware('can:queues.call')
        ->name('queues.recall');
    Route::patch('queues/{queue}/start', [QueueController::class, 'start'])
        ->middleware('can:queues.call')
        ->name('queues.start');
    Route::patch('queues/{queue}/skip', [QueueController::class, 'skip'])
        ->middleware('can:queues.call')
        ->name('queues.skip');
    Route::patch('queues/{queue}/complete', [QueueController::class, 'complete'])
        ->middleware('can:queues.call')
        ->name('queues.complete');
    Route::patch('queues/{queue}/cancel', [QueueController::class, 'cancel'])
        ->middleware('can:queues.call')
        ->name('queues.cancel');

    // Audit logs
    Route::get('audits', [AuditController::class, 'index'])
        ->middleware('can:audits.view')
        ->name('audits.index');

    Route::get('audits/{id}', [AuditController::class, 'show'])
        ->middleware('can:audits.view')
        ->whereNumber('id')
        ->name('audits.show');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])
        ->name('notifications.index');

    Route::get('/notifications/latest', [NotificationController::class, 'latest'])
        ->name('notifications.latest');

    Route::post('/notifications/read-all', [NotificationController::class, 'readAll'])
        ->name('notifications.read-all');

    Route::post('/notifications/{id}/read', [NotificationController::class, 'read'])
        ->name('notifications.read');

    Route::post('/api/test-notification', [NotificationController::class, 'sendTestNotification'])
        ->name('notifications.test');
});

require __DIR__.'/settings.php';
