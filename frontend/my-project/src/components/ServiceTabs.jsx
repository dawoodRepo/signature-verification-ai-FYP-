import { CheckCircle, FileCheck, Users } from "lucide-react";

export default function ServiceTabs({ service, setService, isDark }) {
  const tabs = [
    { id: "full", label: "Full Verification", icon: CheckCircle },
    { id: "forgery", label: "Forgery Detection", icon: FileCheck },
    { id: "person", label: "Person ID", icon: Users },
  ];

  return (
    <div className="flex justify-center gap-2 mb-8 flex-wrap">
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setService(tab.id)}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all text-sm flex items-center gap-2
              ${service === tab.id
                ? isDark
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-blue-600 text-white shadow-lg"
                : isDark
                  ? "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-750"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}