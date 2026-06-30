<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\ConsultationController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\LaboratoryRequestController;
use App\Http\Controllers\MedicalRecordController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\RoleManagementController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\VitalSignController;
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
    Route::get('patients/{patient}/consultations', [ConsultationController::class, 'patient'])
        ->middleware('can:consultations.view')
        ->name('patients.consultations.index');

    Route::get('medical-records', [MedicalRecordController::class, 'index'])
        ->name('medical-records.index');
    Route::get('medical-records/{patient}', [MedicalRecordController::class, 'show'])
        ->name('medical-records.show');
    Route::get('medical-records/{patient}/print', [MedicalRecordController::class, 'print'])
        ->name('medical-records.print');
    Route::get('medical-records/{patient}/export', [MedicalRecordController::class, 'export'])
        ->name('medical-records.export');

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

    Route::get('appointments', [AppointmentController::class, 'index'])
        ->middleware('can:appointments.own.view')
        ->name('appointments.index');
    Route::get('appointments/calendar', [AppointmentController::class, 'calendar'])
        ->middleware('can:appointments.own.view')
        ->name('appointments.calendar');
    Route::get('appointments/create', [AppointmentController::class, 'create'])
        ->middleware('can:appointments.create')
        ->name('appointments.create');
    Route::post('appointments', [AppointmentController::class, 'store'])
        ->name('appointments.store');
    Route::get('doctor-appointments', [AppointmentController::class, 'doctor'])
        ->middleware('can:appointments.own.view')
        ->name('appointments.doctor');
    Route::get('appointments/{appointment}', [AppointmentController::class, 'show'])
        ->middleware('can:appointments.own.view')
        ->name('appointments.show');
    Route::get('appointments/{appointment}/edit', [AppointmentController::class, 'edit'])
        ->middleware('can:appointments.update')
        ->name('appointments.edit');
    Route::put('appointments/{appointment}', [AppointmentController::class, 'update'])
        ->middleware('can:appointments.update')
        ->name('appointments.update');
    Route::patch('appointments/{appointment}/check-in', [AppointmentController::class, 'checkIn'])
        ->middleware('can:appointments.check-in')
        ->name('appointments.check-in');
    Route::patch('appointments/{appointment}/start', [AppointmentController::class, 'start'])
        ->middleware('can:appointments.manage-consultations')
        ->name('appointments.start');
    Route::patch('appointments/{appointment}/complete', [AppointmentController::class, 'complete'])
        ->middleware('can:appointments.manage-consultations')
        ->name('appointments.complete');
    Route::patch('appointments/{appointment}/cancel', [AppointmentController::class, 'cancel'])
        ->middleware('can:appointments.update')
        ->name('appointments.cancel');
    Route::get('appointments/{appointment}/vital-signs/create', [VitalSignController::class, 'create'])
        ->middleware('can:vital-signs.create')
        ->name('appointments.vital-signs.create');
    Route::get('appointments/{appointment}/vital-signs', [VitalSignController::class, 'appointment'])
        ->middleware('can:vital-signs.view')
        ->name('appointments.vital-signs.show');
    Route::post('vital-signs', [VitalSignController::class, 'store'])
        ->middleware('can:vital-signs.create')
        ->name('vital-signs.store');
    Route::get('patients/{patient}/vital-signs', [VitalSignController::class, 'patient'])
        ->middleware('can:vital-signs.view')
        ->name('patients.vital-signs.index');

    Route::get('consultations/{consultation}', [ConsultationController::class, 'show'])
        ->middleware('can:consultations.view')
        ->name('consultations.show');
    Route::get('consultations/{consultation}/edit', [ConsultationController::class, 'edit'])
        ->middleware('can:consultations.update')
        ->name('consultations.edit');
    Route::put('consultations/{consultation}', [ConsultationController::class, 'update'])
        ->middleware('can:consultations.update')
        ->name('consultations.update');
    Route::patch('consultations/{consultation}/complete', [ConsultationController::class, 'complete'])
        ->middleware('can:consultations.update')
        ->name('consultations.complete');

    Route::get('prescriptions', [PrescriptionController::class, 'index'])
        ->name('prescriptions.index');
    Route::get('prescriptions/pending', [PrescriptionController::class, 'pending'])
        ->name('prescriptions.pending');
    Route::get('consultations/{consultation}/prescriptions/create', [PrescriptionController::class, 'create'])
        ->name('prescriptions.create');
    Route::post('prescriptions', [PrescriptionController::class, 'store'])
        ->name('prescriptions.store');
    Route::get('prescriptions/{prescription}', [PrescriptionController::class, 'show'])
        ->name('prescriptions.show');
    Route::get('prescriptions/{prescription}/print', [PrescriptionController::class, 'print'])
        ->name('prescriptions.print');
    Route::patch('prescriptions/{prescription}/dispense', [PrescriptionController::class, 'dispense'])
        ->name('prescriptions.dispense');
    Route::get('patients/{patient}/prescriptions', [PrescriptionController::class, 'patient'])
        ->name('patients.prescriptions.index');

    Route::get('laboratory-requests', [LaboratoryRequestController::class, 'index'])
        ->name('laboratory-requests.index');
    Route::get('consultations/{consultation}/laboratory-requests/create', [LaboratoryRequestController::class, 'create'])
        ->name('laboratory-requests.create');
    Route::post('laboratory-requests', [LaboratoryRequestController::class, 'store'])
        ->name('laboratory-requests.store');
    Route::get('laboratory-requests/{laboratoryRequest}', [LaboratoryRequestController::class, 'show'])
        ->name('laboratory-requests.show');
    Route::patch('laboratory-requests/{laboratoryRequest}/status', [LaboratoryRequestController::class, 'updateStatus'])
        ->name('laboratory-requests.update-status');
    Route::get('laboratory-requests/{laboratoryRequest}/upload-result', [LaboratoryRequestController::class, 'upload'])
        ->name('laboratory-requests.upload-result');
    Route::post('laboratory-requests/{laboratoryRequest}/result', [LaboratoryRequestController::class, 'storeResult'])
        ->name('laboratory-requests.store-result');
    Route::get('laboratory-requests/{laboratoryRequest}/result', [LaboratoryRequestController::class, 'result'])
        ->name('laboratory-requests.result');
    Route::get('laboratory-requests/{laboratoryRequest}/attachment', [LaboratoryRequestController::class, 'attachment'])
        ->name('laboratory-requests.attachment');

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
