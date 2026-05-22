import React from "react";
import { Link, useNavigate } from "react-router-dom";

interface NavbarProps {
    variant?: "application" | "admin";
    currentStep?: number;
}

const STEPS = [
    { num: 1, label: "Initial Application" },
    { num: 2, label: "Application Fee"     },
    { num: 3, label: "Full Application"    },
];

// The real admin code — change this to whatever you want
const ADMIN_CODE = "482917";

const Navbar: React.FC<NavbarProps> = ({ variant = "application", currentStep = 1 }) => {
    const navigate = useNavigate();
    const [showModal, setShowModal]   = React.useState(false);
    const [code, setCode]             = React.useState("");
    const [error, setError]           = React.useState("");
    const [shake, setShake]           = React.useState(false);

    const handleOpen = () => {
        // If already on admin page, no need for modal
        if (variant === "admin") return;
        setCode(""); setError(""); setShowModal(true);
    };

    const handleLogin = () => {
        if (code === ADMIN_CODE) {
            setShowModal(false);
            navigate("/admin");
        } else {
            setError("Incorrect code. Please try again.");
            setShake(true);
            setCode("");
            setTimeout(() => setShake(false), 600);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleLogin();
        if (e.key === "Escape") setShowModal(false);
    };

    return (
        <>
            <div className="bg-primary px-4 sm:px-8">
                {/* ── TOP BAR ── */}
                <div className="flex items-center justify-between pt-4 pb-0">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-xl bg-white/15 border-2 border-white/30 flex items-center justify-center text-[20px] sm:text-[22px]">
                            🏛️
                        </div>
                        <div className="min-w-0">
                            <div className="text-white font-black text-[15px] sm:text-[19px] tracking-[0.3px] truncate">
                                Forbes Royal College
                            </div>
                            <div className="text-white/65 text-[9px] sm:text-[11px] tracking-[0.6px] hidden sm:block">
                                STUDENT ADMISSIONS PORTAL — 2026 / 2027 INTAKE
                            </div>
                            <div className="text-white/65 text-[9px] tracking-[0.5px] sm:hidden">
                                ADMISSIONS PORTAL
                            </div>
                        </div>
                    </div>

                    {/* Nav buttons */}
                    <div className="flex gap-1.5 sm:gap-2 shrink-0">
                        <Link to="/"
                            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-[11px] sm:text-[13px] text-white transition-all whitespace-nowrap
                                ${variant === "application" ? "bg-white/20" : "bg-transparent hover:bg-white/10"}`}>
                            <span className="hidden sm:inline">📋 </span>Application
                        </Link>

                        <button onClick={handleOpen}
                            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-[11px] sm:text-[13px] text-white transition-all whitespace-nowrap cursor-pointer border-none
                                ${variant === "admin" ? "bg-white/20" : "bg-transparent hover:bg-white/10"}`}>
                            <span className="hidden sm:inline">🔒 </span>Admin
                        </button>
                    </div>
                </div>

                {/* ── STEP INDICATOR ── */}
                {variant === "application" && (
                    <div className="pt-4 sm:pt-5 pb-0">
                        <div className="flex items-start justify-center max-w-lg mx-auto sm:max-w-none">
                            {STEPS.map((step, i) => {
                                const done   = currentStep > step.num;
                                const active = currentStep === step.num;
                                return (
                                    <React.Fragment key={step.num}>
                                        <div className="flex items-start flex-1">
                                            <div className="flex flex-col items-center flex-1">
                                                <div className={`w-8 h-8 sm:w-[42px] sm:h-[42px] rounded-full flex items-center justify-center
                                                    font-extrabold text-[12px] sm:text-[15px] border-2 sm:border-[3px] transition-all
                                                    ${done   ? "bg-emerald-500 border-emerald-400 text-white"
                                                    : active ? "bg-white border-white text-primary"
                                                             : "bg-white/20 border-white/35 text-white/50"}`}>
                                                    {done ? "✓" : step.num}
                                                </div>
                                                <div className={`mt-1.5 sm:mt-2 text-[9px] sm:text-[11px] pb-3 sm:pb-4 text-center transition-all leading-tight
                                                    ${done   ? "font-bold text-emerald-300"
                                                    : active ? "font-bold text-white"
                                                             : "font-medium text-white/60"}`}>
                                                    {step.label}
                                                </div>
                                            </div>
                                            {i < STEPS.length - 1 && (
                                                <div className={`h-0.5 flex-1 mt-4 sm:mt-5 mx-0.5 transition-all
                                                    ${currentStep > step.num ? "bg-emerald-400" : "bg-white/20"}`} />
                                            )}
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                )}

                {variant === "admin" && <div className="pb-3" />}
            </div>

            {/* ── ADMIN AUTH MODAL ── */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
                >
                    <div className={`bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden transition-all
                        ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}>

                        {/* Modal header */}
                        <div className="bg-primary px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-[20px]">
                                    🔒
                                </div>
                                <div>
                                    <div className="text-white font-extrabold text-[16px]">Admin Access</div>
                                    <div className="text-white/65 text-[12px]">Forbes Royal College</div>
                                </div>
                            </div>
                        </div>

                        {/* Modal body */}
                        <div className="px-6 py-5">
                            <p className="text-slate-600 text-[13px] mb-4">
                                Enter your 6-digit admin access code to continue.
                            </p>

                            <input
                                type="password"
                                value={code}
                                onChange={(e) => { setCode(e.target.value); setError(""); }}
                                onKeyDown={handleKeyDown}
                                placeholder="••••••"
                                maxLength={6}
                                autoFocus
                                className={`w-full border-[1.5px] rounded-xl px-4 py-3 text-center text-[20px] tracking-[0.5em] outline-none transition-colors font-mono
                                    ${error ? "border-red-400 bg-red-50 text-red-700" : "border-slate-300 focus:border-primary"}`}
                            />

                            {error && (
                                <div className="flex items-center gap-1.5 mt-2.5">
                                    <span className="text-red-500 text-[13px]">⚠ {error}</span>
                                </div>
                            )}

                            <div className="flex gap-2.5 mt-5">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] cursor-pointer hover:bg-slate-50 transition-all bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogin}
                                    disabled={code.length < 6}
                                    className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-all border-none
                                        ${code.length < 6
                                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                            : "bg-primary text-white cursor-pointer hover:opacity-90"}`}
                                >
                                    Continue →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;