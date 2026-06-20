import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:5000",
    timeout: 60000,
});

// Helper to normalize forgery-only batch
const normalizeForgeryBatch = (data) => {
    return {
        results: data.results.map(r => ({
            filename: r.filename,
            final_verdict: r.is_real ? "REAL" : "FAKE",
            phase_1_forgery_detection: {
                certainty: r.certainty,
                confidence: r.confidence,
                is_real: r.is_real,
                label: r.label,
                threshold_used: r.threshold_used,
            },
            phase_2_person_identification: null,
            status: r.status,
        })),
        verified_count: data.real_count || 0,
        rejected_count: data.fake_count || 0,
        total_files: data.total_files,
    };
};

// Helper for person-only batch (if needed later)
const normalizePersonBatch = (data) => {
    return {
        results: data.results.map(r => ({
            filename: r.filename,
            final_verdict: "IDENTIFIED",
            phase_1_forgery_detection: null,
            phase_2_person_identification: {
                predicted_person: r.predicted_person,
                confidence: r.confidence,
                top_predictions: r.top_predictions || [],
            },
        })),
        verified_count: data.results.length,
        rejected_count: 0,
        total_files: data.total_files,
    };
};

export const uploadFiles = async (files, service = "full") => {
    if (!files || files.length === 0) throw new Error("No files provided");

    const isBatch = files.length > 1;
    const formData = new FormData();

    if (isBatch) {
        files.forEach((file) => formData.append("signatures", file));
    } else {
        formData.append("signature", files[0]);
    }

    const endpointMap = {
        full: isBatch ? "/verify-batch" : "/verify",
        forgery: isBatch ? "/detect-forgery-batch" : "/detect-forgery",
        person: isBatch ? "/identify-person-batch" : "/identify-person",
    };

    const endpoint = endpointMap[service];
    if (!endpoint) throw new Error(`Invalid service: ${service}`);

    const { data } = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    // Normalize forgery batch response
    if (service === "forgery" && isBatch && data.service === "batch_forgery_detection") {
        return normalizeForgeryBatch(data);
    }

    // Normalize person batch (if needed)
    if (service === "person" && isBatch) {
        return normalizePersonBatch(data);
    }

    return data;
};