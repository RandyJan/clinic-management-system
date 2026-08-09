import type { ReactNode } from 'react';

type PrivacyNoticeContentProps = {
    compact?: boolean;
};

function PrivacyNoticeSection({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="space-y-3">
            <h2 className="text-base font-bold tracking-wide text-slate-900 uppercase dark:text-slate-100">
                {title}
            </h2>
            <div className="space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                {children}
            </div>
        </section>
    );
}

export default function PrivacyNoticeContent({
    compact = false,
}: PrivacyNoticeContentProps) {
    const sectionClassName = compact ? 'space-y-5' : 'space-y-8';
    const listClassName = 'list-disc space-y-2 pl-5';
    const listItemClassName = 'text-slate-700 dark:text-slate-300';
    const bulletColorClassName =
        'marker:text-slate-700 dark:marker:text-slate-400';

    return (
        <div className={sectionClassName}>
            <div className="space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                <p>
                    We value your privacy and are committed to protecting the
                    personal and sensitive personal information processed
                    through this Clinic Management System in accordance with
                    applicable data privacy laws, including the Data Privacy Act
                    of 2012 and related rules and regulations.
                </p>
                <p>
                    This Privacy Notice explains how information may be
                    collected, used, stored, shared, retained, and protected
                    when you use the system for clinic-related services.
                </p>
                <p>
                    By using this system, you acknowledge that your information
                    may be processed for legitimate clinic operations, patient
                    care, administrative services, and other lawful purposes
                    described below.
                </p>
            </div>

            <PrivacyNoticeSection title="Personal Data Collected">
                <p>
                    Depending on your role and interaction with the clinic, the
                    system may collect and process information such as:
                </p>
                <ul className={`${listClassName} ${bulletColorClassName}`}>
                    <li className={listItemClassName}>
                        Name, contact details, address, birthdate, gender, and
                        other profile information;
                    </li>
                    <li className={listItemClassName}>
                        Patient records, consultation notes, diagnoses, vital
                        signs, prescriptions, laboratory requests and results,
                        medical certificates, and related clinical data;
                    </li>
                    <li className={listItemClassName}>
                        Appointment schedules, queue records, billing details,
                        payments, receipts, and service charges;
                    </li>
                    <li className={listItemClassName}>
                        User account details, roles, permissions, audit logs,
                        and system activity records; and
                    </li>
                    <li className={listItemClassName}>
                        Other information necessary to provide clinic services,
                        comply with legal obligations, secure the system, or
                        support authorized clinic workflows.
                    </li>
                </ul>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="How Information Is Collected">
                <p>
                    Information may be collected directly from patients, clinic
                    personnel, authorized representatives, submitted forms,
                    uploaded documents, system-generated records, and authorized
                    users who create or update records in the system.
                </p>
                <p>
                    Some information may also be created automatically, such as
                    audit logs, timestamps, notifications, and records of
                    actions performed in the system.
                </p>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Purpose of Processing">
                <p>
                    We process personal and sensitive personal information for
                    legitimate clinic and healthcare-related purposes,
                    including:
                </p>
                <ul className={`${listClassName} ${bulletColorClassName}`}>
                    <li className={listItemClassName}>
                        Patient registration, identification, and profile
                        management;
                    </li>
                    <li className={listItemClassName}>
                        Scheduling and managing appointments, queues,
                        consultations, vital signs, prescriptions, laboratory
                        requests, and medical certificates;
                    </li>
                    <li className={listItemClassName}>
                        Processing billing, payments, receipts, reports, and
                        clinic charges;
                    </li>
                    <li className={listItemClassName}>
                        Managing medicines, inventory, stock movements, and
                        dispensing activities;
                    </li>
                    <li className={listItemClassName}>
                        Sending system notifications related to appointments,
                        billing, prescriptions, laboratory results, inventory,
                        and administrative updates;
                    </li>
                    <li className={listItemClassName}>
                        Maintaining security, audit trails, accountability, and
                        proper access control; and
                    </li>
                    <li className={listItemClassName}>
                        Complying with applicable laws, regulations, reporting
                        requirements, and lawful requests from authorized
                        entities.
                    </li>
                </ul>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Use of Cookies and Session Data">
                <p>
                    The system may use cookies, session storage, or similar
                    technologies to keep users logged in, remember preferences,
                    protect against unauthorized access, and improve system
                    functionality.
                </p>
                <p>
                    Disabling cookies may prevent some features of the system
                    from working properly.
                </p>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Disclosure and Sharing">
                <p>
                    Personal data is accessed only by authorized users based on
                    their assigned roles and permissions. Information may be
                    shared with healthcare personnel, administrative staff,
                    pharmacists, cashiers, laboratory personnel, system
                    administrators, service providers, or authorized entities
                    when necessary for clinic operations, patient care, legal
                    compliance, or system support.
                </p>
                <p>
                    We do not sell personal information. Disclosure is limited
                    to what is necessary, lawful, and appropriate for the
                    purpose involved.
                </p>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Security Measures">
                <p>
                    We apply reasonable organizational, technical, and physical
                    safeguards to protect personal data against unauthorized
                    access, loss, misuse, alteration, or disclosure. These
                    measures may include role-based access, authentication,
                    audit logs, secure storage, and controlled access to system
                    records.
                </p>
                <p>
                    While we take data protection seriously, no digital system
                    can guarantee absolute security. Users are expected to keep
                    account credentials confidential and report suspected
                    unauthorized access or privacy incidents immediately.
                </p>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Data Storage, Retention and Disposal">
                <p>
                    Personal data is retained only for as long as necessary to
                    support patient care, clinic operations, legal compliance,
                    reporting, audit requirements, dispute resolution, and other
                    legitimate purposes.
                </p>
                <p>
                    When data is no longer required, it will be securely
                    deleted, archived, anonymized, or disposed of according to
                    applicable retention rules and clinic policies.
                </p>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Your Data Privacy Rights">
                <p>
                    Subject to applicable laws and verification requirements,
                    you may exercise your rights as a data subject, including:
                </p>
                <ul className={`${listClassName} ${bulletColorClassName}`}>
                    <li className={listItemClassName}>
                        The right to be informed about how your personal data is
                        processed;
                    </li>
                    <li className={listItemClassName}>
                        The right to access personal data related to you;
                    </li>
                    <li className={listItemClassName}>
                        The right to request correction of inaccurate or
                        outdated information;
                    </li>
                    <li className={listItemClassName}>
                        The right to object to processing or withdraw consent
                        when processing is based on consent;
                    </li>
                    <li className={listItemClassName}>
                        The right to request deletion, blocking, or restriction
                        of personal data when allowed by law;
                    </li>
                    <li className={listItemClassName}>
                        The right to data portability, when applicable; and
                    </li>
                    <li className={listItemClassName}>
                        The right to file a complaint with the appropriate data
                        protection authority.
                    </li>
                </ul>
                <p>
                    Requests may be subject to identity verification and may be
                    limited where the clinic is required to retain or process
                    information for lawful, medical, administrative, or
                    regulatory reasons.
                </p>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Privacy Notice Changes and Updates">
                <p>
                    We may update this Privacy Notice from time to time to
                    reflect changes in system features, clinic processes, legal
                    requirements, or data protection practices. Updated versions
                    will be made available through the system or other
                    appropriate channels.
                </p>
            </PrivacyNoticeSection>

            <PrivacyNoticeSection title="Contact and Privacy Concerns">
                <p>
                    For questions, requests, complaints, or concerns about this
                    Privacy Notice or the handling of personal data, please
                    contact the clinic administrator or designated data privacy
                    contact.
                </p>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                    <p className="font-semibold">Privacy Contact</p>
                    <p className="mt-2">
                        Please use the official clinic contact details provided
                        by your organization or system administrator.
                    </p>
                </div>
            </PrivacyNoticeSection>
        </div>
    );
}
