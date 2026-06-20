export const getCertaintyColor = (certainty, isDark = false) => {
  const c = certainty?.toUpperCase();
  const dark = (base) => `${base}/20 text-${base.split("-")[0]}-400 border-${base.split("-")[0]}-500/30`;
  const light = (bg, txt, border) => `${bg} ${txt} ${border}`;

  if (c?.includes("VERY HIGH")) return isDark ? dark("bg-emerald-500") : light("bg-emerald-100", "text-emerald-700", "border-emerald-200");
  if (c?.includes("HIGH"))      return isDark ? dark("bg-blue-500")     : light("bg-blue-100",     "text-blue-700",     "border-blue-200");
  if (c?.includes("MODERATE"))  return isDark ? dark("bg-amber-500")   : light("bg-amber-100",   "text-amber-700",   "border-amber-200");
  if (c?.includes("LOW") || c?.includes("UNCERTAIN"))
    return isDark ? dark("bg-red-500") : light("bg-red-100", "text-red-700", "border-red-200");
  return isDark ? dark("bg-gray-500") : light("bg-gray-100", "text-gray-600", "border-gray-200");
};

export const getVerdictColor = (verdict, isDark = false) => {
  const dark = (base) => `${base}/20 text-${base.split("-")[0]}-400 border-${base.split("-")[0]}-500/30`;
  const light = (bg, txt, border) => `${bg} ${txt} ${border}`;

  if (verdict === "IDENTIFIED" || verdict === "VERIFIED")
    return isDark ? dark("bg-emerald-500") : light("bg-emerald-100", "text-emerald-700", "border-emerald-200");
  if (verdict === "REJECTED")
    return isDark ? dark("bg-red-500") : light("bg-red-100", "text-red-700", "border-red-200");
  if (verdict === "MISMATCH")
    return isDark ? dark("bg-orange-500") : light("bg-orange-100", "text-orange-700", "border-orange-200");
  return isDark ? dark("bg-gray-500") : light("bg-gray-100", "text-gray-600", "border-gray-200");
};

export const formatConfidence = (val) => `${(val ?? 0).toFixed(1)}%`;

export const generateSmartMessage = (result) => {
  const isFull = !!result.final_verdict;
  const forgery = isFull ? result.phase_1_forgery_detection : result.result;
  const person = isFull ? result.phase_2_person_identification : result.result;

  if (forgery && !person?.predicted_person) {
    const conf = forgery.confidence;
    if (forgery.is_real) {
      if (conf >= 90) return `This signature looks authentic! I'm ${conf.toFixed(1)}% confident it's real.`;
      if (conf >= 75) return `This appears to be a genuine signature. I'm fairly confident (${conf.toFixed(1)}%) it's real.`;
      if (conf >= 60) return `I think this signature is real, but I'm not completely certain. My confidence is around ${conf.toFixed(1)}%.`;
      return `Hmm, this might be real, but I'm not very confident (${conf.toFixed(1)}%). You might want a second opinion.`;
    } else {
      if (conf >= 90) return `This signature looks fake to me. I'm ${conf.toFixed(1)}% certain it's forged.`;
      if (conf >= 75) return `I believe this is a forged signature with ${conf.toFixed(1)}% confidence.`;
      if (conf >= 60) return `This signature seems suspicious. I'm moderately confident (${conf.toFixed(1)}%) it might be fake.`;
      return `I suspect this might be forged, but I'm not very sure. Only ${conf.toFixed(1)}% confident.`;
    }
  }

  if (person?.predicted_person) {
    const conf = person.confidence;
    const name = person.predicted_person;
    const top2 = person.top_predictions?.[1];
    if (conf >= 90) return `This is definitely ${name}'s signature! I'm ${conf.toFixed(1)}% sure.`;
    if (conf >= 75) return `I'm pretty confident (${conf.toFixed(1)}%) this belongs to ${name}.`;
    if (conf >= 60) return `Looks like ${name} to me, though I'm not completely certain (${conf.toFixed(1)}% confidence).`;
    if (top2) return `I think this might be ${name}, but honestly I'm not very confident (${conf.toFixed(1)}%). Could also be ${top2.person} (${top2.probability.toFixed(1)}%).`;
    return `My best guess is ${name}, but I'm really not sure about this one. Only ${conf.toFixed(1)}% confident.`;
  }

  return result.message || "Analysis complete!";
};

export const downloadCSV = (results) => {
  const headers = ["filename","verdict","certainty","confidence","person","top1","top1_prob","top2","top2_prob","top3","top3_prob"];
  const rows = results.map(r => {
    const f = r.phase_1_forgery_detection ?? r.result;
    const p = r.phase_2_person_identification ?? r.result;
    const top = p?.top_predictions ?? [];
    return [
      r.filename,
      r.final_verdict ?? f?.label ?? p?.predicted_person ?? "",
      f?.certainty ?? "",
      f?.confidence ?? p?.confidence ?? "",
      p?.predicted_person ?? "",
      top[0]?.person ?? "", top[0]?.probability ?? "",
      top[1]?.person ?? "", top[1]?.probability ?? "",
      top[2]?.person ?? "", top[2]?.probability ?? ""
    ];
  });
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `signature_results_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};