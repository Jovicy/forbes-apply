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

// ─── Write ────────────────────────────────────────────────────────────────────

export const saveApplication = async (app: ApplicationRecord): Promise<ApplicationRecord | null> => {
    try {
        if (app.id && app.id > 0) {
            const res = await fetch(`${API_BASE}/applications/${app.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mapToDb(app)),
            });
            const data = await res.json();
            return mapFromDb(data);
        } else {
            const res = await fetch(`${API_BASE}/applications`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mapToDb(app)),
            });
            const data = await res.json();
            return mapFromDb(data);
        }
    } catch (e) {
        console.error("Failed to save application:", e);
        return null;
    }
};

// ─── Update status ────────────────────────────────────────────────────────────

export const updateApplicationStatus = async (
    id: number,
    status: ApplicationRecord["status"]
): Promise<void> => {
    try {
        await fetch(`${API_BASE}/applications/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
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
    appRef: app.appRef,
    status: app.status,
    submittedAt: app.submittedAt,
    student: app.student,
    payment: app.payment || null,
    application: app.application || null,
});

const mapFromDb = (row: any): ApplicationRecord => ({
    id: row.id,
    appRef: row.app_ref,
    status: row.status,
    submittedAt: row.submitted_at,
    student: row.student,
    payment: row.payment,
    application: row.application,
});