import { NextResponse } from "next/server";
import { getVectorStore } from "@/app/lib/vectorStore";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFParse } from "pdf-parse";
import { Document } from "@langchain/core/documents";

export async function POST(req) {
  let parser;

  try {
    const formData = await req.formData();

    const file = formData.get("file");

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Please upload a PDF file" },
        { status: 400 }
      );
    }

    // 1. Read PDF buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 2. Extract PDF text
    parser = new PDFParse({ data: buffer });

    const result = await parser.getText();

    const text = result.text;

    if (!text.trim()) {
      return NextResponse.json(
        { error: "No readable text found in PDF" },
        { status: 400 }
      );
    }

    // 3. Split text into chunks
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

    // 4. Store embeddings in Qdrant
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