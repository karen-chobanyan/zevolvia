import type OpenAI from "openai";

type ChatCompletionTool = OpenAI.ChatCompletionTool;

export const BOOKING_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_services",
      description:
        "List all active services offered by the salon, including name, duration, and price.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_staff_for_service",
      description: "Get the list of staff members who can perform a specific service.",
      parameters: {
        type: "object",
        properties: {
          service_id: {
            type: "string",
            description: "The ID of the service to look up staff for.",
          },
        },
        required: ["service_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_available_slots",
      description:
        "Get available time slots for a specific staff member on a given date. Returns open slots that are not already booked.",
      parameters: {
        type: "object",
        properties: {
          staff_id: {
            type: "string",
            description: "The ID of the staff member.",
          },
          date: {
            type: "string",
            description:
              "The date to check availability for. Use YYYY-MM-DD, or a relative phrase like 'today', 'tomorrow', or 'this Monday'. If the user used a relative date, pass it through unchanged.",
          },
          duration_minutes: {
            type: "number",
            description: "The duration of the appointment in minutes. Use the service duration.",
          },
        },
        required: ["staff_id", "date", "duration_minutes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_working_hours",
      description:
        "Get the weekly working schedule (days and hours) for all staff or a specific staff member.",
      parameters: {
        type: "object",
        properties: {
          staff_id: {
            type: "string",
            description:
              "Optional staff member ID. If omitted, returns working hours for all staff.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_booking",
      description:
        "Create a new booking appointment. IMPORTANT: Only call this AFTER the client has explicitly confirmed they want to book.",
      parameters: {
        type: "object",
        properties: {
          staff_id: {
            type: "string",
            description: "The ID of the staff member for the appointment.",
          },
          service_id: {
            type: "string",
            description: "The ID of the service to book.",
          },
          start_time: {
            type: "string",
            description:
              "The appointment start time as an ISO 8601 string (e.g. 2025-06-15T10:00:00.000Z).",
          },
          client_name: {
            type: "string",
            description: "The name of the client making the booking.",
          },
          notes: {
            type: "string",
            description: "Optional notes for the booking.",
          },
        },
        required: ["staff_id", "service_id", "start_time", "client_name"],
      },
    },
  },
];
