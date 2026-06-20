import { FileCheck } from "lucide-react";
import { getCertaintyColor, getVerdictColor, formatConfidence, generateSmartMessage } from "../utils/helpers";

export default function ResultCard({ result, isDark }) {
    const isFull = !!result.final_verdict;
    const forgery = isFull ? result.phase_1_forgery_detection : result.result;
    const person = isFull ? result.phase_2_person_identification : result.result;
    const smartMessage = generateSmartMessage(result);

    return (
        <div className={`rounded-2xl shadow-xl border p-6 mb-4 transition-all ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <FileCheck size={18} className={isDark ? "text-gray-400" : "text-gray-500"} />
                    <h3 className={`font-mono text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{result.filename}</h3>
                </div>
                {isFull ? (
                    <span className={`... ${getVerdictColor(result.final_verdict, isDark)}`}>
                        {result.final_verdict}
                    </span>
                ) : forgery ? (
                    <span className={`... ${getVerdictColor(forgery.is_real ? "REAL" : "FAKE", isDark)}`}>
                        {forgery.label}
                    </span>
                ) : null}
            </div>

            <div className={`p-4 rounded-xl mb-4 ${isDark ? "bg-gray-900/50" : "bg-gray-50"}`}>
                <p className={`${isDark ? "text-gray-200" : "text-gray-800"} leading-relaxed`}>{smartMessage}</p>
            </div>

            {forgery && (
                <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getCertaintyColor(forgery.certainty, isDark)}`}>
                            {forgery.certainty || "—"}
                        </span>
                        <div className="flex-1">
                            <div className={`h-3 rounded-full overflow-hidden ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
                                <div
                                    className={`h-full transition-all ${forgery.is_real ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-red-500 to-red-400"}`}
                                    style={{ width: `${forgery.confidence || 0}%` }}
                                />
                            </div>
                            <p className={`text-xs mt-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                {formatConfidence(forgery.confidence)} confidence → {forgery.is_real ? "Real" : "Fake"}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {person?.predicted_person && (
                <div className={`pt-4 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                    <p className={`font-semibold text-lg mb-3 ${isDark ? "text-blue-400" : "text-blue-700"}`}>
                        {person.predicted_person} ({formatConfidence(person.confidence)})
                    </p>
                    <div className="space-y-2">
                        {person.top_predictions?.slice(0, 3).map((p, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>#{i + 1} {p.person}</span>
                                <div className="flex items-center gap-2">
                                    <div className={`w-24 h-2 rounded-full overflow-hidden ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
                                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${p.probability}%` }} />
                                    </div>
                                    <span className={`font-mono text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>{formatConfidence(p.probability)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}