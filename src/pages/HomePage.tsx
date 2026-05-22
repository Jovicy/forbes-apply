import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { saveApplication, getApplications } from "../utils/storage";
import type { ApplicationRecord } from "../utils/storage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step1Data {
    firstName: string; lastName: string; email: string; phone: string;
    dob: string; gender: string; nationality: string; class: string;
}
interface Step2Data {
    transferName: string; bankName: string; transferDate: string;
}
interface Step3Data {
    streetAddress: string; city: string; state: string; country: string;
    emergencyName: string; emergencyRelationship: string; emergencyPhone: string;
    previousSchool: string; yearCompleted: string; grade: string;
    subjects: string; extraCurricular: string; personalStatement: string;
    parentName: string; parentPhone: string; parentEmail: string;
    parentOccupation: string; disability: string; hearAbout: string;
}
type ErrorMap = Record<string, boolean>;

// ─── Constants ────────────────────────────────────────────────────────────────

const generateRef = (): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let ref = "FRC-";
    for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
    return ref;
};

const CLASSES = [
    "JSS 1 (Junior Secondary 1)", "JSS 2 (Junior Secondary 2)", "JSS 3 (Junior Secondary 3)",
    "SSS 1 (Senior Secondary 1)", "SSS 2 (Senior Secondary 2)", "SSS 3 (Senior Secondary 3)",
];

const BANK = {
    accountName: "Forbes Royal College",
    bankName: "First Bank of Nigeria PLC",
    accountNumber: "3012847593",
    sortCode: "011",
};

const EMPTY_STEP1: Step1Data = {
    firstName: "", lastName: "", email: "", phone: "",
    dob: "", gender: "", nationality: "", class: "",
};
const EMPTY_STEP2: Step2Data = { transferName: "", bankName: "", transferDate: "" };
const EMPTY_STEP3: Step3Data = {
    streetAddress: "", city: "", state: "", country: "",
    emergencyName: "", emergencyRelationship: "", emergencyPhone: "",
    previousSchool: "", yearCompleted: "", grade: "", subjects: "", extraCurricular: "",
    personalStatement: "", parentName: "", parentPhone: "", parentEmail: "",
    parentOccupation: "", disability: "", hearAbout: "",
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

const inputBase =
    "w-full px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-lg border-[1.5px] border-slate-300 text-sm bg-white text-slate-800 outline-none box-border focus:border-primary transition-colors";
const labelCls =
    "block mb-1.5 font-semibold text-[12px] sm:text-[13px] text-slate-700 tracking-[0.2px]";

const SectionHeader: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
    <div className="flex items-center gap-2.5 my-5 sm:my-7">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-accent rounded-lg flex items-center justify-center text-sm sm:text-base shrink-0">{icon}</div>
        <div className="text-[10px] sm:text-[11px] font-extrabold text-primary uppercase tracking-[1.2px]">{label}</div>
        <div className="flex-1 h-px bg-accent" />
    </div>
);

interface FieldProps { label: string; required?: boolean; children: React.ReactNode; }
const Field: React.FC<FieldProps> = ({ label, required, children }) => (
    <div>
        <label className={labelCls}>{label}{required && <span className="text-red-600 ml-1">*</span>}</label>
        {children}
    </div>
);

const CopyBtn: React.FC<{ value: string }> = ({ value }) => {
    const [copied, setCopied] = useState(false);
    return (
        <button onClick={() => { navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); }}
            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer
                ${copied ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"}`}>
            {copied ? "✓" : "Copy"}
        </button>
    );
};

const BankRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 gap-2 flex-wrap sm:flex-nowrap">
        <span className="text-[12px] sm:text-[13px] text-slate-500 shrink-0">{label}</span>
        <div className="flex items-center gap-2 ml-auto">
            <span className="text-[12px] sm:text-[13px] font-semibold text-slate-800 font-mono">{value}</span>
            <CopyBtn value={value} />
        </div>
    </div>
);

const primaryBtn = (disabled: boolean) =>
    `font-bold rounded-lg transition-all tracking-[0.3px] py-2.5 px-5 sm:px-7 text-sm border-none
    ${disabled ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-primary text-white cursor-pointer hover:opacity-90"}`;

const backBtn =
    "font-bold rounded-lg py-2.5 px-4 sm:px-6 text-sm bg-white text-slate-600 border border-slate-300 cursor-pointer hover:bg-slate-50 transition-all";

// ─── RESUME SCREEN ────────────────────────────────────────────────────────────

interface ResumeScreenProps {
    onNew: () => void;
    onResume: (app: ApplicationRecord) => void;
}

const ResumeScreen: React.FC<ResumeScreenProps> = ({ onNew, onResume }) => {
    const [query, setQuery]   = useState("");
    const [error, setError]   = useState("");
    const [found, setFound]   = useState<ApplicationRecord | null>(null);

    const handleSearch = () => {
        const trimmed = query.trim().toUpperCase();
        if (!trimmed) { setError("Please enter your reference code or email."); return; }
        const all = getApplications();
        const match = all.find(
            (a) =>
                a.appRef.toUpperCase() === trimmed ||
                a.student.email.toLowerCase() === query.trim().toLowerCase()
        );
        if (match) {
            setFound(match);
            setError("");
        } else {
            setFound(null);
            setError("No application found. Check your reference or email and try again.");
        }
    };

    const stepLabel = (app: ApplicationRecord) => {
        if (app.application) return { label: "Full Application submitted", step: 3, done: true };
        if (app.payment)     return { label: "Payment confirmed — continue to Full Application", step: 3, done: false };
        return                      { label: "Initial Application done — continue to Payment", step: 2, done: false };
    };

    return (
        <div>
            {/* Welcome banner */}
            <div className="bg-accent rounded-xl p-3.5 sm:p-4 mb-7 border-l-4 border-primary">
                <p className="font-bold text-primary text-[14px] sm:text-[15px] mb-1">
                    Welcome to Forbes Royal College Admissions
                </p>
                <p className="text-slate-600 text-[12px] sm:text-[13px]">
                    2026/2027 Academic Session. Starting a new application or returning to complete one?
                </p>
            </div>

            {/* Two options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {/* New application */}
                <button onClick={onNew}
                    className="flex flex-col items-start gap-3 p-5 rounded-2xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer text-left">
                    <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-[22px]">📝</div>
                    <div>
                        <div className="font-extrabold text-primary text-[15px]">New Application</div>
                        <div className="text-slate-500 text-[12px] mt-1">Apply for the first time for the 2026/2027 session.</div>
                    </div>
                    <div className="mt-auto pt-2 text-primary font-bold text-[13px]">Start Now →</div>
                </button>

                {/* Resume application */}
                <div className="flex flex-col items-start gap-3 p-5 rounded-2xl border-2 border-slate-200 bg-slate-50 text-left">
                    <div className="w-11 h-11 bg-slate-200 rounded-xl flex items-center justify-center text-[22px]">🔄</div>
                    <div>
                        <div className="font-extrabold text-slate-700 text-[15px]">Resume Application</div>
                        <div className="text-slate-500 text-[12px] mt-1">Already started? Enter your reference code or email to continue.</div>
                    </div>
                    <div className="w-full mt-1 flex gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setError(""); setFound(null); }}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            placeholder="e.g. FRC-AB3X9Z or email"
                            className={`flex-1 min-w-0 px-3 py-2 rounded-lg border-[1.5px] text-sm outline-none transition-colors
                                ${error ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-primary bg-white"}`}
                        />
                        <button onClick={handleSearch}
                            className="px-3 py-2 bg-slate-700 text-white rounded-lg text-[12px] font-bold cursor-pointer hover:bg-slate-800 transition-all border-none shrink-0">
                            Find
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-[11.5px] -mt-1">⚠ {error}</p>}

                    {/* Found result */}
                    {found && (() => {
                        const { label, step, done } = stepLabel(found);
                        return (
                            <div className="w-full bg-white border border-emerald-200 rounded-xl p-3.5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-emerald-600 text-[15px]">✅</span>
                                    <span className="font-bold text-slate-800 text-[13px]">
                                        {found.student.firstName} {found.student.lastName}
                                    </span>
                                </div>
                                <div className="text-[12px] text-slate-500 font-mono mb-1">{found.appRef}</div>
                                <div className="text-[12px] text-slate-600 mb-3">{label}</div>
                                {done ? (
                                    <div className="text-[12px] font-bold text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 text-center">
                                        🎉 Your application is complete!
                                    </div>
                                ) : (
                                    <button onClick={() => onResume(found)}
                                        className="w-full py-2 bg-primary text-white rounded-lg text-[13px] font-bold cursor-pointer hover:opacity-90 transition-all border-none">
                                        Continue to Step {step} →
                                    </button>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

// ─── STEP 1 ───────────────────────────────────────────────────────────────────

interface Step1Props {
    data: Step1Data;
    onChange: (field: keyof Step1Data, val: string) => void;
    onNext: () => void;
}
const Step1: React.FC<Step1Props> = ({ data, onChange, onNext }) => {
    const [errors, setErrors] = useState<ErrorMap>({});
    const [touched, setTouched] = useState(false);

    const required: (keyof Step1Data)[] = ["firstName", "lastName", "email", "phone", "dob", "class"];
    const isFormValid = () => required.every((k) => k === "email" ? /\S+@\S+\.\S+/.test(data.email) : data[k].trim() !== "");

    const validate = (): boolean => {
        const e: ErrorMap = {};
        if (!data.firstName.trim()) e.firstName = true;
        if (!data.lastName.trim())  e.lastName  = true;
        if (!data.email.trim() || !/\S+@\S+\.\S+/.test(data.email)) e.email = true;
        if (!data.phone.trim())     e.phone     = true;
        if (!data.dob)              e.dob       = true;
        if (!data.class)            e.class     = true;
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = () => { setTouched(true); if (validate()) onNext(); };

    const f = (field: keyof Step1Data) => ({
        value: data[field],
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            onChange(field, e.target.value);
            setErrors((p) => ({ ...p, [field]: false }));
        },
        className: `${inputBase} ${errors[field] && touched ? "border-red-400 bg-red-50" : ""}`,
    });

    return (
        <div>
            <SectionHeader icon="👤" label="Student Information" />
            <div className="flex flex-col gap-3 sm:gap-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field label="First Name" required><input type="text" placeholder="e.g. Amara" {...f("firstName")} /></Field>
                    <Field label="Last Name" required><input type="text" placeholder="e.g. Osei" {...f("lastName")} /></Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field label="Email Address" required><input type="email" placeholder="you@example.com" {...f("email")} /></Field>
                    <Field label="Phone Number" required><input type="tel" placeholder="+234 7700 000000" {...f("phone")} /></Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field label="Date of Birth" required><input type="date" {...f("dob")} /></Field>
                    <Field label="Gender">
                        <select {...f("gender")} className={`${inputBase} cursor-pointer ${!data.gender ? "text-slate-400" : "text-slate-800"}`}>
                            <option value="" disabled>Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                    </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field label="Nationality"><input type="text" placeholder="e.g. Nigerian" {...f("nationality")} /></Field>
                    <Field label="Class Applying For" required>
                        <select {...f("class")} className={`${inputBase} cursor-pointer ${errors.class && touched ? "border-red-400 bg-red-50" : ""} ${!data.class ? "text-slate-400" : "text-slate-800"}`}>
                            <option value="" disabled>Select class</option>
                            {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </Field>
                </div>
            </div>
            <div className="mt-6 sm:mt-8 flex justify-end">
                <button onClick={handleNext} disabled={!isFormValid()} className={primaryBtn(!isFormValid())}>
                    Continue to Payment →
                </button>
            </div>
        </div>
    );
};

// ─── STEP 2 ───────────────────────────────────────────────────────────────────

interface Step2Props {
    data: Step2Data; appRef: string; firstName: string;
    onChange: (field: keyof Step2Data, val: string) => void;
    onNext: () => void; onBack: () => void;
}
const Step2: React.FC<Step2Props> = ({ data, appRef, firstName, onChange, onNext, onBack }) => {
    const [errors, setErrors]     = useState<ErrorMap>({});
    const [confirmed, setConfirmed] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [touched, setTouched]   = useState(false);

    const isFormValid = () =>
        data.transferName.trim() !== "" && data.bankName.trim() !== "" &&
        data.transferDate !== "" && confirmed;

    const validate = (): boolean => {
        const e: ErrorMap = {};
        if (!data.transferName?.trim()) e.transferName = true;
        if (!data.bankName?.trim())     e.bankName     = true;
        if (!data.transferDate)         e.transferDate = true;
        if (!confirmed)                 e.confirmed    = true;
        setErrors(e); return Object.keys(e).length === 0;
    };

    const handleSubmit = () => { setTouched(true); if (validate()) setSubmitted(true); };

    const f = (field: keyof Step2Data) => ({
        value: data[field] || "",
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => { onChange(field, e.target.value); setErrors((p) => ({ ...p, [field]: false })); },
        className: `${inputBase} ${errors[field] && touched ? "border-red-400 bg-red-50" : ""}`,
    });

    return (
        <div>
            <h2 className="text-[18px] sm:text-[20px] font-extrabold text-primary mb-1">Application Fee Payment</h2>
            <p className="text-[12px] sm:text-[13px] text-slate-500 mb-5">Transfer the application fee via bank transfer, then complete the confirmation form below.</p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-3.5 mb-6 flex gap-2.5">
                <span className="text-[16px] sm:text-[18px] shrink-0">⚠️</span>
                <p className="text-[12px] sm:text-[13px] text-amber-800">
                    This is a <strong>non-refundable fee of ₦15,000.00</strong>. You <strong>must</strong> include your reference{" "}
                    <span className="bg-amber-200 text-amber-900 font-mono font-bold px-1.5 py-0.5 rounded text-[11px]">{appRef}</span> in your transfer.
                </p>
            </div>

            <SectionHeader icon="🏦" label="Bank Transfer Details" />
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                <div className="bg-primary px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center text-[14px] sm:text-[16px] shrink-0">🏛️</div>
                        <div>
                            <div className="text-white font-bold text-[13px] sm:text-[14px]">Forbes Royal College</div>
                            <div className="text-white/60 text-[10px] sm:text-[11px]">Admissions Account</div>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-white font-black text-[17px] sm:text-[20px]">₦15,000</div>
                        <div className="text-white/60 text-[10px] sm:text-[11px]">Amount to transfer</div>
                    </div>
                </div>
                <div className="px-4 sm:px-5 py-1">
                    <BankRow label="Account Name"      value={BANK.accountName} />
                    <BankRow label="Bank Name"         value={BANK.bankName} />
                    <BankRow label="Account Number"    value={BANK.accountNumber} />
                    <BankRow label="Bank Code"         value={BANK.sortCode} />
                    <BankRow label="Payment Reference" value={appRef} />
                </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 mb-6 text-[11.5px] sm:text-[12.5px] text-slate-600">
                <strong>Important:</strong> Transfers may take 1–3 business days. Your reference <strong className="font-mono">{appRef}</strong> is your unique ID.
            </div>

            {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 sm:p-8 text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-[22px] sm:text-[26px] mx-auto mb-4">✓</div>
                    <h3 className="text-[16px] sm:text-[18px] font-extrabold text-emerald-700 mb-2">Transfer Confirmed!</h3>
                    <p className="text-[12px] sm:text-[13px] text-slate-600 mb-6">Thank you, <strong>{firstName}</strong>. We've recorded your confirmation. You may now proceed to the full application.</p>
                    <button onClick={onNext} className="font-bold rounded-lg py-2.5 px-6 sm:px-7 text-sm bg-primary text-white border-none cursor-pointer hover:opacity-90 transition-all">
                        Proceed to Full Application Form →
                    </button>
                </div>
            ) : (
                <>
                    <SectionHeader icon="✅" label="Confirm Your Transfer" />
                    <div className="flex flex-col gap-3 sm:gap-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <Field label="Your Full Name (as used for transfer)" required>
                                <input type="text" placeholder="e.g. Amara Osei" {...f("transferName")} />
                            </Field>
                            <Field label="Your Bank Name" required>
                                <input type="text" placeholder="e.g. Access Bank, GTBank" {...f("bankName")} />
                            </Field>
                        </div>
                        <Field label="Date of Transfer" required><input type="date" {...f("transferDate")} /></Field>
                        <div className={`flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border transition-colors ${errors.confirmed && touched ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
                            <input type="checkbox" id="confirm-chk" checked={confirmed}
                                onChange={(e) => { setConfirmed(e.target.checked); setErrors((p) => ({ ...p, confirmed: false })); }}
                                className="mt-0.5 w-4 h-4 cursor-pointer accent-primary shrink-0" />
                            <label htmlFor="confirm-chk" className="text-[11.5px] sm:text-[12.5px] text-slate-700 cursor-pointer leading-relaxed">
                                <strong>I confirm</strong> I have transferred <strong>₦15,000.00</strong> to Forbes Royal College ({BANK.bankName} — Acc: {BANK.accountNumber}) with reference <strong className="font-mono">{appRef}</strong>.
                            </label>
                        </div>
                    </div>
                    <div className="mt-6 sm:mt-8 flex items-center justify-between gap-3">
                        <button onClick={onBack} className={backBtn}>← Back</button>
                        <button onClick={handleSubmit} disabled={!isFormValid()} className={primaryBtn(!isFormValid())}>
                            Confirm Transfer &amp; Continue →
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// ─── STEP 3 ───────────────────────────────────────────────────────────────────

interface Step3Props {
    data: Step3Data; firstName: string; appRef: string;
    onChange: (field: keyof Step3Data, val: string) => void;
    onBack: () => void; onSubmit: () => void;
}
const Step3: React.FC<Step3Props> = ({ data, firstName, appRef, onChange, onBack, onSubmit }) => {
    const [errors, setErrors]     = useState<ErrorMap>({});
    const [submitted, setSubmitted] = useState(false);
    const [touched, setTouched]   = useState(false);

    const requiredFields: (keyof Step3Data)[] = [
        "streetAddress", "city", "country",
        "emergencyName", "emergencyRelationship", "emergencyPhone",
        "previousSchool", "yearCompleted", "personalStatement",
        "parentName", "parentPhone",
    ];

    const isFormValid = () => requiredFields.every((k) => {
        if (k === "personalStatement") return (data[k] || "").trim().split(/\s+/).length >= 30;
        return (data[k] || "").trim() !== "";
    });

    const validate = (): boolean => {
        const e: ErrorMap = {};
        requiredFields.forEach((k) => {
            if (k === "personalStatement") { if (!data[k]?.trim() || data[k].trim().split(/\s+/).length < 30) e[k] = true; }
            else { if (!(data[k] || "").trim()) e[k] = true; }
        });
        setErrors(e); return Object.keys(e).length === 0;
    };

    const handleSubmit = () => { setTouched(true); if (validate()) { setSubmitted(true); onSubmit(); } };

    const f = (field: keyof Step3Data) => ({
        value: data[field] || "",
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            onChange(field, e.target.value); setErrors((p) => ({ ...p, [field]: false }));
        },
        className: `${inputBase} ${errors[field] && touched ? "border-red-400 bg-red-50" : ""}`,
    });

    if (submitted) {
        return (
            <div className="py-10 sm:py-12 text-center px-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-[26px] sm:text-[30px] mx-auto mb-5">🎉</div>
                <h2 className="text-[20px] sm:text-[22px] font-extrabold text-primary mb-2">Application Submitted!</h2>
                <p className="text-slate-600 text-[13px] sm:text-[14px] mb-1">Thank you, <strong>{firstName}</strong>. Your full application has been received.</p>
                <p className="text-slate-500 text-[12px] sm:text-[13px] mb-5">Reference: <strong className="font-mono text-primary">{appRef}</strong></p>
                <div className="bg-accent rounded-xl p-4 max-w-sm mx-auto text-[12px] sm:text-[13px] text-slate-600">
                    📧 A confirmation will be sent to your registered email. Please check your inbox and spam folder.
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 sm:px-4 py-3 mb-5 sm:mb-6 flex items-center gap-2.5">
                <span className="text-emerald-600">✅</span>
                <p className="text-[12px] sm:text-[13px] text-emerald-800">
                    <strong>Payment verified</strong> — full application unlocked for <strong>{firstName}</strong>
                </p>
            </div>

            <SectionHeader icon="🏠" label="Contact & Address" />
            <div className="flex flex-col gap-3 sm:gap-3.5">
                <Field label="Street Address" required><input type="text" placeholder="House number and street name" {...f("streetAddress")} /></Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field label="City / Town" required><input type="text" placeholder="e.g. Kano" {...f("city")} /></Field>
                    <Field label="State"><input type="text" placeholder="e.g. Kano State" {...f("state")} /></Field>
                </div>
                <Field label="Country of Residence" required><input type="text" placeholder="e.g. Nigeria" {...f("country")} /></Field>
            </div>

            <SectionHeader icon="👨‍👩‍👦" label="Parent / Guardian Information" />
            <div className="flex flex-col gap-3 sm:gap-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field label="Parent / Guardian Full Name" required><input type="text" placeholder="e.g. Mr. Emeka Osei" {...f("parentName")} /></Field>
                    <Field label="Occupation"><input type="text" placeholder="e.g. Civil Servant" {...f("parentOccupation")} /></Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field label="Parent Phone Number" required><input type="tel" placeholder="+234 8100 000000" {...f("parentPhone")} /></Field>
                    <Field label="Parent Email Address"><input type="email" placeholder="parent@example.com" {...f("parentEmail")} /></Field>
                </div>
            </div>

            <SectionHeader icon="🚨" label="Emergency Contact" />
            <div className="flex flex-col gap-3 sm:gap-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field label="Full Name" required><input type="text" placeholder="Contact's full name" {...f("emergencyName")} /></Field>
                    <Field label="Relationship" required>
                        <select {...f("emergencyRelationship")} className={`${inputBase} cursor-pointer ${errors.emergencyRelationship && touched ? "border-red-400 bg-red-50" : ""} ${!data.emergencyRelationship ? "text-slate-400" : "text-slate-800"}`}>
                            <option value="" disabled>Select relationship</option>
                            <option value="father">Father</option><option value="mother">Mother</option>
                            <option value="guardian">Guardian</option><option value="uncle">Uncle</option>
                            <option value="aunt">Aunt</option><option value="sibling">Sibling</option>
                            <option value="other">Other</option>
                        </select>
                    </Field>
                </div>
                <Field label="Phone Number" required><input type="tel" placeholder="+234 8100 000000" {...f("emergencyPhone")} /></Field>
            </div>

            <SectionHeader icon="🎓" label="Previous Academic Background" />
            <div className="flex flex-col gap-3 sm:gap-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field label="Most Recent School Attended" required><input type="text" placeholder="School name" {...f("previousSchool")} /></Field>
                    <Field label="Year Completed / Left" required><input type="text" placeholder="e.g. 2025" {...f("yearCompleted")} /></Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field label="Last Class Completed"><input type="text" placeholder="e.g. Primary 6, JSS 2" {...f("grade")} /></Field>
                    <Field label="Key Subjects Studied"><input type="text" placeholder="e.g. Maths, English, Basic Science" {...f("subjects")} /></Field>
                </div>
                <Field label="Extra-Curricular Activities"><input type="text" placeholder="e.g. Football, Drama Club, Debate" {...f("extraCurricular")} /></Field>
            </div>

            <SectionHeader icon="✍️" label="Personal Statement" />
            <Field label="Why do you want to attend Forbes Royal College?" required>
                <textarea rows={6} placeholder="Describe your goals, interests, and why you chose Forbes Royal College. (Minimum 30 words)"
                    value={data.personalStatement || ""}
                    onChange={(e) => { onChange("personalStatement", e.target.value); setErrors((p) => ({ ...p, personalStatement: false })); }}
                    className={`${inputBase} resize-y ${errors.personalStatement && touched ? "border-red-400 bg-red-50" : ""}`} />
                {errors.personalStatement && touched && <p className="text-red-500 text-[11px] mt-1">Please provide at least 30 words.</p>}
            </Field>

            <SectionHeader icon="ℹ️" label="Additional Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                <Field label="Disability / Accessibility Needs">
                    <select {...f("disability")} className={`${inputBase} cursor-pointer ${!data.disability ? "text-slate-400" : "text-slate-800"}`}>
                        <option value="" disabled>Select an option</option>
                        <option value="none">None</option><option value="mobility">Mobility impairment</option>
                        <option value="visual">Visual impairment</option><option value="hearing">Hearing impairment</option>
                        <option value="learning">Learning difficulty</option><option value="other">Other</option>
                    </select>
                </Field>
                <Field label="How did you hear about us?">
                    <select {...f("hearAbout")} className={`${inputBase} cursor-pointer ${!data.hearAbout ? "text-slate-400" : "text-slate-800"}`}>
                        <option value="" disabled>Select an option</option>
                        <option value="search">Search engine</option><option value="social">Social media</option>
                        <option value="friend">Friend / family</option><option value="school">School / teacher</option>
                        <option value="event">Event / fair</option><option value="other">Other</option>
                    </select>
                </Field>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 mb-6 text-[11.5px] sm:text-[12.5px] text-slate-600 leading-relaxed">
                <strong>Declaration:</strong> By submitting this form, I confirm all information is accurate and complete. Any false information may result in rejection of my application.
            </div>

            <div className="flex items-center justify-between gap-3">
                <button onClick={onBack} className={backBtn}>← Back</button>
                <button onClick={handleSubmit} disabled={!isFormValid()} className={primaryBtn(!isFormValid())}>
                    Submit Full Application →
                </button>
            </div>
        </div>
    );
};

// ─── REFERENCE BANNER (shown while on steps 2 & 3) ───────────────────────────

const RefBanner: React.FC<{ appRef: string }> = ({ appRef }) => (
    <div className="flex items-center justify-between gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 mb-5">
        <div className="text-[12px] text-slate-600">
            Your application reference: <strong className="font-mono text-primary">{appRef}</strong>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-slate-400">Save this to resume later</span>
            <CopyBtn value={appRef} />
        </div>
    </div>
);

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

type AppScreen = "landing" | "form";

const HomePage: React.FC = () => {
    const [screen, setScreen] = useState<AppScreen>("landing");
    const [step, setStep]     = useState<number>(1);
    const [appRef, setAppRef] = useState<string>("");
    const [recordId, setRecordId] = useState<number>(0);

    const [step1Data, setStep1Data] = useState<Step1Data>(EMPTY_STEP1);
    const [step2Data, setStep2Data] = useState<Step2Data>(EMPTY_STEP2);
    const [step3Data, setStep3Data] = useState<Step3Data>(EMPTY_STEP3);

    const update1 = (field: keyof Step1Data, val: string) => setStep1Data((p) => ({ ...p, [field]: val }));
    const update2 = (field: keyof Step2Data, val: string) => setStep2Data((p) => ({ ...p, [field]: val }));
    const update3 = (field: keyof Step3Data, val: string) => setStep3Data((p) => ({ ...p, [field]: val }));

    // ── Start a brand-new application ────────────────────────────────────────
    const handleNew = () => {
        const ref = generateRef();
        const id  = Date.now();
        setAppRef(ref);
        setRecordId(id);
        setStep1Data(EMPTY_STEP1);
        setStep2Data(EMPTY_STEP2);
        setStep3Data(EMPTY_STEP3);
        setStep(1);
        setScreen("form");
    };

    // ── Resume an existing application ───────────────────────────────────────
    const handleResume = (app: ApplicationRecord) => {
        setAppRef(app.appRef);
        setRecordId(app.id);
        setStep1Data(app.student as Step1Data);
        if (app.payment) setStep2Data(app.payment as Step2Data);
        if (app.application) setStep3Data(app.application as Step3Data);
        // Drop them at the right step
        const nextStep = app.payment ? 3 : 2;
        setStep(nextStep);
        setScreen("form");
    };

    // ── Step save handlers ────────────────────────────────────────────────────
    const handleStep1Complete = () => {
        saveApplication({ id: recordId, appRef, status: "Pending", submittedAt: new Date().toISOString(), student: step1Data });
        setStep(2);
    };

    const handleStep2Complete = () => {
        saveApplication({ id: recordId, appRef, status: "Payment Verified", submittedAt: new Date().toISOString(), student: step1Data, payment: step2Data });
        setStep(3);
    };

    const handleFinalSubmit = () => {
        saveApplication({ id: recordId, appRef, status: "Completed", submittedAt: new Date().toISOString(), student: step1Data, payment: step2Data, application: step3Data });
    };

    return (
        <>
            <Navbar variant="application" currentStep={screen === "form" ? step : 1} />
            <div className="mx-auto py-6 sm:py-8 px-3 sm:px-4 pb-12 max-w-3xl">
                <div className="bg-white rounded-2xl px-4 sm:px-8 md:px-10 py-6 sm:py-9 shadow-[0_2px_20px_rgba(11,53,123,0.08)] border border-slate-200">

                    {screen === "landing" && (
                        <ResumeScreen onNew={handleNew} onResume={handleResume} />
                    )}

                    {screen === "form" && (
                        <>
                            {/* Show reference banner on steps 2 & 3 so user can save it */}
                            {step > 1 && <RefBanner appRef={appRef} />}

                            {step === 1 && (
                                <Step1 data={step1Data} onChange={update1} onNext={handleStep1Complete} />
                            )}
                            {step === 2 && (
                                <Step2 data={step2Data} appRef={appRef} firstName={step1Data.firstName}
                                    onChange={update2} onNext={handleStep2Complete} onBack={() => setStep(1)} />
                            )}
                            {step === 3 && (
                                <Step3 data={step3Data} firstName={step1Data.firstName} appRef={appRef}
                                    onChange={update3} onBack={() => setStep(2)} onSubmit={handleFinalSubmit} />
                            )}
                        </>
                    )}
                </div>
                <Footer />
            </div>
        </>
    );
};

export default HomePage;