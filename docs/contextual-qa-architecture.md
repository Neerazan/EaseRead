# Contextual Q&A & AI Reading Companion Architecture

This document serves as the comprehensive technical guide for implementing the AI-Assisted Reading Companion features in EaseRead. It details the architecture, pipelines, and technical considerations required to build context-aware word meanings, block summarization, and a spoiler-free document chat using **NestJS**, **PostgreSQL (pgvector)**, and **LangChain**.

---

## 1. Core Feature Pipelines

The system is divided into three distinct pipelines based on the user's action.

### A. The Non-AI Dictionary Pipeline (Fast & Free)
**Purpose:** Provide instant dictionary definitions for common words without consuming LLM tokens.
- **Trigger:** User selects a single word and clicks "Normal Meaning".
- **Implementation:** `GET /dictionary?word={word}`
- **Flow:**
  1. The API receives the word.
  2. It queries a free dictionary API (e.g., Free Dictionary API) or a locally hosted dataset (WordNet).
  3. Returns the standard definition, part of speech, and example sentence.

### B. The Contextual Action Pipeline (AI-Powered)
**Purpose:** Handle "meaning in context", "summarize", "explain", and "custom question" on a selected text block or word.
- **Trigger:** User selects text and chooses an AI action.
- **Implementation:** `POST /documents/:id/selection-action`
- **Payload:**
  ```json
  {
    "action": "summarize" | "explain" | "context_meaning" | "custom_question",
    "selectedText": "...",
    "surroundingContext": "...", // The paragraph containing the text
    "question": "...", // Only if action is 'custom_question',
    "currentPage": 42
  }
  ```
- **Flow:**
  1. **Prompt Construction:** The API injects the `selectedText` and `surroundingContext` into a rigid prompt based on the `action`.
  2. **Opt-In RAG via Tool Calling:** For `custom_question` and `context_meaning`, the LLM is provided with a Tool (`search_book`).
     - **If context is sufficient:** The LLM answers directly using the provided `surroundingContext`.
     - **If context is insufficient and for the single word( if the meaning of the word is not common or it is only book based or something like that):** The LLM executes the `search_book` tool. The backend intercepts this, runs a conditional RAG search (see Spoiler Prevention), and returns the results to the LLM to formulate the final answer.

### C. The General Chat Pipeline (Progress-Aware RAG)
**Purpose:** A persistent chat interface where users can ask general questions about the book.
- **Trigger:** User sends a message in the sidebar chat.
- **Implementation:** `POST /documents/:id/chat`
- **Payload:**
  ```json
  {
    "message": "Who was the man in the black coat?",
    "currentPage": 42,
    "maxPageRead": 42
  }
  ```
- **Flow:**
  1. **Conversation History:** Retrieve the last N messages for this document/user session from the database.
  2. **Vector Search:** Embed the user's message and perform a similarity search (`pgvector <=>`) against the `document_chunk` table.
  3. **Spoiler Prevention Filtering:** Conditionally append `AND pageNumber <= maxPageRead` to the SQL query (see section 2).
  4. **Generation:** Pass the filtered chunks + conversation history + rigid system prompt to the LLM.

---

## 2. Spoiler Prevention & Document Types

To provide an optimal reading experience, the system dynamically toggles spoiler prevention based on the document type.

### Database Schema Updates
Add the following columns to the `Document` (or settings) entity:
```typescript
@Column({ type: 'enum', enum: ['NOVEL', 'RESEARCH', 'OTHER'] })
documentType: string;

@Column({ type: 'boolean', default: false })
preventSpoilers: boolean; // Default True for Novel, False for Research
```
*Note: Users must be able to manually toggle `preventSpoilers` via the UI settings.*

### Dynamic SQL Query Logic
When executing the vector search (whether via the `search_book` tool call or the general chat pipeline), the SQL query must be dynamic:

```typescript
// Inside QaService.ts or LangChain Retriever
let query = `
  SELECT dc.content, dc."pageNumber", dc."chapterTitle", 1 - (dc.embedding <=> $1::vector) AS similarity
  FROM document_chunk dc
  WHERE dc."fileContentHash" = $2 AND dc.embedding IS NOT NULL
`;
const params: any[] = [embeddingLiteral, fileContentHash];

// Apply Spoiler Prevention filter
if (document.preventSpoilers && maxPageRead) {
  query += ` AND dc."pageNumber" <= $3`;
  params.push(maxPageRead);
}
query += ` ORDER BY similarity ASC LIMIT $` + (params.length + 1);
```

---

## 3. LangChain Implementation Architecture

Since you plan to use **LangChain** (specifically `langchain.js` / `@langchain/core` / `@langchain/google-genai` for NestJS), here is how to structure the AI components.

### 1. The Retriever (pgvector + Filter)
Create a custom Retriever or use LangChain's existing pgvector integration. The key is passing the `preventSpoilers` filter metadata dynamically.
```typescript
// Conceptual LangChain Retriever integration
const vectorStore = new PGVectorStore(embeddings, { /* connection config */ });

const retriever = vectorStore.asRetriever({
    k: 5,
    filter: document.preventSpoilers ? { 
        fileContentHash: document.hash,
        pageNumber: { $lte: maxPageRead } // Depends on the specific LangChain SQL adapter syntax
    } : {
        fileContentHash: document.hash
    }
});
```

### 2. Tool Definition (Function Calling)
Define the Tool that the LLM can call if the immediate context is insufficient.
```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const searchBookTool = tool(
  async ({ query, maxPageRead }) => {
    // 1. Generate embedding for query
    // 2. Perform PgVector search with dynamic spoiler filter
    // 3. Return aggregated chunk text
    return await executeDynamicSearch(query, documentHash, preventSpoilers, maxPageRead);
  },
  {
    name: "search_book",
    description: "Search the book for context about specific characters, places, or terms across the entire text.",
    schema: z.object({
      query: z.string().describe("The specific term or concept to search for."),
      maxPageRead: z.number().describe("The user's maximum read page to prevent spoilers.")
    }),
  }
);
```

### 3. The Agent Framework
Use an Agent architecture (like LangChain's Tool Calling Agent or LangGraph) to orchestrate the contextual action.
```typescript
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";

// 1. Initialize Model
const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-1.5-flash", 
  temperature: 0.2, // Low temp for factual explanations
});

// 2. Bind Tools
const tools = [searchBookTool];

// 3. Create Prompt Template
const prompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a reading companion explaining text. 
   Use the provided Context to answer the user's question. 
   If the context is insufficient to answer completely, you MUST use the 'search_book' tool to find more information.`],
  ["human", `Word/Selection: {selectedText}\nContext: {surroundingContext}\nQuestion: {question}`],
  ["placeholder", "{agent_scratchpad}"]
]);

// 4. Execute
const agent = createToolCallingAgent({ llm: model, tools, prompt });
const agentExecutor = new AgentExecutor({ agent, tools });

const result = await agentExecutor.invoke({
  selectedText: payload.selectedText,
  surroundingContext: payload.surroundingContext,
  question: payload.question
});
```

---

## 4. Crucial UX Considerations

1. **Streaming Responses:** Use `Server-Sent Events (SSE)` to stream the LLM's response back to the client. If an Agent executes a tool call, the user shouldn't stare at a blank screen for 3 seconds. Stream a status like *"Searching book for 'Mithril'..."*. LangChain supports `.streamEvents()` for exactly this.
2. **Structured Outputs (JSON):** For "grammar insights" or "summaries", use LangChain's `.withStructuredOutput(zodSchema)` to force the LLM to return a clean JSON object. This allows your frontend UI to render beautiful definition cards instead of raw markdown text blocks.
3. **Semantic Caching:** Implement a caching layer (Redis) using the hash of `(selectedText + action)`. If a user highlights a common difficult phrase, serve the cached AI response instantly.
