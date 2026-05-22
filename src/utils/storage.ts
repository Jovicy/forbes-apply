// utils/storage.ts
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

const STORAGE_KEY = "frc_applications";

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getApplications = (): ApplicationRecord[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as ApplicationRecord[]) : [];
    } catch {
        return [];
    }
};

// ─── Write ────────────────────────────────────────────────────────────────────

export const saveApplication = (app: ApplicationRecord): void => {
    try {
        const existing = getApplications();
        // Update if same id already exists, otherwise append
        const idx = existing.findIndex((a) => a.id === app.id);
        if (idx >= 0) {
            existing[idx] = app;
        } else {
            existing.push(app);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
        console.error("Failed to save application:", e);
    }
};

// ─── Update status ────────────────────────────────────────────────────────────

export const updateApplicationStatus = (
    id: number,
    status: ApplicationRecord["status"]
): void => {
    const existing = getApplications();
    const idx = existing.findIndex((a) => a.id === id);
    if (idx >= 0) {
        existing[idx].status = status;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    }
};

// ─── Clear all (dev/testing only) ─────────────────────────────────────────────

export const clearApplications = (): void => {
    localStorage.removeItem(STORAGE_KEY);
};