import { NextResponse } from "next/server";
import { getVectorStore } from "@/app/lib/vectorStore";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFParse } from "pdf-parse";
import { Document } from "@langchain/core/documents";

const MAX_FILE_BYTES = 50 * 1024 * 1024;

export async function POST(req) {
  let parser;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "Please upload a PDF file" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File is larger than 50 MB. Choose a smaller PDF." },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!buffer.subarray(0, 1024).includes(Buffer.from("%PDF-"))) {
      return NextResponse.json(
        { error: "The selected file is not a valid PDF" },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "PDF upload is not configured: GOOGLE_API_KEY is missing" },
        { status: 500 }
      );
    }

    if (!process.env.QDRANT_URL) {
      return NextResponse.json(
        { error: "PDF upload is not configured: QDRANT_URL is missing" },
        { status: 500 }
      );
    }

    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text;

    if (!text.trim()) {
      return NextResponse.json(
        { error: "No readable text found in PDF" },
        { status: 400 }
      );
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.splitDocuments([
      new Document({
        pageContent: text,
        metadata: {
          source: file.name,
        },
      }),
    ]);

    const vectorStore = await getVectorStore();
    await vectorStore.addDocuments(docs);

    return NextResponse.json({
      success: true,
      message: "PDF uploaded successfully",
      totalChunks: docs.length,
    });
  } catch (error) {
    console.error("Upload Error:", error);

    return NextResponse.json(
      { error: "PDF upload failed" },
      { status: 500 }
    );

  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
}