// utils/storage.ts

const API_BASE = "https://forbes-apply-api.johnvictordml.workers.dev";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApplicationRecord {
    id: number;
    appRef: string;
    status: "Pending" | "Payment Verified" | "Completed" | "Rejected";
    submittedAt: string;
    student: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        dob: string;
        gender: string;
        nationality: string;
        class: string;
    };
    payment?: {
        transferName: string;
        bankName: string;
        transferDate: string;
        receiptUrl?: string;
        receiptName?: string;
    };
    application?: {
        streetAddress: string;
        city: string;
        state: string;
        country: string;
        emergencyName: string;
        emergencyRelationship: string;
        emergencyPhone: string;
        previousSchool: string;
        yearCompleted: string;
        grade: string;
        subjects: string;
        extraCurricular: string;
        personalStatement: string;
        parentName: string;
        parentPhone: string;
        parentEmail: string;
        parentOccupation: string;
        disability: string;
        hearAbout: string;
    };
}

// ─── Read all ─────────────────────────────────────────────────────────────────

export const getApplications = async (): Promise<ApplicationRecord[]> => {
    try {
        const res = await fetch(`${API_BASE}/applications`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.map(mapFromDb);
    } catch {
        return [];
    }
};

// ─── Create or full-update (applicant form only) ──────────────────────────────
// This sends payment + application data. Uses PUT which does a safe merge on
// the server — existing fields are never wiped if you omit them.

export const saveApplication = async (app: ApplicationRecord): Promise<ApplicationRecord | null> => {
    try {
        if (app.id && app.id > 0) {
            // Full update — server merges, never overwrites with null
            const res = await fetch(`${API_BASE}/applications/${app.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mapToDb(app)),
            });
            if (!res.ok) {
                console.error("PUT failed:", await res.text());
                return null;
            }
            const data = await res.json();
            return mapFromDb(data);
        } else {
            // New record
            const res = await fetch(`${API_BASE}/applications`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mapToDb(app)),
            });
            if (!res.ok) {
                console.error("POST failed:", await res.text());
                return null;
            }
            const data = await res.json();
            return mapFromDb(data);
        }
    } catch (e) {
        console.error("Failed to save application:", e);
        return null;
    }
};

// ─── Update status only (admin dashboard) ────────────────────────────────────
// Uses PATCH /applications/:id/status — NEVER touches payment or application data

export const updateApplicationStatus = async (
    id: number,
    status: ApplicationRecord["status"]
): Promise<void> => {
    try {
        const res = await fetch(`${API_BASE}/applications/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) {
            console.error("PATCH status failed:", await res.text());
        }
    } catch (e) {
        console.error("Failed to update status:", e);
    }
};

// ─── Lookup by email ──────────────────────────────────────────────────────────

export const findApplicationByEmail = async (email: string): Promise<ApplicationRecord | null> => {
    try {
        const res = await fetch(`${API_BASE}/applications/by-email?email=${encodeURIComponent(email)}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data ? mapFromDb(data) : null;
    } catch {
        return null;
    }
};

// ─── Derive which step to resume from ────────────────────────────────────────

export const getResumeStep = (app: ApplicationRecord): 2 | 3 | null => {
    if (app.status === "Completed" || app.status === "Rejected") return null;
    if (app.payment) return 3;
    return 2;
};

// ─── Clear all (dev/testing only) ─────────────────────────────────────────────

export const clearApplications = (): void => {
    console.warn("clearApplications() is disabled when using the database.");
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mapToDb = (app: ApplicationRecord) => ({
    appRef:      app.appRef,
    status:      app.status,
    submittedAt: app.submittedAt,
    student:     app.student,
    payment:     app.payment     || null,
    application: app.application || null,
});

const mapFromDb = (row: any): ApplicationRecord => ({
    id:          row.id,
    appRef:      row.app_ref,
    status:      row.status,
    submittedAt: row.submitted_at,
    student:     typeof row.student     === "string" ? JSON.parse(row.student)     : row.student,
    payment:     row.payment
                   ? (typeof row.payment     === "string" ? JSON.parse(row.payment)     : row.payment)
                   : undefined,
    application: row.application
                   ? (typeof row.application === "string" ? JSON.parse(row.application) : row.application)
                   : undefined,
});