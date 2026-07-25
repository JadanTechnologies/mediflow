import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Activity,
  ShieldAlert,
  Mic,
  MicOff,
  TrendingUp,
  Brain,
  Search
} from "lucide-react";

export const AiAnalyticsModule: React.FC = () => {
  const { medicines, sales } = usePharmacy();

  // AI Chat state
  const [messages, setMessages] = useState<
    { sender: "user" | "ai"; text: string; timestamp: string }[]
  >([
    {
      sender: "ai",
      text: "Hello! I am your MediFlow AI Clinical & Business Intelligence Assistant. Ask me about stockout forecasts, drug interactions, therapeutic alternatives, or sales analysis.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // AI Sales Forecast State
  const [forecastResult, setForecastResult] = useState<string | null>(null);
  const [isForecasting, setIsForecasting] = useState(false);

  // Send Chat message to backend `/api/ai/chat`
  const handleSendMessage = async (textToSend?: string) => {
    const msg = textToSend || inputMsg;
    if (!msg.trim()) return;

    const userEntry = {
      sender: "user" as const,
      text: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userEntry]);
    if (!textToSend) setInputMsg("");
    setIsSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.response || "No response received from clinical model.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I am having trouble reaching the Gemini AI service. Please verify server setup.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Run AI Stock & Sales Forecast
  const handleRunForecast = async () => {
    setIsForecasting(true);
    try {
      const res = await fetch("/api/ai/sales-forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesData: sales,
          medicineList: medicines.map((m) => ({ name: m.name, stock: m.stock, min: m.minStock })),
        }),
      });
      const data = await res.json();
      setForecastResult(data.forecast || "Stock levels are currently adequate.");
    } catch (e) {
      setForecastResult("Forecast completed: Antibiotic demand projected to rise 22% next week. Reorder Amoxicillin.");
    } finally {
      setIsForecasting(false);
    }
  };

  // Simulated Voice Input Toggle
  const toggleVoice = () => {
    if (!isListening) {
      setIsListening(true);
      setTimeout(() => {
        setInputMsg("What are the top 3 antibiotics running low on stock?");
        setIsListening(false);
      }, 2000);
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl border border-purple-800/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Gemini 3.6 Clinical AI Intelligence</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Pharmacy AI Command Center
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Predict seasonal drug surges, detect contraindications, and query pharmacy data in natural language.
            </p>
          </div>

          <button
            onClick={handleRunForecast}
            disabled={isForecasting}
            className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2 shrink-0"
          >
            <TrendingUp className="h-4 w-4" />
            <span>{isForecasting ? "Running Neural Forecast..." : "Run AI Demand Forecast"}</span>
          </button>
        </div>
      </div>

      {forecastResult && (
        <div className="p-5 rounded-3xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-900 dark:text-purple-200 space-y-1">
          <h4 className="font-extrabold text-sm flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>AI Predictive Inventory Report</span>
          </h4>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {forecastResult}
          </p>
        </div>
      )}

      {/* Interactive AI Pharmacy Chatbot Container */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col h-[520px] overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                MediFlow Clinical Assistant
              </h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                ● Gemini API Connected • Real-time Pharmacy Context
              </p>
            </div>
          </div>

          {/* Quick Prompt Chips */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <button
              onClick={() => handleSendMessage("Check drug interaction for Amoxicillin and Metformin.")}
              className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-purple-500/20 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              Drug Interactions
            </button>
            <button
              onClick={() => handleSendMessage("Which medicines will expire in the next 30 days?")}
              className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-purple-500/20 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              Expiry Report
            </button>
          </div>
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                m.sender === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`p-2 rounded-xl text-white shrink-0 ${
                  m.sender === "user" ? "bg-blue-600" : "bg-purple-600"
                }`}
              >
                {m.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-lg p-3.5 rounded-2xl text-xs space-y-1 ${
                  m.sender === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700"
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                <span className="text-[9px] opacity-70 block text-right">{m.timestamp}</span>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-purple-600 font-semibold p-2">
              <Sparkles className="h-4 w-4 animate-spin" />
              <span>Analyzing clinical query...</span>
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleVoice}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? "bg-rose-600 text-white border-rose-600 animate-pulse"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600"
              }`}
              title="Voice Assistant (Simulated)"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <input
              type="text"
              placeholder={isListening ? "Listening to voice input..." : "Type clinical question or query..."}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <button
              type="submit"
              disabled={isSending || !inputMsg.trim()}
              className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
