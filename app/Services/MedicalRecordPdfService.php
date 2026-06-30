<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class MedicalRecordPdfService
{
    /**
     * @param  array<string, mixed>  $record
     */
    public function render(array $record): string
    {
        $pages = $this->lines($record)->chunk(52)->values();
        $objects = [
            1 => '<< /Type /Catalog /Pages 2 0 R >>',
            3 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];
        $pageReferences = [];

        foreach ($pages as $index => $lines) {
            $pageObject = 4 + ($index * 2);
            $contentObject = $pageObject + 1;
            $pageReferences[] = "{$pageObject} 0 R";
            $stream = $this->pageStream($lines);
            $objects[$pageObject] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents {$contentObject} 0 R >>";
            $objects[$contentObject] = '<< /Length '.strlen($stream)." >>\nstream\n{$stream}\nendstream";
        }

        $objects[2] = '<< /Type /Pages /Kids ['.implode(' ', $pageReferences).'] /Count '.count($pages).' >>';
        ksort($objects);

        return $this->document($objects);
    }

    /**
     * @param  array<string, mixed>  $record
     * @return Collection<int, string>
     */
    private function lines(array $record): Collection
    {
        $patient = $record['patient'];
        $lines = collect([
            config('app.name').' - MEDICAL RECORD',
            'Generated: '.now()->format('Y-m-d H:i'),
            '',
            'PATIENT INFORMATION',
            "Name: {$patient['full_name']}",
            "Patient code: {$patient['patient_code']}",
            "Birthdate / Age: {$patient['birthdate']} / ".($patient['age'] ?? 'N/A'),
            "Gender / Blood type: {$patient['gender']} / ".($patient['blood_type'] ?? 'N/A'),
            "Contact: {$patient['contact_number']} / ".($patient['email'] ?? 'N/A'),
            "Address: {$patient['address']}",
            'Allergies: '.($patient['allergies'] ?: 'None recorded'),
            'Existing conditions: '.($patient['existing_conditions'] ?: 'None recorded'),
        ]);

        $this->append($lines, 'CONSULTATION HISTORY', $record['consultations'], fn (array $item): array => [
            "{$item['consultation_number']} | {$item['status']} | ".($item['started_at'] ?? 'Date unavailable'),
            "Doctor: {$item['doctor']['full_name']} ({$item['doctor']['specialization']})",
            'Chief complaint: '.($item['chief_complaint'] ?: 'None recorded'),
            'Diagnosis: '.($item['diagnosis'] ?: 'None recorded'),
            'Treatment plan: '.($item['treatment_plan'] ?: 'None recorded'),
            'Notes: '.($item['doctor_notes'] ?: 'None recorded'),
        ]);
        $this->append($lines, 'PRESCRIPTIONS', $record['prescriptions'], fn (array $item): array => [
            "{$item['consultation_number']} | {$item['doctor_name']} | {$item['prescribed_at']}",
            "Medications: {$item['medications']}",
            'Instructions: '.($item['instructions'] ?: 'None recorded'),
        ]);
        $this->append($lines, 'LABORATORY REQUESTS AND RESULTS', $record['laboratory_requests'], fn (array $item): array => [
            "{$item['consultation_number']} | {$item['status']} | {$item['requested_at']}",
            "Tests: {$item['tests']}",
            'Result: '.($item['result'] ?: 'Pending / not recorded'),
            'Result notes: '.($item['result_notes'] ?: 'None recorded'),
        ]);
        $this->append($lines, 'VITAL SIGNS HISTORY', $record['vital_signs'], fn (array $item): array => [
            ($item['recorded_at'] ?? 'Date unavailable')." | BP {$item['blood_pressure']} | Temp {$item['temperature']} C | Pulse {$item['pulse_rate']}",
            "Respiratory {$item['respiratory_rate']} | SpO2 {$item['oxygen_saturation']}% | BMI {$item['bmi']}",
        ]);
        $this->append($lines, 'FOLLOW-UP HISTORY', $record['follow_ups'], fn (array $item): array => [
            "{$item['follow_up_date']} | {$item['consultation_number']} | {$item['doctor_name']}",
            'Plan: '.($item['treatment_plan'] ?: 'None recorded'),
        ]);

        return $lines->flatMap(fn (string $line): array => explode("\n", wordwrap($this->ascii($line), 92, "\n", true)))->values();
    }

    private function append(Collection $lines, string $heading, iterable $items, callable $formatter): void
    {
        $lines->push('', $heading);
        $hasItems = false;

        foreach ($items as $item) {
            $hasItems = true;
            $lines->push(...$formatter($item));
            $lines->push('');
        }

        if (! $hasItems) {
            $lines->push('None recorded.');
        }
    }

    private function pageStream(Collection $lines): string
    {
        $commands = $lines->map(fn (string $line): string => '('.$this->escape($line).') Tj T*')->implode("\n");

        return "BT\n/F1 9 Tf\n48 758 Td\n12 TL\n{$commands}\nET";
    }

    private function document(array $objects): string
    {
        $pdf = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $number => $object) {
            $offsets[$number] = strlen($pdf);
            $pdf .= "{$number} 0 obj\n{$object}\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= 'xref'."\n0 ".(count($objects) + 1)."\n";
        $pdf .= "0000000000 65535 f \n";

        for ($number = 1; $number <= count($objects); $number++) {
            $pdf .= str_pad((string) $offsets[$number], 10, '0', STR_PAD_LEFT)." 00000 n \n";
        }

        return $pdf."trailer\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF";
    }

    private function ascii(string $value): string
    {
        return Str::ascii($value);
    }

    private function escape(string $value): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $value);
    }
}
