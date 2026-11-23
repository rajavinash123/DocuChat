import { QdrantVectorStore } from "@langchain/qdrant";
import { getEmbeddings } from "@/app/lib/embeddings";
let vectorStore;

export async function getVectorStore() {
    if(!vectorStore){
        vectorStore=await QdrantVectorStore.fromExistingCollection(getEmbeddings(),{
            url:process.env.QDRANT_URL,
            collectionName:"chat_with_doc",
            apiKey: process.env.QDRANT_API_KEY || process.env.API_KEY,
        })
    }
    return vectorStore;
    
}
