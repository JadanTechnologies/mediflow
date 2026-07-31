import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { Prescription } from "../../types/pharmacy";
import { CardGridSkeleton } from "../ui/ModuleSkeletons";
import { RbacGuard } from "../auth/RbacGuard";
import {
  FileText,
  Plus,
  Sparkles,
  Printer,
  User,
  Stethoscope,
  X,
  Search,
} from "lucide-react";

export const PrescriptionModule: React.FC = () => {
  const { prescriptions, customers, medicines, addPrescription, isLoading } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState("");
  const [showNewRxModal, setShowNewRxModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [activeRxView, setActiveRxView] = useState<Prescription | null>(null);

  // OCR Upload State
  const [ocrText, setOcrText] = useState("");
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);

  // Form State
  const [patientId, setPatientId] = useState(customers[0]?.id || "cust-1");
  const [doctorName, setDoctorName] = useState("Dr. Sarah Jenkins, MD");
  const [doctorLicense, setDoctorLicense] = useState("MD-NY-99182");
  const [clinicHospital, setClinicHospital] = useState("St. Jude Medical Center");
  const [diagnosis, setDiagnosis] = useState("Essential Hypertension");
  const [rxMedicines, setRxMedicines] = useState<
    {
      medicineName: string;
      dosage: string;
      morning: boolean;
      afternoon: boolean;
      night: boolean;
      durationDays: number;
      instructions: string;
    }[]
  >([
    {
      medicineName: "Lipitor 20mg Tablet",
      dosage: "20mg",
      morning: false,
      afternoon: false,
      night: true,
      durationDays: 30,
      instructions: "Take 1 tablet at bedtime.",
    },
  ]);

  if (isLoading) {
    return <CardGridSkeleton count={6} />;
  }

  const filteredPrescriptions = prescriptions.filter(
    (p) =>
      p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prescriptionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.doctorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMedicineRow = () => {
    setRxMedicines((prev) => [
      ...prev,
      {
        medicineName: medicines[0]?.name || "Amoxicillin 500mg",
        dosage: "500mg",
        morning: true,
        afternoon: false,
        night: true,
        durationDays: 7,
        instructions: "Take with food.",
      },
    ]);
  };

  const handleSavePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPatient = customers.find((c) => c.id === patientId);
    addPrescription({
      patientId: selectedPatient?.id || "cust-1",
      patientName: selectedPatient?.name || "John Doe",
      patientAge: selectedPatient?.age || 45,
      patientGender: selectedPatient?.gender || "Male",
      doctorName,
      doctorLicense,
      clinicHospital,
      diagnosis,
      medicines: rxMedicines,
      status: "Dispensed",
      digitalSignatureUrl: `VERIFIED_MD_SIG_${Date.now()}`,
    });
    setShowNewRxModal(false);
  };

  // Process AI OCR Scanner
  const handleProcessOcr = async () => {
    if (!ocrText) return;
    setIsProcessingOcr(true);
    try {
      const res = await fetch("/api/ai/prescription-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textContent: ocrText }),
      });
      const data = await res.json();

      if (data.doctorName) setDoctorName(data.doctorName);
      if (data.diagnosis) setDiagnosis(data.diagnosis);
      if (data.medicines && Array.isArray(data.medicines)) {
        setRxMedicines(
          data.medicines.map((m: any) => ({
            medicineName: m.name || "Parsed Medicine",
            dosage: m.dosage || "500mg",
            morning: true,
            afternoon: false,
            night: true,
            durationDays: 14,
            instructions: m.instructions || "Take as directed",
          }))
        );
      }
      setShowOcrModal(false);
      setShowNewRxModal(true);
    } catch (e) {
      console.error(e);
      alert("Failed to parse OCR prescription text.");
    } finally {
      setIsProcessingOcr(false);
    }
  };

  return (
    <RbacGuard permission="prescriptions_manage">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span>Prescriptions & AI OCR Scanner</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Create clinical doctor prescriptions, verify digital signatures, and parse handwriting via AI OCR.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOcrModal(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI OCR Prescription Reader</span>
            </button>

            <button
              onClick={() => setShowNewRxModal(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Clinical Rx</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient Name, Rx Number, or Doctor License..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Prescriptions List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrescriptions.map((rx) => (
            <div
              key={rx.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full">
                    {rx.prescriptionNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      rx.status === "Dispensed"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {rx.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{rx.patientName}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      ({rx.patientAge}y, {rx.patientGender})
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <Stethoscope className="h-3.5 w-3.5 text-blue-500" />
                    <span>{rx.doctorName} • {rx.clinicHospital}</span>
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Diagnosis & Regimen
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {rx.diagnosis}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {rx.medicines.length} Medication Item(s) Prescribed
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">{rx.date}</span>
                <button
                  onClick={() => setActiveRxView(rx)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>View Rx Details</span>
                  <Printer className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* AI OCR Scanner Modal */}
        {showOcrModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    AI Prescription OCR Scanner
                  </h3>
                </div>
                <button onClick={() => setShowOcrModal(false)}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paste doctor's prescription text or OCR raw transcription below. Gemini will extract patient name, doctor credentials, diagnosis, and drug dosage schedules automatically!
              </p>

              <textarea
                rows={6}
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder="Paste doctor prescription text or OCR transcript e.g.:&#10;Dr. Sarah Jenkins MD, Cardiology&#10;Patient: John Doe, 52y Male&#10;Diagnosis: Hypertension&#10;Rx: Amlovas 5mg (1-0-1 for 30 days) and Lipitor 10mg at night..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <button
                onClick={handleProcessOcr}
                disabled={isProcessingOcr || !ocrText}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isProcessingOcr ? "Extracting Prescription Data..." : "Parse Prescription via AI"}</span>
              </button>
            </div>
          </div>
        )}

        {/* New Prescription Form Modal */}
        {showNewRxModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Create Clinical Prescription (Rx)
                </h3>
                <button onClick={() => setShowNewRxModal(false)}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSavePrescription} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Select Patient
                    </label>
                    <select
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.patientCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Doctor Name & Credentials
                    </label>
                    <input
                      type="text"
                      required
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Clinic / Hospital Name
                    </label>
                    <input
                      type="text"
                      value={clinicHospital}
                      onChange={(e) => setClinicHospital(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Clinical Diagnosis
                    </label>
                    <input
                      type="text"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                {/* Prescribed Items Table */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">
                      Prescribed Medication & Dosage Schedule
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddMedicineRow}
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      + Add Item
                    </button>
                  </div>

                  {rxMedicines.map((medRow, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={medRow.medicineName}
                          onChange={(e) => {
                            const updated = [...rxMedicines];
                            updated[idx].medicineName = e.target.value;
                            setRxMedicines(updated);
                          }}
                          placeholder="Medicine Name & Strength"
                          className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-bold"
                        />
                        <input
                          type="text"
                          value={medRow.instructions}
                          onChange={(e) => {
                            const updated = [...rxMedicines];
                            updated[idx].instructions = e.target.value;
                            setRxMedicines(updated);
                          }}
                          placeholder="Instructions (e.g. After meals)"
                          className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={medRow.morning}
                              onChange={(e) => {
                                const updated = [...rxMedicines];
                                updated[idx].morning = e.target.checked;
                                setRxMedicines(updated);
                              }}
                            />
                            <span>Morning</span>
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={medRow.afternoon}
                              onChange={(e) => {
                                const updated = [...rxMedicines];
                                updated[idx].afternoon = e.target.checked;
                                setRxMedicines(updated);
                              }}
                            />
                            <span>Afternoon</span>
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={medRow.night}
                              onChange={(e) => {
                                const updated = [...rxMedicines];
                                updated[idx].night = e.target.checked;
                                setRxMedicines(updated);
                              }}
                            />
                            <span>Night</span>
                          </label>
                        </div>

                        <div className="flex items-center gap-1">
                          <span>Duration:</span>
                          <input
                            type="number"
                            value={medRow.durationDays}
                            onChange={(e) => {
                              const updated = [...rxMedicines];
                              updated[idx].durationDays = parseInt(e.target.value) || 1;
                              setRxMedicines(updated);
                            }}
                            className="w-12 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-center"
                          />
                          <span>Days</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewRxModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30"
                  >
                    Save & Dispense Rx
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Printable Prescription Modal */}
        {activeRxView && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans text-xs">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-sm text-blue-800">
                    {activeRxView.clinicHospital}
                  </h3>
                  <p className="text-[11px] text-slate-600 font-bold">
                    {activeRxView.doctorName} ({activeRxView.doctorLicense})
                  </p>
                </div>
                <span className="font-mono text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                  {activeRxView.prescriptionNumber}
                </span>
              </div>

              <div className="space-y-1">
                <p className="font-bold">Patient: {activeRxView.patientName} ({activeRxView.patientAge}y, {activeRxView.patientGender})</p>
                <p className="text-slate-600">Diagnosis: {activeRxView.diagnosis}</p>
              </div>

              <div className="border-t border-b border-slate-200 py-3 space-y-2">
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">
                  Rx Medication Regimen
                </span>
                {activeRxView.medicines.map((m, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 rounded-xl space-y-0.5">
                    <div className="font-bold text-slate-900">{m.medicineName} ({m.dosage})</div>
                    <div className="text-[10px] text-slate-600">
                      Schedule: {m.morning ? "1" : "0"}-{m.afternoon ? "1" : "0"}-{m.night ? "1" : "0"} • For {m.durationDays} Days
                    </div>
                    <div className="text-[10px] text-blue-700 italic">{m.instructions}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-between items-center text-[10px] text-slate-500">
                <span>Digital Signature Verified: {activeRxView.digitalSignatureUrl}</span>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold flex items-center gap-1"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Rx</span>
                </button>
              </div>

              <button
                onClick={() => setActiveRxView(null)}
                className="w-full py-2 rounded-xl bg-slate-200 font-bold"
              >
                Close View
              </button>
            </div>
          </div>
        )}
      </div>
    </RbacGuard>
  );
};
