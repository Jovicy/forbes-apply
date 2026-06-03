import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getApplications, updateApplicationStatus } from "../utils/storage";
import type { ApplicationRecord } from "../utils/storage";

type TabKey = "initial" | "payments" | "full";

const formatNaira = (amount: number): string =>
    "₦" + amount.toLocaleString("en-NG");

const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
});

const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });

const StatusBadge: React.FC<{ status: ApplicationRecord["status"] }> = ({ status }) => {
    const styles: Record<ApplicationRecord["status"], string> = {
        "Pending":          "bg-amber-100 text-amber-700",
        "Payment Verified": "bg-blue-100 text-blue-700",
        "Completed":        "bg-emerald-100 text-emerald-700",
        "Rejected":         "bg-red-100 text-red-700",
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${styles[status]}`}>
            {status}
        </span>
    );
};

interface StatCardProps {
    icon: string; value: string; label: string; valueClass?: string;
}
const StatCard: React.FC<StatCardProps> = ({ icon, value, label, valueClass = "text-primary" }) => (
    <div className="bg-white rounded-xl px-4 sm:px-5 py-4 border border-slate-200 flex gap-3 sm:gap-3.5 items-center">
        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-accent rounded-xl flex items-center justify-center text-[18px] sm:text-[22px] shrink-0">
            {icon}
        </div>
        <div className="min-w-0">
            <div className={`text-[20px] sm:text-[22px] font-black ${valueClass} truncate`}>{value}</div>
            <div className="text-[11px] sm:text-[12px] text-slate-500 mt-0.5 leading-tight">{label}</div>
        </div>
    </div>
);

interface TabBtnProps {
    active: boolean; onClick: () => void;
    icon: string; label: string; count: number;
}
const TabBtn: React.FC<TabBtnProps> = ({ active, onClick, icon, label, count }) => (
    <button onClick={onClick}
        className={`px-3 sm:px-4 py-2 rounded-lg border-none cursor-pointer font-bold text-[12px] sm:text-[13px]
            flex items-center gap-1 sm:gap-1.5 transition-all whitespace-nowrap
            ${active ? "bg-primary text-white" : "bg-transparent text-slate-500 hover:text-slate-700"}`}>
        <span className="hidden sm:inline">{icon}</span>
        <span>{label}</span>
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] sm:text-[11px] ${active ? "bg-white/25" : "bg-slate-200"}`}>
            {count}
        </span>
    </button>
);

const EmptyState: React.FC<{ message?: string }> = ({ message = "No submissions yet" }) => (
    <div className="py-10 sm:py-12 px-6 text-center text-slate-400">
        <div className="text-[36px] sm:text-[40px] mb-3">📭</div>
        <div className="font-semibold text-[13px] sm:text-[14px]">{message}</div>
    </div>
);

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <th className="text-left px-4 py-3 text-[11px] sm:text-[12px] font-extrabold text-slate-500 uppercase tracking-[0.8px] whitespace-nowrap">
        {children}
    </th>
);
const Td: React.FC<{ children: React.ReactNode; mono?: boolean }> = ({ children, mono }) => (
    <td className={`px-4 py-3.5 text-[12px] sm:text-[13px] text-slate-700 ${mono ? "font-mono" : ""}`}>
        {children}
    </td>
);

// ─── Receipt Viewer ───────────────────────────────────────────────────────────

const ReceiptViewer: React.FC<{ receiptUrl: string; receiptName?: string }> = ({
    receiptUrl,
    receiptName,
}) => {
    const [expanded, setExpanded] = useState(false);

    const isPdf   = receiptUrl.startsWith("data:application/pdf") ||
                    (receiptName ?? "").toLowerCase().endsWith(".pdf");
    const isImage = receiptUrl.startsWith("data:image") ||
                    /\.(jpe?g|png|webp)$/i.test(receiptName ?? "");

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = receiptUrl;
        link.download = receiptName || "receipt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-2 px-3.5 py-2.5">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] text-slate-400 w-32 shrink-0">Receipt</span>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Toggle preview button (images & PDFs) */}
                    {(isImage || isPdf) && (
                        <button
                            onClick={() => setExpanded((v) => !v)}
                            className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-[12px] font-bold px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-all border-none cursor-pointer"
                        >
                            {expanded ? "🙈 Hide Preview" : "👁 View Receipt"}
                        </button>
                    )}
                    {/* Download button */}
                    <button
                        onClick={handleDownload}
                        className="inline-flex items-center gap-1.5 bg-primary text-white text-[12px] font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-all border-none cursor-pointer"
                    >
                        ⬇ Download
                    </button>
                    {/* File name */}
                    {receiptName && (
                        <span className="text-[11px] text-slate-400 italic truncate max-w-[160px]">{receiptName}</span>
                    )}
                </div>
            </div>

            {/* Inline preview */}
            {expanded && (
                <div className="mt-1 ml-0 sm:ml-[8.5rem] rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    {isImage && (
                        <img
                            src={receiptUrl}
                            alt="Payment receipt"
                            className="w-full max-h-[420px] object-contain"
                        />
                    )}
                    {isPdf && (
                        <iframe
                            src={receiptUrl}
                            title="Payment receipt"
                            className="w-full h-[480px] border-none"
                        />
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

const DetailModal: React.FC<{
    app: ApplicationRecord;
    onClose: () => void;
    onStatusChange: (id: number, status: ApplicationRecord["status"]) => void;
}> = ({ app, onClose, onStatusChange }) => {
    const statuses: ApplicationRecord["status"][] = ["Pending", "Payment Verified", "Completed", "Rejected"];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center px-3 sm:px-4 py-6 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
                {/* Header */}
                <div className="bg-primary px-5 sm:px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <div>
                        <div className="text-white font-extrabold text-[16px]">
                            {app.student.firstName} {app.student.lastName}
                        </div>
                        <div className="text-white/70 text-[12px] font-mono mt-0.5">{app.appRef}</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white text-[22px] leading-none cursor-pointer bg-transparent border-none"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-5 sm:p-6 flex flex-col gap-5">
                    {/* Status updater */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[12px] font-bold text-slate-600">Update Status:</span>
                        {statuses.map((s) => (
                            <button
                                key={s}
                                onClick={() => onStatusChange(app.id, s)}
                                className={`px-3 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition-all
                                    ${app.status === s
                                        ? "bg-primary text-white border-primary"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-primary hover:text-primary"
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Current status */}
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                        <span className="text-[12px] text-slate-500 font-medium">Current status:</span>
                        <StatusBadge status={app.status} />
                    </div>

                    {/* Student info */}
                    <Section title="👤 Student Information">
                        <Row label="Full Name"   value={`${app.student.firstName} ${app.student.lastName}`} />
                        <Row label="Email"       value={app.student.email} />
                        <Row label="Phone"       value={app.student.phone} />
                        <Row label="DOB"         value={app.student.dob} />
                        <Row label="Gender"      value={app.student.gender || "—"} />
                        <Row label="Nationality" value={app.student.nationality || "—"} />
                        <Row label="Grade"       value={app.student.class} />
                        <Row label="Applied On"  value={formatDate(app.submittedAt)} />
                    </Section>

                    {/* Payment — with receipt viewer */}
                    {app.payment && (
                        <Section title="💳 Payment Confirmation">
                            <Row label="Sender Name"   value={app.payment.transferName} />
                            <Row label="Sender Bank"   value={app.payment.bankName} />
                            <Row label="Transfer Date" value={app.payment.transferDate} />
                            {app.payment.receiptUrl ? (
                                <ReceiptViewer
                                    receiptUrl={app.payment.receiptUrl}
                                    receiptName={app.payment.receiptName}
                                />
                            ) : (
                                <Row label="Receipt" value="No receipt uploaded" />
                            )}
                        </Section>
                    )}

                    {/* Full application sections */}
                    {app.application && (
                        <>
                            <Section title="🏠 Address">
                                <Row label="Street"  value={app.application.streetAddress} />
                                <Row label="City"    value={app.application.city} />
                                <Row label="State"   value={app.application.state || "—"} />
                                <Row label="Country" value={app.application.country} />
                            </Section>
                            <Section title="👨‍👩‍👦 Parent / Guardian">
                                <Row label="Name"       value={app.application.parentName} />
                                <Row label="Phone"      value={app.application.parentPhone} />
                                <Row label="Email"      value={app.application.parentEmail || "—"} />
                                <Row label="Occupation" value={app.application.parentOccupation || "—"} />
                            </Section>
                            <Section title="🚨 Emergency Contact">
                                <Row label="Name"         value={app.application.emergencyName} />
                                <Row label="Relationship" value={app.application.emergencyRelationship} />
                                <Row label="Phone"        value={app.application.emergencyPhone} />
                            </Section>
                            <Section title="🎓 Academic Background">
                                <Row label="Previous School" value={app.application.previousSchool} />
                                <Row label="Year Completed"  value={app.application.yearCompleted} />
                                <Row label="Grade"           value={app.application.grade || "—"} />
                            </Section>
                            <Section title="✍️ Personal Statement">
                                <p className="text-[13px] text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3">
                                    {app.application.personalStatement}
                                </p>
                            </Section>
                            {(app.application.subjects || app.application.extraCurricular) && (
                                <Section title="📚 Extras">
                                    {app.application.subjects && (
                                        <Row label="Subjects" value={app.application.subjects} />
                                    )}
                                    {app.application.extraCurricular && (
                                        <Row label="Extra-curricular" value={app.application.extraCurricular} />
                                    )}
                                </Section>
                            )}
                            <Section title="ℹ️ Additional">
                                <Row label="Disability"   value={app.application.disability  || "—"} />
                                <Row label="Heard via"    value={app.application.hearAbout    || "—"} />
                            </Section>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <div className="text-[11px] font-extrabold text-primary uppercase tracking-[1px] mb-2.5">{title}</div>
        <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">{children}</div>
    </div>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex gap-3 px-3.5 py-2.5 border-b border-slate-100 last:border-0">
        <span className="text-[12px] text-slate-400 w-32 shrink-0">{label}</span>
        <span className="text-[12px] text-slate-700 font-medium break-words min-w-0">{value}</span>
    </div>
);

// ─── Admin Page ───────────────────────────────────────────────────────────────

const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab]       = useState<TabKey>("initial");
    const [applications, setApplications] = useState<ApplicationRecord[]>([]);
    const [selectedApp, setSelectedApp]   = useState<ApplicationRecord | null>(null);
    const [loading, setLoading]           = useState(false);

    // Load once on mount — tab switching never re-fetches,
    // so records are never lost when status changes
    useEffect(() => {
        loadApps();
    }, []);

    const loadApps = async () => {
        setLoading(true);
        const apps = await getApplications();
        setApplications(apps);
        setLoading(false);
    };

    const handleStatusChange = async (id: number, status: ApplicationRecord["status"]) => {
        // Uses PATCH /applications/:id/status — never wipes payment/application data
        await updateApplicationStatus(id, status);

        // Update in-place in state so record stays in every tab it belongs to
        setApplications((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status } : a))
        );
        // Keep modal open with updated status
        setSelectedApp((prev) =>
            prev && prev.id === id ? { ...prev, status } : prev
        );
    };

    // ── Tab filtering — based on data presence, NEVER on status ──────────────
    const initialApps = applications;
    const paymentApps = applications.filter((a) => a.payment);
    const fullApps    = applications.filter((a) => a.application);

    const tabData: Record<TabKey, ApplicationRecord[]> = {
        initial:  initialApps,
        payments: paymentApps,
        full:     fullApps,
    };

    const counts = {
        initial:  initialApps.length,
        payments: paymentApps.length,
        full:     fullApps.length,
    };

    const stats = {
        totalApplicants:    applications.length,
        paymentsCollected:  paymentApps.length * 30000,
        fullFormsSubmitted: fullApps.length,
    };

    const tabs: { key: TabKey; icon: string; label: string }[] = [
        { key: "initial",  icon: "📋", label: "Initial Applications" },
        { key: "payments", icon: "💳", label: "Payments"             },
        { key: "full",     icon: "📝", label: "Full Applications"    },
    ];

    const currentRows = tabData[activeTab];

    return (
        <>
            <Navbar variant="admin" />
            <div className="mx-auto py-6 sm:py-8 px-3 sm:px-4 pb-12 max-w-7xl">
                <div className="bg-white rounded-2xl px-4 sm:px-8 md:px-10 py-6 sm:py-9 shadow-[0_2px_20px_rgba(11,53,123,0.08)] border border-slate-200">

                    {/* Header */}
                    <div className="mb-5 sm:mb-6 flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-[18px] sm:text-[22px] font-extrabold text-primary">Admin Dashboard</h1>
                            <p className="text-[12px] sm:text-[13px] text-slate-500 mt-1">Live data — {today}</p>
                        </div>
                        <button
                            onClick={loadApps}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-bold cursor-pointer hover:bg-slate-50 transition-all bg-white disabled:opacity-50"
                        >
                            🔄 {loading ? "Loading…" : "Refresh"}
                        </button>
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-7">
                        <StatCard icon="👥" value={String(stats.totalApplicants)}       label="Total Applicants" />
                        <StatCard icon="💰" value={formatNaira(stats.paymentsCollected)} label="Payments Collected" valueClass="text-emerald-600" />
                        <StatCard icon="📝" value={String(stats.fullFormsSubmitted)}    label="Full Forms Submitted" valueClass="text-violet-700" />
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mb-5 bg-slate-100 rounded-xl p-1 w-fit max-w-full overflow-x-auto">
                        {tabs.map((tab) => (
                            <TabBtn
                                key={tab.key}
                                active={activeTab === tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                icon={tab.icon}
                                label={tab.label}
                                count={counts[tab.key]}
                            />
                        ))}
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        {loading ? (
                            <div className="py-10 text-center text-slate-400 text-[13px]">
                                <div className="text-[30px] mb-2">⏳</div>
                                Loading applications…
                            </div>
                        ) : currentRows.length === 0 ? (
                            <EmptyState
                                message={
                                    activeTab === "initial"  ? "No initial applications yet"  :
                                    activeTab === "payments" ? "No payments recorded yet"      :
                                                               "No full applications yet"
                                }
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[640px]">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <Th>Name</Th>
                                            <Th>Grade</Th>
                                            <Th>Reference</Th>
                                            <Th>Date</Th>
                                            <Th>Status</Th>
                                            {activeTab === "payments" && <Th>Bank</Th>}
                                            {activeTab === "payments" && <Th>Receipt</Th>}
                                            <Th>Action</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentRows.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                            >
                                                <Td>
                                                    <div className="font-semibold">{item.student.firstName} {item.student.lastName}</div>
                                                    <div className="text-[11px] text-slate-400 mt-0.5">{item.student.email}</div>
                                                </Td>
                                                <Td>{item.student.class}</Td>
                                                <Td mono>{item.appRef}</Td>
                                                <Td>{formatDate(item.submittedAt)}</Td>
                                                <Td><StatusBadge status={item.status} /></Td>
                                                {activeTab === "payments" && (
                                                    <Td>{item.payment?.bankName || "—"}</Td>
                                                )}
                                                {activeTab === "payments" && (
                                                    <Td>
                                                        {item.payment?.receiptUrl ? (
                                                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[12px]">
                                                                ✅ Uploaded
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-[12px]">—</span>
                                                        )}
                                                    </Td>
                                                )}
                                                <Td>
                                                    <button
                                                        onClick={() => setSelectedApp(item)}
                                                        className="bg-primary text-white px-3 sm:px-4 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer hover:opacity-90 transition-all border-none"
                                                    >
                                                        View
                                                    </button>
                                                </Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
                <Footer />
            </div>

            {selectedApp && (
                <DetailModal
                    app={selectedApp}
                    onClose={() => setSelectedApp(null)}
                    onStatusChange={handleStatusChange}
                />
            )}
        </>
    );
};

export default AdminPage;