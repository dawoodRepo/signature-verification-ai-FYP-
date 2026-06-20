import { CheckCircle, XCircle, Download } from "lucide-react";
import { getCertaintyColor, getVerdictColor, formatConfidence, downloadCSV } from "../utils/helpers";

export default function BatchResults({ data, isDark }) {
    const { results, verified_count, rejected_count, total_files } = data;

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4 text-sm font-semibold">
                    {data.verified_count !== undefined ? (
                        <>
                            <span className={isDark ? "text-emerald-400" : "text-emerald-600"}>
                                <CheckCircle className="inline mr-1" size={16} />
                                {data.verified_count} Real
                            </span>
                            <span className={isDark ? "text-red-400" : "text-red-600"}>
                                <XCircle className="inline mr-1" size={16} />
                                {data.rejected_count} Fake
                            </span>
                        </>
                    ) : (
                        <>
                            <span className={isDark ? "text-emerald-400" : "text-emerald-600"}>
                                <CheckCircle className="inline mr-1" size={16} />
                                {data.verified_count} Verified
                            </span>
                            <span className={isDark ? "text-red-400" : "text-red-600"}>
                                <XCircle className="inline mr-1" size={16} />
                                {data.rejected_count} Rejected
                            </span>
                        </>
                    )}
                    <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                        {data.total_files} Total
                    </span>
                </div>
                <button
                    onClick={() => downloadCSV(results)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2
            ${isDark ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"}`}
                >
                    <Download size={16} /> Export CSV
                </button>
            </div>

            <div className={`rounded-2xl shadow-xl border overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <table className="w-full">
                    <thead className={isDark ? "bg-gray-900/50 border-b border-gray-700" : "bg-gray-50 border-b"}>
                        <tr>
                            {["File", "Verdict", "Certainty", "Confidence", "Person"].map(h => (
                                <th key={h} className={`text-left px-4 py-3 text-xs font-semibold uppercase ${isDark ? "text-gray-400" : "text-gray-600"}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}>
                        {results.map((r, i) => {
                            const f = r.phase_1_forgery_detection ?? r.result;
                            const p = r.phase_2_person_identification ?? r.result;
                            return (
                                <tr key={i} className={`transition-colors ${isDark ? "hover:bg-gray-750" : "hover:bg-gray-50"}`}>
                                    <td className={`px-4 py-3 text-sm font-mono ${isDark ? "text-gray-300" : "text-gray-700"}`}>{r.filename}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${getVerdictColor(r.final_verdict || f?.label || p?.predicted_person, isDark)}`}>
                                            {r.final_verdict || f?.label || p?.predicted_person || "-"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${getCertaintyColor(f?.certainty, isDark)}`}>
                                            {f?.certainty || "-"}
                                        </span>
                                    </td>
                                    <td className={`px-4 py-3 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                                        {formatConfidence(f?.confidence ?? p?.confidence)}
                                    </td>
                                    <td className={`px-4 py-3 text-sm font-semibold ${isDark ? "text-blue-400" : "text-blue-700"}`}>
                                        {p?.predicted_person || "-"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}