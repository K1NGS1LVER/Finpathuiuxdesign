// ============================================================
// FinPath — Real Document Extractor
// Uses pdfjs-dist for PDFs and tesseract.js for image OCR
// Extracts salary, debt, and deduction data using regex patterns
// ============================================================

import * as pdfjsLib from 'pdfjs-dist';

// Set up the PDF.js worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// ── Result Types ────────────────────────────────────────
export interface ExtractionResult {
  success: boolean;
  type: 'salary' | 'debt' | 'unknown';
  data: {
    /** Monthly or annual income found */
    income?: number;
    /** Whether the income value is annual */
    isAnnual?: boolean;
    /** Basic salary component */
    basicSalary?: number;
    /** HRA component */
    hra?: number;
    /** Total deductions from salary slip (PF, tax, etc.) */
    salaryDeductions?: number;
    /** Net / take-home pay */
    netPay?: number;
    /** Loan EMI amount */
    emi?: number;
    /** Loan principal / outstanding */
    loanAmount?: number;
    /** Interest rate */
    interestRate?: number;
    /** Loan type detected */
    loanType?: string;
  };
  /** Raw text extracted (for debugging) */
  rawText: string;
  /** Human-readable summary */
  summary: string;
}

// ── PDF Text Extraction ─────────────────────────────────
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

// ── Image OCR Extraction ────────────────────────────────
async function extractTextFromImage(file: File): Promise<string> {
  // Dynamic import to avoid loading tesseract eagerly
  const Tesseract = await import('tesseract.js');
  
  const imageUrl = URL.createObjectURL(file);
  
  try {
    const result = await Tesseract.recognize(imageUrl, 'eng', {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR] Progress: ${Math.round((m.progress || 0) * 100)}%`);
        }
      },
    });
    
    return result.data.text;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

// ── Intelligent Data Parsing ────────────────────────────

/** Parse Indian number formats: 1,20,000 or 120000 or 1.2L */
function parseIndianNumber(str: string): number {
  if (!str) return 0;
  
  // Handle lakh notation: "1.5L" or "1.5 Lakh"
  const lakhMatch = str.match(/([\d.]+)\s*(?:L|lakh|lac)/i);
  if (lakhMatch) return parseFloat(lakhMatch[1]) * 100000;
  
  // Handle crore notation
  const croreMatch = str.match(/([\d.]+)\s*(?:Cr|crore)/i);
  if (croreMatch) return parseFloat(croreMatch[1]) * 10000000;
  
  // Remove currency symbols and commas
  const cleaned = str.replace(/[₹$,\s]/g, '').replace(/Rs\.?/gi, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Extract all currency amounts from text */
function extractAmounts(text: string): { label: string; amount: number }[] {
  const results: { label: string; amount: number }[] = [];
  
  // Pattern: "Label ... ₹XX,XXX" or "Label ... Rs. XX,XXX" or "Label: XX,XXX"
  const patterns = [
    // ₹ or Rs followed by number
    /([A-Za-z\s\/\-().]+?)[\s:]*[₹]\s*([\d,]+(?:\.\d{1,2})?)/g,
    /([A-Za-z\s\/\-().]+?)[\s:]*Rs\.?\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /([A-Za-z\s\/\-().]+?)[\s:]*INR\s*([\d,]+(?:\.\d{1,2})?)/gi,
    // Label followed by number (common in tables)
    /([A-Za-z\s\/\-().]+?)[\s:]+(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)\b/g,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const label = match[1].trim();
      const amount = parseIndianNumber(match[2]);
      if (amount > 0 && label.length > 1 && label.length < 60) {
        results.push({ label, amount });
      }
    }
  }
  
  return results;
}

/** Try to detect if this is a salary slip */
function detectSalarySlip(text: string): ExtractionResult['data'] | null {
  const lower = text.toLowerCase();
  
  // Check for salary-related keywords
  const salaryKeywords = [
    'salary', 'pay slip', 'payslip', 'pay stub', 'earnings', 'gross',
    'net pay', 'take home', 'basic pay', 'ctc', 'allowance', 'hra',
    'dearness', 'conveyance', 'provident fund', 'pf', 'esi',
    'professional tax', 'tds', 'income tax', 'employer', 'employee',
    'designation', 'department', 'employee id', 'emp id',
  ];
  
  const matchedKeywords = salaryKeywords.filter(kw => lower.includes(kw));
  if (matchedKeywords.length < 2) return null; // Need at least 2 keywords
  
  const amounts = extractAmounts(text);
  const data: ExtractionResult['data'] = {};
  
  // Try to find specific salary components
  for (const { label, amount } of amounts) {
    const l = label.toLowerCase();
    
    if (/gross\s*(salary|pay|earning|total)/i.test(l) || /total\s*earning/i.test(l)) {
      data.income = amount;
    } else if (/net\s*(salary|pay|take|amount)/i.test(l) || /take\s*home/i.test(l)) {
      data.netPay = amount;
    } else if (/basic\s*(salary|pay)?$/i.test(l)) {
      data.basicSalary = amount;
    } else if (/hra|house\s*rent/i.test(l) && !/deduction/i.test(l)) {
      data.hra = amount;
    } else if (/total\s*deduction/i.test(l)) {
      data.salaryDeductions = amount;
    } else if (/ctc|cost\s*to\s*company|annual\s*(salary|ctc|income|gross)/i.test(l)) {
      data.income = amount;
      data.isAnnual = true;
    }
  }
  
  // If we found net pay but not gross, use net pay as income
  if (!data.income && data.netPay) {
    data.income = data.netPay;
  }
  
  // If we found basic but not gross, estimate gross as basic * 2 (rough CTC estimate)
  if (!data.income && data.basicSalary) {
    data.income = data.basicSalary;
  }
  
  // Last resort: find the largest reasonable amount in the document
  if (!data.income && amounts.length > 0) {
    // Filter for amounts that could be a salary (between 5K and 50L monthly, or up to 6Cr annual)
    const candidateAmounts = amounts
      .filter(a => a.amount >= 5000 && a.amount <= 60000000)
      .sort((a, b) => b.amount - a.amount);
    
    if (candidateAmounts.length > 0) {
      // The largest amount in a salary slip is usually gross salary or CTC
      data.income = candidateAmounts[0].amount;
      // If > 5L, it's probably annual
      if (data.income > 500000) {
        data.isAnnual = true;
      }
    }
  }
  
  return data.income ? data : null;
}

/** Try to detect if this is a loan / debt document */
function detectLoanDocument(text: string): ExtractionResult['data'] | null {
  const lower = text.toLowerCase();
  
  const loanKeywords = [
    'loan', 'emi', 'equated monthly', 'installment', 'principal',
    'outstanding', 'disbursement', 'repayment', 'tenure', 'interest rate',
    'rate of interest', 'sanction', 'mortgage', 'home loan', 'car loan',
    'personal loan', 'education loan', 'credit card', 'statement',
    'minimum due', 'total due', 'balance', 'overdue',
  ];
  
  const matchedKeywords = loanKeywords.filter(kw => lower.includes(kw));
  if (matchedKeywords.length < 2) return null;
  
  const amounts = extractAmounts(text);
  const data: ExtractionResult['data'] = {};
  
  // Detect loan type
  if (/home\s*loan|housing\s*loan|mortgage/i.test(lower)) data.loanType = 'Home Loan';
  else if (/car\s*loan|auto\s*loan|vehicle/i.test(lower)) data.loanType = 'Car Loan';
  else if (/personal\s*loan/i.test(lower)) data.loanType = 'Personal Loan';
  else if (/education\s*loan|student/i.test(lower)) data.loanType = 'Education Loan';
  else if (/credit\s*card/i.test(lower)) data.loanType = 'Credit Card';
  else data.loanType = 'Loan';
  
  for (const { label, amount } of amounts) {
    const l = label.toLowerCase();
    
    if (/emi|monthly\s*(installment|payment|amount)/i.test(l) || /equated/i.test(l)) {
      data.emi = amount;
    } else if (/principal|loan\s*amount|sanction|disburs/i.test(l)) {
      data.loanAmount = amount;
    } else if (/interest\s*rate|rate\s*of\s*interest|roi/i.test(l)) {
      data.interestRate = amount;
    } else if (/outstanding|balance|total\s*due|minimum\s*due/i.test(l)) {
      if (!data.loanAmount) data.loanAmount = amount;
    }
  }
  
  // Try to find interest rate from pattern like "X.XX%" or "X.XX % p.a."
  const rateMatch = text.match(/(\d{1,2}(?:\.\d{1,2})?)\s*%\s*(?:p\.?a\.?|per\s*annum)?/i);
  if (rateMatch && !data.interestRate) {
    data.interestRate = parseFloat(rateMatch[1]);
  }
  
  return (data.emi || data.loanAmount) ? data : null;
}

// ── Main Extraction Function ────────────────────────────
export async function extractFromDocument(
  file: File,
  context: 'income' | 'debt'
): Promise<ExtractionResult> {
  let rawText = '';
  
  try {
    // Step 1: Extract text based on file type
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');
    
    if (isPDF) {
      rawText = await extractTextFromPDF(file);
    } else if (isImage) {
      rawText = await extractTextFromImage(file);
    } else {
      return {
        success: false,
        type: 'unknown',
        data: {},
        rawText: '',
        summary: 'Unsupported file format. Please upload a PDF or image file.',
      };
    }
    
    // Step 2: Clean up text
    rawText = rawText.replace(/\s+/g, ' ').trim();
    
    if (rawText.length < 10) {
      return {
        success: false,
        type: 'unknown',
        data: {},
        rawText,
        summary: 'Could not extract any readable text from this document. The file may be scanned poorly or empty.',
      };
    }
    
    console.log('[DocumentExtractor] Extracted text length:', rawText.length);
    console.log('[DocumentExtractor] First 500 chars:', rawText.substring(0, 500));
    
    // Step 3: Try to identify document type and extract data
    if (context === 'income') {
      // Try salary first, then loan
      const salaryData = detectSalarySlip(rawText);
      if (salaryData && salaryData.income) {
        const monthlyIncome = salaryData.isAnnual 
          ? Math.round(salaryData.income / 12) 
          : salaryData.income;
        
        let summary = `Extracted monthly income of ₹${monthlyIncome.toLocaleString('en-IN')}`;
        if (salaryData.isAnnual) summary += ` (from annual CTC of ₹${salaryData.income.toLocaleString('en-IN')})`;
        if (salaryData.basicSalary) summary += `. Basic: ₹${salaryData.basicSalary.toLocaleString('en-IN')}`;
        if (salaryData.hra) summary += `, HRA: ₹${salaryData.hra.toLocaleString('en-IN')}`;
        
        return {
          success: true,
          type: 'salary',
          data: { ...salaryData, income: monthlyIncome },
          rawText,
          summary,
        };
      }
    }
    
    if (context === 'debt') {
      const loanData = detectLoanDocument(rawText);
      if (loanData && (loanData.emi || loanData.loanAmount)) {
        let summary = '';
        if (loanData.loanType) summary += `${loanData.loanType} detected. `;
        if (loanData.emi) summary += `Monthly EMI: ₹${loanData.emi.toLocaleString('en-IN')}. `;
        if (loanData.loanAmount) summary += `Principal: ₹${loanData.loanAmount.toLocaleString('en-IN')}. `;
        if (loanData.interestRate) summary += `Interest: ${loanData.interestRate}% p.a.`;
        
        return {
          success: true,
          type: 'debt',
          data: loanData,
          rawText,
          summary: summary.trim(),
        };
      }
    }
    
    // Try both types as a fallback
    const salaryFallback = detectSalarySlip(rawText);
    if (salaryFallback && salaryFallback.income) {
      const monthlyIncome = salaryFallback.isAnnual 
        ? Math.round(salaryFallback.income / 12) 
        : salaryFallback.income;
      return {
        success: true,
        type: 'salary',
        data: { ...salaryFallback, income: monthlyIncome },
        rawText,
        summary: `Found income data: ₹${monthlyIncome.toLocaleString('en-IN')}/month`,
      };
    }
    
    const loanFallback = detectLoanDocument(rawText);
    if (loanFallback) {
      return {
        success: true,
        type: 'debt',
        data: loanFallback,
        rawText,
        summary: `Found loan data: EMI ₹${(loanFallback.emi || 0).toLocaleString('en-IN')}/month`,
      };
    }
    
    // Nothing found
    return {
      success: false,
      type: 'unknown',
      data: {},
      rawText,
      summary: 'Penny could not find salary or loan details in this document. Please check the file or enter your details manually.',
    };
    
  } catch (error: any) {
    console.error('[DocumentExtractor] Error:', error);
    return {
      success: false,
      type: 'unknown',
      data: {},
      rawText,
      summary: `Oops! Penny had trouble reading this file. Please make sure it's a clear document, or just enter your details manually.`,
    };
  }
}
