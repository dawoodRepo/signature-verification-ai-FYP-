import { useState } from "react";
import { Upload } from "lucide-react";

export default function UploadZone({ onDrop, loading, isDark }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) onDrop(files);
  };

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*";
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length) onDrop(files);
    };
    input.click();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
        ${isDragging
          ? isDark ? "border-blue-500 bg-blue-500/10" : "border-blue-500 bg-blue-50"
          : isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-300 bg-white"}
        ${loading ? "opacity-75 pointer-events-none" : ""}`}
    >
      <Upload className={`mx-auto mb-4 ${isDark ? "text-gray-400" : "text-gray-400"}`} size={48} />
      <p className={`text-lg font-semibold mb-1 ${isDark ? "text-gray-200" : "text-gray-700"}`}>
        {isDragging ? "Drop images here..." : "Drag & drop signature images"}
      </p>
      <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>or click to select files</p>
      {loading && (
        <div className="mt-6 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse w-full" />
        </div>
      )}
    </div>
  );
}