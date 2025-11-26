import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs";

// Text extraction for various file types
async function extractTextFromFile(fileUrl: string, fileType: string, fileName: string): Promise<string> {
  try {
    // Fetch the file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || fileType;
    const buffer = await response.arrayBuffer();
    const nodeBuffer = Buffer.from(buffer);

    // Handle different file types
    if (contentType.includes("text/plain") || fileName.toLowerCase().endsWith(".txt")) {
      return nodeBuffer.toString("utf-8");
    }

    if (contentType.includes("text/markdown") || fileName.toLowerCase().endsWith(".md")) {
      return nodeBuffer.toString("utf-8");
    }

    // PDF processing
    if (contentType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf")) {
      try {
        // Ensure we have a valid buffer
        if (!nodeBuffer || nodeBuffer.length === 0) {
          throw new Error("Invalid or empty PDF buffer");
        }
        
        // Import pdf-parse module - it exports PDFParse as a class
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let PDFParse: any;
        try {
          // First try: require (works in Node.js runtime)
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pdfParseModule = require("pdf-parse");
          PDFParse = pdfParseModule.PDFParse || pdfParseModule.default?.PDFParse || pdfParseModule;
        } catch {
          // Fallback: dynamic import
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pdfParseModule: any = await import("pdf-parse");
          PDFParse = pdfParseModule.PDFParse || pdfParseModule.default?.PDFParse || pdfParseModule.default || pdfParseModule;
        }
        
        // Validate PDFParse is available
        if (!PDFParse) {
          throw new Error("PDFParse class not found in pdf-parse module");
        }
        
        // Create instance and extract text
        const pdfParser = new PDFParse({ data: nodeBuffer });
        const textResult = await pdfParser.getText();
        
        if (!textResult || !textResult.text) {
          return `[PDF Document: ${fileName} - No extractable text found. This PDF may contain only images or be encrypted.]`;
        }
        
        const extractedText = textResult.text.trim();
        if (!extractedText || extractedText.length === 0) {
          return `[PDF Document: ${fileName} - No extractable text found. This PDF may contain only images or be encrypted.]`;
        }
        
        // Clean up
        await pdfParser.destroy();
        
        return extractedText;
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError);
        const errorMessage = pdfError instanceof Error 
          ? pdfError.message 
          : String(pdfError);
        const fullError = pdfError instanceof Error && pdfError.stack
          ? `${errorMessage}\nStack: ${pdfError.stack}`
          : errorMessage;
        console.error("Full PDF error details:", fullError);
        return `[PDF Document: ${fileName} - Error extracting text: ${errorMessage}]`;
      }
    }

    // Word Document processing (.docx)
    if (
      contentType.includes("word") ||
      contentType.includes("officedocument") ||
      fileName.toLowerCase().endsWith(".docx")
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer: nodeBuffer });
        return result.value || `[Word Document: ${fileName} - No extractable text found]`;
      } catch (docError) {
        console.error("DOCX parsing error:", docError);
        // Try as .doc (older format - requires different library)
        if (fileName.toLowerCase().endsWith(".doc")) {
          return `[Word Document (.doc): ${fileName} - .doc format requires additional processing. Please convert to .docx for text extraction.]`;
        }
        return `[Word Document: ${fileName} - Error extracting text: ${(docError as Error).message}]`;
      }
    }

    // Default: try to read as text
    try {
      return nodeBuffer.toString("utf-8");
    } catch {
      return `[Binary file: ${fileName} - Unable to extract text. File URL: ${fileUrl}]`;
    }
  } catch (error) {
    console.error("Error extracting text from file:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, fileName, fileType } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: "File URL is required" }, { status: 400 });
    }

    if (!fileName) {
      return NextResponse.json({ error: "File name is required" }, { status: 400 });
    }

    const extractedText = await extractTextFromFile(fileUrl, fileType || "", fileName);

    return NextResponse.json({
      extractedText,
      fileName,
      fileType,
      success: true,
    });
  } catch (error) {
    console.error("Error processing file:", error);
    const errorMessage = (error as Error).message || "Unknown error";
    return NextResponse.json(
      { 
        error: "Failed to process file", 
        details: errorMessage,
        success: false,
      },
      { status: 500 }
    );
  }
}

