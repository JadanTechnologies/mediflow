import React, { useState, useEffect, useRef } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Printer,
  PackagePlus,
  ShoppingCart,
  X,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Search,
  Lock,
  ChevronUp,
  ChevronDown,
  Terminal,
  Radio,
} from "lucide-react";
import { playBeep, playSuccessChime, playActionSound, playErrorSound } from "../../utils/audio";

interface VoiceCommandAssistantProps {
  onSearchQuery?: (query: string) => void;
  onAddToCart?: (medicineName: string) => boolean;
  onClearCart?: () => void;
  onHoldSale?: () => void;
  onCompleteSale?: () => void;
  onPrintInvoice?: () => void;
  onOpenRestock?: () => void;
  embedded?: boolean;
}

export const VoiceCommandAssistant: React.FC<VoiceCommandAssistantProps> = ({
  onSearchQuery,
  onAddToCart,
  onClearCart,
  onHoldSale,
  onCompleteSale,
  onPrintInvoice,
  onOpenRestock,
  embedded = false,
}) => {
  const {
    setActiveTab,
    toggleDarkMode,
    medicines,
    formatCurrency,
    addAuditLog,
  } = usePharmacy();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastCommand, setLastCommand] = useState<{ text: string; action: string; time: string } | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [textSpeechEnabled, setTextSpeechEnabled] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!embedded);
  const [simulatedInput, setSimulatedInput] = useState("");
  const [micError, setMicError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition API
  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setMicError("Microphone permission denied. Click to retry or use typed voice simulation.");
          setIsListening(false);
        } else if (event.error !== "no-speech") {
          setMicError(`Voice engine notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Keep continuous listening if user hasn't toggled off explicitly
        if (isListening) {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        // Process final speech recognition result
        const latestResult = event.results[event.results.length - 1];
        if (latestResult.isFinal || currentTranscript.length > 3) {
          parseAndExecuteCommand(currentTranscript.toLowerCase().trim());
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Speech recognition setup failed:", err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Text to speech helper
  const speakFeedback = (phrase: string) => {
    if (!textSpeechEnabled || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // ignore
    }
  };

  // Command parser logic
  const parseAndExecuteCommand = (rawText: string) => {
    if (!rawText) return;

    const text = rawText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();

    let executedAction = "";
    let feedbackPhrase = "";

    // 1. PRINT INVOICE / RECEIPT
    if (text.includes("print invoice") || text.includes("print receipt") || text.includes("print bill")) {
      executedAction = "Printing Sales Invoice / Receipt";
      feedbackPhrase = "Printing sales receipt now.";
      playSuccessChime();
      if (onPrintInvoice) {
        onPrintInvoice();
      } else {
        window.print();
      }
    }
    // 2. ADD STOCK / RESTOCK
    else if (
      text.includes("add stock") ||
      text.includes("restock") ||
      text.includes("stock in") ||
      text.includes("replenish")
    ) {
      executedAction = "Opening Inventory Restock Modal";
      feedbackPhrase = "Opening medication stock restock window.";
      playBeep();
      if (onOpenRestock) {
        onOpenRestock();
      } else {
        setActiveTab("inventory");
      }
    }
    // 3. CLEAR CART
    else if (text.includes("clear cart") || text.includes("empty cart") || text.includes("reset cart")) {
      executedAction = "Cleared POS Sales Cart";
      feedbackPhrase = "Sales cart cleared.";
      playActionSound();
      if (onClearCart) onClearCart();
    }
    // 4. HOLD SALE
    else if (text.includes("hold sale") || text.includes("park sale") || text.includes("hold order")) {
      executedAction = "Parked / Held Transaction";
      feedbackPhrase = "Holding active transaction.";
      playActionSound();
      if (onHoldSale) onHoldSale();
    }
    // 5. CHECKOUT / COMPLETE SALE
    else if (
      text.includes("complete sale") ||
      text.includes("checkout") ||
      text.includes("pay cash") ||
      text.includes("pay card") ||
      text.includes("finish sale")
    ) {
      executedAction = "Initiating POS Checkout & Payment";
      feedbackPhrase = "Opening payment checkout window.";
      playBeep();
      if (onCompleteSale) onCompleteSale();
    }
    // 6. SEARCH MEDICATION (e.g. "search paracetamol", "find amoxicillin")
    else if (text.startsWith("search ") || text.startsWith("find ") || text.startsWith("look for ")) {
      const query = text.replace(/^(search|find|look for)\s+/, "").trim();
      if (query) {
        executedAction = `Searching for '${query}'`;
        feedbackPhrase = `Searching inventory for ${query}.`;
        playBeep();
        if (onSearchQuery) {
          onSearchQuery(query);
        } else {
          setActiveTab("pos");
        }
      }
    }
    // 7. ADD MEDICATION TO CART (e.g. "add paracetamol", "buy amoxicillin")
    else if (text.startsWith("add ") || text.startsWith("select ") || text.startsWith("buy ")) {
      const targetName = text.replace(/^(add|select|buy)\s+/, "").trim();
      if (targetName && targetName !== "stock" && targetName !== "to cart") {
        if (onAddToCart) {
          const success = onAddToCart(targetName);
          if (success) {
            executedAction = `Added '${targetName}' to POS cart`;
            feedbackPhrase = `Added ${targetName} to cart.`;
            playBeep();
          } else {
            // Find closest matching medicine name
            const match = medicines.find(
              (m) =>
                m.name.toLowerCase().includes(targetName) ||
                m.genericName.toLowerCase().includes(targetName)
            );
            if (match) {
              onAddToCart(match.name);
              executedAction = `Added '${match.name}' to POS cart`;
              feedbackPhrase = `Added ${match.name} to cart.`;
              playBeep();
            } else {
              executedAction = `No matching item for '${targetName}'`;
              feedbackPhrase = `Could not find medication ${targetName}.`;
              playErrorSound();
            }
          }
        } else {
          executedAction = `Searching '${targetName}' in POS`;
          if (onSearchQuery) onSearchQuery(targetName);
        }
      }
    }
    // 8. NAVIGATION COMMANDS
    else if (text.includes("go to pos") || text.includes("open pos") || text.includes("sales station")) {
      executedAction = "Navigated to POS Sales Station";
      feedbackPhrase = "Opening POS Sales Station.";
      setActiveTab("pos");
      playBeep();
    } else if (text.includes("open inventory") || text.includes("go to stock") || text.includes("medications")) {
      executedAction = "Navigated to Inventory Management";
      feedbackPhrase = "Opening Inventory Manager.";
      setActiveTab("inventory");
      playBeep();
    } else if (text.includes("open reports") || text.includes("sales reports") || text.includes("audit logs")) {
      executedAction = "Navigated to Reports & Audit Logs";
      feedbackPhrase = "Opening Reports and Audit Logs.";
      setActiveTab("reports");
      playBeep();
    } else if (text.includes("open analytics") || text.includes("ai insights")) {
      executedAction = "Navigated to AI Analytics Module";
      feedbackPhrase = "Opening AI Analytics.";
      setActiveTab("analytics");
      playBeep();
    } else if (text.includes("open prescriptions") || text.includes("rx orders")) {
      executedAction = "Navigated to Prescriptions Module";
      feedbackPhrase = "Opening Prescriptions.";
      setActiveTab("prescriptions");
      playBeep();
    } else if (text.includes("open customers") || text.includes("patients")) {
      executedAction = "Navigated to Customers & Patients";
      feedbackPhrase = "Opening Customer Database.";
      setActiveTab("customers");
      playBeep();
    } else if (text.includes("open settings") || text.includes("system settings")) {
      executedAction = "Navigated to System Settings";
      feedbackPhrase = "Opening System Settings.";
      setActiveTab("settings");
      playBeep();
    }
    // 9. LOCK SYSTEM
    else if (text.includes("lock screen") || text.includes("lock system") || text.includes("security lock")) {
      executedAction = "Locking Terminal Security Screen";
      feedbackPhrase = "Terminal locked.";
      playActionSound();
      window.dispatchEvent(new CustomEvent("MEDIFLOW_LOCK_TERMINAL"));
    }
    // 10. TOGGLE DARK MODE
    else if (text.includes("dark mode") || text.includes("night mode") || text.includes("light mode")) {
      executedAction = "Toggling Visual Theme";
      feedbackPhrase = "Toggling color theme.";
      toggleDarkMode();
      playBeep();
    }
    // 11. HELP / COMMAND LIST
    else if (text.includes("help") || text.includes("show commands") || text.includes("voice commands")) {
      executedAction = "Showing Voice Command Guide";
      feedbackPhrase = "Here are the available voice commands.";
      setShowHelpModal(true);
      playBeep();
    }

    if (executedAction) {
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastCommand({ text: rawText, action: executedAction, time: now });
      speakFeedback(feedbackPhrase);
      addAuditLog("Voice Command Executed", `Voice command '${rawText}' triggered action: ${executedAction}`);
      
      // Clear transcript after command execution
      setTimeout(() => setTranscript(""), 2500);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setMicError("Web Speech Microphone API is not supported in this browser environment. Use typed command simulation below.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setMicError(null);
      } catch (e) {
        console.warn("Could not start recognition:", e);
        setIsListening(false);
      }
    }
  };

  const handleSimulatedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedInput.trim()) return;
    setTranscript(simulatedInput);
    parseAndExecuteCommand(simulatedInput);
    setSimulatedInput("");
  };

  return (
    <>
      {/* Embedded or Floating Container */}
      <div
        className={`${
          embedded
            ? "w-full"
            : "fixed bottom-5 right-5 z-40 max-w-md w-full px-2 pointer-events-auto"
        }`}
      >
        <div className="bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-4 text-white shadow-2xl transition-all duration-300 relative overflow-hidden">
          {/* Subtle Ambient Pulse Light */}
          {isListening && (
            <div className="absolute inset-0 bg-blue-600/10 animate-pulse pointer-events-none rounded-3xl" />
          )}

          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}
              >
                <Radio className={`h-4 w-4 ${isListening ? "animate-spin" : ""}`} />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-100 flex items-center gap-1.5">
                  <span>MediFlow Voice Command Engine</span>
                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 text-[9px] font-mono font-bold rounded-md border border-amber-500/30">
                    Hands-Free
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isListening ? "Listening... Speak 'Print invoice', 'Add stock', 'Search', 'Clear cart'" : "Click mic or type command to execute actions"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTextSpeechEnabled(!textSpeechEnabled)}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors ${
                  textSpeechEnabled ? "bg-blue-500/20 text-blue-400" : ""
                }`}
                title={textSpeechEnabled ? "Voice Spoken Feedback Enabled" : "Voice Spoken Feedback Muted"}
              >
                {textSpeechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                title="View All Voice Commands Cheat Sheet"
              >
                <HelpCircle className="h-4 w-4" />
              </button>

              {!embedded && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="pt-3 space-y-3 text-xs">
              {/* Listening Microphone Bar */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shrink-0 ${
                    isListening
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
                  }`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  <span>{isListening ? "Listening On..." : "Start Mic"}</span>
                </button>

                {/* Live Transcript / Animated Visualizer */}
                <div className="flex-1 bg-slate-800/90 rounded-2xl p-2.5 border border-slate-700/80 min-h-[42px] flex items-center justify-between gap-2 overflow-hidden">
                  {isListening ? (
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex items-center gap-0.5">
                        <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1 h-5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-slate-200 font-mono text-[11px] truncate italic">
                        {transcript || "Listening for pharmacy voice commands..."}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px] italic truncate">
                      {transcript || "Microphone offline. Click 'Start Mic' or type command..."}
                    </span>
                  )}
                </div>
              </div>

              {/* Error Notice */}
              {micError && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>{micError}</span>
                </div>
              )}

              {/* Last Executed Command Banner */}
              {lastCommand && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center justify-between gap-2 animate-fade-in">
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="font-bold truncate">Heard: "{lastCommand.text}"</span>
                    <span className="text-slate-400 font-normal">➔ {lastCommand.action}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{lastCommand.time}</span>
                </div>
              )}

              {/* Typed Voice Command Simulation Box */}
              <form onSubmit={handleSimulatedSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Terminal className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={simulatedInput}
                    onChange={(e) => setSimulatedInput(e.target.value)}
                    placeholder="Type voice command (e.g. 'print invoice', 'add stock', 'clear cart')..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-xs rounded-xl border border-slate-700 transition-colors"
                >
                  Run
                </button>
              </form>

              {/* Quick Action Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                <span className="text-slate-400 font-bold mr-1">Quick Sample Commands:</span>
                {[
                  "Print Invoice",
                  "Add Stock",
                  "Clear Cart",
                  "Hold Sale",
                  "Search Paracetamol",
                  "Lock System",
                ].map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => {
                      setTranscript(cmd);
                      parseAndExecuteCommand(cmd);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-blue-600/30 text-slate-300 hover:text-white border border-slate-700/60 font-mono transition-all"
                  >
                    "{cmd}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voice Commands Cheat Sheet Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Mic className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                  Pharmacy Voice Command Reference
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Speak these phrases hands-free while at the POS station or inventory terminal.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs max-h-96 overflow-y-auto pr-1">
              <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-slate-800/60 border border-blue-200/60 dark:border-slate-700/60 space-y-2">
                <h4 className="font-extrabold text-blue-900 dark:text-blue-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Printer className="h-3.5 w-3.5" /> POS & Sales Commands
                </h4>
                <ul className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <li>• <span className="font-bold text-blue-600 dark:text-blue-400">"Print Invoice"</span> / <span className="font-bold text-blue-600 dark:text-blue-400">"Print Receipt"</span> - Triggers receipt print</li>
                  <li>• <span className="font-bold text-blue-600 dark:text-blue-400">"Clear Cart"</span> / <span className="font-bold text-blue-600 dark:text-blue-400">"Empty Cart"</span> - Clears current cart</li>
                  <li>• <span className="font-bold text-blue-600 dark:text-blue-400">"Hold Sale"</span> - Holds transaction for customer</li>
                  <li>• <span className="font-bold text-blue-600 dark:text-blue-400">"Checkout"</span> / <span className="font-bold text-blue-600 dark:text-blue-400">"Complete Sale"</span> - Opens payment modal</li>
                  <li>• <span className="font-bold text-blue-600 dark:text-blue-400">"Add [Medication Name]"</span> - Adds item to sales cart</li>
                  <li>• <span className="font-bold text-blue-600 dark:text-blue-400">"Search [Term]"</span> - Searches inventory in real-time</li>
                </ul>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-slate-800/60 border border-purple-200/60 dark:border-slate-700/60 space-y-2">
                <h4 className="font-extrabold text-purple-900 dark:text-purple-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <PackagePlus className="h-3.5 w-3.5" /> Inventory & Stock Commands
                </h4>
                <ul className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <li>• <span className="font-bold text-purple-600 dark:text-purple-400">"Add Stock"</span> / <span className="font-bold text-purple-600 dark:text-purple-400">"Restock"</span> - Opens Stock Restock modal</li>
                  <li>• <span className="font-bold text-purple-600 dark:text-purple-400">"Open Inventory"</span> - Navigates to Inventory Manager</li>
                </ul>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-slate-800/60 border border-amber-200/60 dark:border-slate-700/60 space-y-2">
                <h4 className="font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Navigation & System Security
                </h4>
                <ul className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <li>• <span className="font-bold text-amber-600 dark:text-amber-400">"Go to POS"</span> - Navigates to Sales Station</li>
                  <li>• <span className="font-bold text-amber-600 dark:text-amber-400">"Open Reports"</span> - Navigates to Reports & Audit</li>
                  <li>• <span className="font-bold text-amber-600 dark:text-amber-400">"Lock Screen"</span> - Locks terminal security screen</li>
                  <li>• <span className="font-bold text-amber-600 dark:text-amber-400">"Dark Mode"</span> - Toggles dark/light visual theme</li>
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all"
              >
                Close Reference
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
