Context

The Evolvia chat assistant is currently RAG-only — it can answer questions from uploaded documents but
cannot access live booking data. Clients need to book appointments and check availability through chat.
We integrate OpenAI function calling (tool use) so the assistant can query real services, staff,
availability, and create bookings — all org-scoped.

Architecture

Instead of injecting all booking data into the prompt (token-expensive, fragile), the LLM decides what
it needs and calls tools on demand. RAG continues to work for static salon info (policies, location,
etc.). Conversation history is loaded from DB for multi-turn booking flows.

Client asks question
→ Load conversation history from DB
→ Append RAG context to system prompt (if any)
→ Send to OpenAI with tool definitions
→ LOOP: if model returns tool_calls
→ Execute via booking services (org-scoped)
→ Send results back to OpenAI
→ Repeat (max 8 iterations)
→ Persist final text answer to DB

Files to Create (4)

1.  apps/api/src/modules/chat/tools/tool-result.type.ts (~15 lines)

Shared types:
type ToolResult = { readonly toolCallId: string; readonly functionName: string; readonly result: string
}
type ToolExecutionContext = { readonly orgId: string }

2.  apps/api/src/modules/chat/tools/tool-definitions.ts (~120 lines)

Exports BOOKING_TOOLS: ChatCompletionTool[] with 5 tools:
Tool: list_services
Parameters: none
Maps to: ServicesService.findAll(orgId)
────────────────────────────────────────
Tool: get_staff_for_service
Parameters: service_id
Maps to: StaffServicesService.getStaffForService(orgId, serviceId)
────────────────────────────────────────
Tool: get_available_slots
Parameters: staff_id, date, duration_minutes
Maps to: StaffAvailabilityService.getAvailableSlots(orgId, ...)
────────────────────────────────────────
Tool: get_working_hours
Parameters: staff_id?
Maps to: StaffAvailabilityService.findAll/findByStaff(orgId, ...)
────────────────────────────────────────
Tool: create_booking
Parameters: staff_id, service_id, start_time, client_name, notes?
Maps to: BookingsService.create(orgId, ...) 3. apps/api/src/modules/chat/tools/conversation-builder.ts (~30 lines)

Pure function buildConversationHistory(messages, maxMessages=40):

- Converts DB ChatMessage[] → OpenAI ChatCompletionMessageParam[]
- Takes last N messages to cap token usage
- Only maps user/assistant text turns (tool call internals are ephemeral)

4.  apps/api/src/modules/chat/tools/tool-executor.ts (~150 lines)

@Injectable() class ChatToolExecutor:

- Injects: ServicesService, StaffServicesService, StaffAvailabilityService, BookingsService, PinoLogger
- execute(toolCallId, functionName, args, context) → dispatches via switch to correct service
- Each case maps service results to clean JSON (strips internal fields)
- Wraps each call in try/catch → returns { error: "..." } on failure so the LLM can relay it naturally

Files to Modify (3)

5.  apps/api/src/modules/chat/chat.module.ts

- Add BookingModule to imports (already exports all 5 services)
- Add ChatToolExecutor to providers

6.  apps/api/src/modules/chat/chat.service.ts

Key changes to ask():

1.  Load history: Query prior ChatMessage records for the session, convert via buildConversationHistory()
2.  Build messages array: [system (+ RAG context if any), ...history, current user message]
3.  Remove kbOnly short-circuit: Booking questions work even without RAG hits. The model uses tools for
    dynamic data and RAG context for static info.
4.  Move RAG context: Append to system prompt instead of user message (cleaner for multi-turn)
5.  Add executeToolLoop() private method:

- Calls openai.chat.completions.create() with tools: BOOKING_TOOLS
- If response has tool_calls: execute via ChatToolExecutor, append results, call again
- Loop until final text response or MAX_TOOL_ITERATIONS (8) reached
- Uses immutable message array (spread on each iteration)

6.  Inject ChatToolExecutor in constructor

7.  apps/api/src/modules/chat/system-prompt.md

Rewrite to:

- Describe available tools and when to use them
- Add explicit booking confirmation flow (CRITICAL: never call create_booking without client saying
  "yes")
- Remove "suggest calling the salon" fallback for availability
- Keep: warm receptionist tone, language matching, privacy rules, no medical advice
- Clarify: tools for dynamic data (services, availability, bookings), RAG context for static info
  (policies, location)

Implementation Order
┌──────┬───────────────────────────────┬────────────┐
│ Step │ File │ Depends on │
├──────┼───────────────────────────────┼────────────┤
│ 1 │ tools/tool-result.type.ts │ — │
├──────┼───────────────────────────────┼────────────┤
│ 2 │ tools/tool-definitions.ts │ Step 1 │
├──────┼───────────────────────────────┼────────────┤
│ 3 │ tools/conversation-builder.ts │ — │
├──────┼───────────────────────────────┼────────────┤
│ 4 │ tools/tool-executor.ts │ Steps 1, 2 │
├──────┼───────────────────────────────┼────────────┤
│ 5 │ chat.module.ts │ Step 4 │
├──────┼───────────────────────────────┼────────────┤
│ 6 │ system-prompt.md │ — │
├──────┼───────────────────────────────┼────────────┤
│ 7 │ chat.service.ts │ Steps 2–6 │
└──────┴───────────────────────────────┴────────────┘
Steps 1–3 can be done in parallel. Steps 5–6 can be done in parallel.

Key Design Decisions

- No DB schema changes: Tool call/response messages are ephemeral within ask(). Only the final text
  answer is persisted. Conversation history only contains user/assistant text turns.
- No new endpoints or DTO changes: The existing POST /chat/sessions/:id/ask with AskDto remains
  unchanged.
- Booking safety: System prompt requires explicit client confirmation before create_booking.
  BookingsService.create() has built-in conflict checking. Errors surface naturally through the LLM.
- kbOnly removal: The short-circuit is removed. The model handles both RAG-backed and tool-backed
  answers, and says "I'm not sure" when neither covers the question.

Verification

1.  Manual smoke tests:

- "What services do you offer?" → lists real services from DB
- "Who can do a haircut?" → lists qualified staff
- "What times does Anna have on Monday?" → shows real available slots
- Full booking flow: pick service → pick staff → pick time → confirm → booking created
- Conflict: try to book a taken slot → graceful error
- RAG question (e.g., cancellation policy) → still works from documents
- Armenian language → responds in Armenian
- Out-of-scope question → polite redirect

2.  Build verification: pnpm build in apps/api passes with no type errors
