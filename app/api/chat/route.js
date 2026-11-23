import { NextResponse } from "next/server";
import { getVectorStore } from "@/app/lib/vectorStore";
import { getModel } from "@/app/lib/embeddings";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // 1. Connect to Qdrant
    const vectorStore = await getVectorStore();

    // 2. Search relevant documents
    const docs = await vectorStore.similaritySearch(prompt, 5);

    // 3. Extract context
    const context = docs
      .map((doc) => doc.pageContent)
      .join("\n\n");

    // 4. Generate AI response
    const result = await getModel().invoke([
      {
        role: "system",
        content: `
          You are a RAG assistant.

          Answer the user's question using the
          following context.

          If the answer is not available in the
          context, clearly say that you don't know.

          Context:
          ${context}
        `,
      },
      {
        role: "human",
        content: prompt,
      },
    ]);

    // 5. Return response
    return NextResponse.json({
      answer: result.content,
      sources: docs.map((doc) => doc.metadata),
    });

  } catch (error) {
    console.error("Chat API Error:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}