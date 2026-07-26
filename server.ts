import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Initialize Google GenAI lazily
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "MediFlow ERP", timestamp: new Date().toISOString() });
});

// AI Drug Interaction Checker
app.post("/api/ai/drug-interaction", async (req, res) => {
  try {
    const { medicines } = req.body;
    if (!medicines || !Array.isArray(medicines) || medicines.length < 1) {
      return res.status(400).json({ error: "Please provide an array of medicine names or details." });
    }

    const ai = getGenAI();
    if (!ai) {
      // Fallback response if API key is not set
      return res.json({
        analysis: "Simulated Clinical Interaction Check:",
        severity: medicines.some(m => m.toLowerCase().includes("warfarin") || m.toLowerCase().includes("aspirin")) ? "High" : "Low",
        interactions: [
          {
            pair: medicines.slice(0, 2).join(" + "),
            risk: "Moderate risk of GI bleeding or modified metabolism.",
            recommendation: "Monitor patient symptoms, space administration by 2 hours.",
          },
        ],
        duplicateAlerts: [],
        warnings: ["Verify renal function and patient allergy history."],
        isSimulated: true
      });
    }

    const prompt = `You are an expert clinical pharmacist AI. Analyze the following list of medicines for potential drug-drug interactions, duplicate drug classes, contraindications, and dosage warnings:
Medicines: ${JSON.stringify(medicines)}

Provide a structured analysis in JSON format with fields:
- severity: "None" | "Low" | "Moderate" | "High" | "Severe"
- summary: brief executive clinical overview
- interactions: array of objects { pair: string, risk: string, recommendation: string, severity: string }
- duplicateAlerts: array of strings for overlapping therapeutic classes or active ingredients
- clinicalWarnings: array of key patient counseling or monitoring points`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Error in drug-interaction endpoint:", err);
    res.status(500).json({ error: err.message || "Failed to analyze drug interactions." });
  }
});

// AI Prescription OCR Scanner
app.post("/api/ai/prescription-ocr", async (req, res) => {
  try {
    const { imageBase64, textContent } = req.body;

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        patientName: "John Doe",
        doctorName: "Dr. Sarah Jenkins (MD, Cardiology)",
        diagnosis: "Essential Hypertension & Mild Hyperlipidemia",
        medicines: [
          {
            name: "Amlovas (Amlodipine)",
            dosage: "5mg",
            frequency: "1-0-0 (Morning)",
            duration: "30 days",
            instructions: "Take after breakfast with water",
          },
          {
            name: "Lipitor (Atorvastatin)",
            dosage: "10mg",
            frequency: "0-0-1 (Night)",
            duration: "30 days",
            instructions: "Take at bedtime",
          },
        ],
        notes: "Parsed via clinical rule engine (Simulated).",
        isSimulated: true
      });
    }

    const systemInstruction = `You are a medical OCR specialist trained on doctor handwriting and prescription slips. 
Extract patient information, doctor credentials, diagnosis, and prescription items into JSON.
Structure output with fields:
- patientName: string
- doctorName: string
- diagnosis: string
- medicines: array of objects { name: string, dosage: string, frequency: string, duration: string, instructions: string }
- notes: string`;

    let contents: any = "";
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      contents = {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
          { text: "Extract all prescription details, patient information, medicines, dosages, and instructions from this prescription document image." },
        ],
      };
    } else {
      contents = `Extract prescription details from this text snippet:\n${textContent || ""}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Error in prescription-ocr endpoint:", err);
    res.status(500).json({ error: err.message || "Failed to parse prescription OCR." });
  }
});

// AI Sales Forecast & Stock Predictive Analytics
app.post("/api/ai/forecast", async (req, res) => {
  try {
    const { inventoryData, salesHistory } = req.body;

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        projectedSalesGrowthPercent: 14.5,
        predictedDemandHigh: ["Amoxicillin 500mg", "Paracetamol 650mg", "Cetirizine 10mg"],
        stockoutRiskProducts: [
          { item: "Metformin 500mg", daysUntilDepletion: 4, suggestedOrderQty: 500, supplier: "PharmaGlobal Ltd" },
          { item: "Omeprazole 20mg", daysUntilDepletion: 6, suggestedOrderQty: 300, supplier: "AstraMed Dist." },
        ],
        aiRecommendations: [
          "Increase seasonal inventory of Antihistamines by 25% due to incoming pollen forecast.",
          "Clear out batch #B-2024-89 of Insulin glargine expiring in 18 days via promotional clinical discount.",
        ],
        isSimulated: true
      });
    }

    const prompt = `Analyze this pharmacy inventory state and sales trend:
Inventory: ${JSON.stringify(inventoryData || [])}
Sales History Summary: ${JSON.stringify(salesHistory || [])}

Provide a JSON forecast response with:
- projectedSalesGrowthPercent: number
- predictedDemandHigh: string[]
- stockoutRiskProducts: array of objects { item: string, daysUntilDepletion: number, suggestedOrderQty: number, supplier: string }
- aiRecommendations: string[]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Error in forecast endpoint:", err);
    res.status(500).json({ error: err.message || "Failed to generate AI inventory forecast." });
  }
});

// AI Sales History Analysis & Optimal Reorder Quantities Engine
app.post(["/api/ai/reorder-analysis", "/api/ai/sales-forecast"], async (req, res) => {
  try {
    const { salesHistory, salesData, inventory, medicineList } = req.body;

    const effectiveSales = salesHistory || salesData || [];
    const effectiveInventory = inventory || medicineList || [];

    const ai = getGenAI();
    if (!ai) {
      // Intelligent algorithmic fallback if Gemini key is not configured
      const itemVelocities: Record<string, number> = {};
      (effectiveSales || []).forEach((sale: any) => {
        (sale.items || []).forEach((item: any) => {
          const key = item.medicineId || item.medicineName;
          if (key) {
            itemVelocities[key] = (itemVelocities[key] || 0) + (item.quantity || 1);
          }
        });
      });

      const highVelocityItems = (effectiveInventory || [])
        .map((med: any) => {
          const totalSold = itemVelocities[med.id] || itemVelocities[med.name] || Math.floor(Math.random() * 45 + 12);
          const dailyVelocity = parseFloat((totalSold / 30).toFixed(2));
          const currentStock = med.stock ?? med.currentStock ?? 15;
          const minStock = med.minStock ?? med.min ?? 10;
          const daysUntilStockout = dailyVelocity > 0 ? Math.max(1, Math.round(currentStock / dailyVelocity)) : 999;
          
          const safetyStock = Math.ceil(dailyVelocity * 5);
          const targetStock = Math.ceil(dailyVelocity * 30) + safetyStock;
          const optimalReorderQty = Math.max(minStock * 2, Math.ceil(targetStock - currentStock));
          
          const velocityTier = dailyVelocity >= 1.5 ? "Ultra High" : dailyVelocity >= 0.8 ? "High" : "Moderate";
          const unitPrice = med.unitPrice || 1200;
          const costPrice = med.costPrice || Math.round(unitPrice * 0.7);

          return {
            id: med.id || `MED-${Math.random().toString(36).substring(2, 7)}`,
            name: med.name || "Pharmaceutical Item",
            category: med.category || "General Health",
            currentStock,
            minStock,
            unitPrice,
            costPrice,
            supplierName: med.supplierName || "Primary Wholesaler",
            totalSold30Days: totalSold,
            dailyVelocity,
            daysUntilStockout,
            velocityTier,
            optimalReorderQty,
            estimatedReorderCost: Math.round(optimalReorderQty * costPrice),
            aiRationale: `Based on 30-day sales velocity of ${dailyVelocity} units/day, current stock (${currentStock} units) will last ~${daysUntilStockout} days. Reordering ${optimalReorderQty} units maintains a 30-day target buffer with 5 days safety stock.`,
          };
        })
        .sort((a: any, b: any) => b.dailyVelocity - a.dailyVelocity)
        .slice(0, 10);

      const totalBudget = highVelocityItems.reduce((acc: number, item: any) => acc + item.estimatedReorderCost, 0);

      return res.json({
        highVelocityItems,
        overallSummary: "Analyzed 30-day POS sales velocity across inventory. Identified top mover medications requiring optimal replenishment to prevent stockout gaps during peak dispensing periods.",
        reorderUrgencyLevel: highVelocityItems.some((i: any) => i.daysUntilStockout <= 5) ? "Critical" : "High",
        totalEstimatedReorderBudget: totalBudget,
        seasonalInsights: [
          "High turnover detected in antibiotic and antipyretic categories due to seasonal surge in respiratory prescriptions.",
          "Cardiovascular maintenance medications display steady non-seasonal demand; maintaining 5-day safety buffer prevents unexpected stock depletion.",
          "Fast-moving OTC analgesics show weekend sales spikes; consider adjusting order delivery schedules accordingly."
        ],
        isSimulated: true,
      });
    }

    const prompt = `You are a Senior Pharmaceutical Supply Chain Data Scientist and Inventory Analyst. Analyze the following pharmacy inventory and sales transaction history:

Inventory State: ${JSON.stringify(effectiveInventory || [])}
Recent Sales History: ${JSON.stringify(effectiveSales || [])}

Provide a comprehensive high-velocity item analysis and suggest "Optimal Reorder Quantities" in strict JSON format with fields:
- highVelocityItems: array of objects {
    id: string,
    name: string,
    category: string,
    currentStock: number,
    minStock: number,
    unitPrice: number,
    costPrice: number,
    supplierName: string,
    totalSold30Days: number,
    dailyVelocity: number,
    daysUntilStockout: number,
    velocityTier: "Ultra High" | "High" | "Moderate",
    optimalReorderQty: number,
    estimatedReorderCost: number,
    aiRationale: string
  }
- overallSummary: string (executive summary of velocity findings and reorder strategy)
- reorderUrgencyLevel: "Critical" | "High" | "Normal"
- totalEstimatedReorderBudget: number
- seasonalInsights: string[] (3 actionable bullet points on sales trends and supply chain optimization advice)

Rank highVelocityItems by dailyVelocity descending (top 8-10 items). Ensure optimalReorderQty accounts for daily sales velocity, 5-day safety stock, and lead times.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Error in reorder-analysis endpoint:", err);
    res.status(500).json({ error: err.message || "Failed to analyze sales history for reorder quantities." });
  }
});

// AI Pharmacy Clinical & Operational Assistant Chat
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        reply: `MediFlow AI Assistant (Offline Mode): I received your message "${message}". In full connected mode with GEMINI_API_KEY, I can assist with clinical dosage checks, drug-drug interaction lookups, inventory optimization, and system navigation.`,
        isSimulated: true
      });
    }

    const systemInstruction = `You are MediFlow AI, an authoritative, helpful, and highly compliant Pharmacy ERP & Clinical Assistant.
You assist pharmacists, store managers, and doctors with:
1. Drug interactions, dosing guidelines, side effects, contraindications.
2. Inventory management best practices (FEFO - First Expired First Out, minimum reorder triggers).
3. POS & Prescription processing advice.
4. Pharmacy compliance, controlled drug auditing, and storage temperature requirements.
Be concise, practical, precise, and professional. Use formatting like bullet points and bolding for readability.`;

    const contents = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({ role: h.role === "user" ? "user" : "model", parts: [{ text: h.text }] });
      }
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
      },
    });

    res.json({ reply: response.text });
  } catch (err: any) {
    console.error("Error in chat endpoint:", err);
    res.status(500).json({ error: err.message || "Failed to process AI chat query." });
  }
});

// Start express server with Vite middleware support
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MediFlow ERP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
