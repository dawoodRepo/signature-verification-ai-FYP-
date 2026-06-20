import { useState } from "react";
import { Moon, Sun, AlertCircle } from "lucide-react";
import UploadZone from "./components/UploadZone";
import ServiceTabs from "./components/ServiceTabs";
import ResultCard from "./components/ResultCard";
import BatchResults from "./components/BatchResults";
import { uploadFiles } from "./api/client";

export default function App() {
  const [service, setService] = useState("full");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDark, setIsDark] = useState(true);

  const handleDrop = async (files) => {
    if (!files.length) return;
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const data = await uploadFiles(files, service);
      setResults(data);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const isBatch = results && Array.isArray(results.results);
  const single = results && !isBatch ? results : null;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark
      ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"} py-10 px-4`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              Signature Verification
            </h1>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              AI-powered authentication & identification system
            </p>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-3 rounded-xl transition-all ${isDark
              ? "bg-gray-800 text-yellow-400 hover:bg-gray-750 border border-gray-700"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-lg"}`}
          >
            {isDark ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>

        <ServiceTabs service={service} setService={setService} isDark={isDark} />
        <UploadZone onDrop={handleDrop} loading={loading} isDark={isDark} />

        {error && (
          <div className={`mt-6 p-4 rounded-xl border flex items-start gap-3 ${isDark
            ? "bg-red-500/10 border-red-500/30 text-red-400"
            : "bg-red-50 border-red-200 text-red-700"}`}>
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {single && <ResultCard result={single} isDark={isDark} />}
        {isBatch && <BatchResults data={results} isDark={isDark} />}

        {!loading && !results && (
          <p className={`text-center mt-8 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
            Select a mode and drop signature images to begin verification
          </p>
        )}
      </div>
    </div>
  );
}