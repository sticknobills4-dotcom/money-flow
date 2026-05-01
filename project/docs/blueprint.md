# **App Name**: Cashflow AI

## Core Features:

- Interactive Dashboard: Displays an overview of spending, including total expenses, categorized charts using Recharts, and a list of recent transactions.
- Manual Expense Management: A dedicated UI form for users to manually add, edit, or delete expenses, capturing amount, category, date, and notes.
- AI-Powered Natural Language Input: Utilizes the Vercel AI SDK to parse natural language phrases like 'Spent 500 on cab' and intelligently extract {amount, category, note} for expense tracking, leveraging AI function calling as a tool to save data.
- Conversational Financial Insights: Allows users to query their spending patterns using natural language, such as 'How much did I spend on food?', with the AI retrieving and summarizing relevant data conversationally.
- Secure Data Storage: All expense data is securely stored and managed in a database (Supabase or Firebase) for reliable access and persistence.

## Style Guidelines:

- The primary color, evoking a sense of professionalism and clarity, will be a rich, subdued blue (#295C8D). It will provide a solid foundation for interactive elements and key data points.
- A light, almost ethereal background color (#F0F2F5), subtly derived from the primary hue, will ensure visual cleanliness and excellent readability for textual content.
- For call-to-actions and important highlights, an accent color in an energetic blue-green (#3CCFDD) will provide effective visual contrast and draw user attention.
- All text, including headlines and body content, will use the 'Inter' sans-serif font for its modern, clear, and highly readable characteristics, perfect for a data-centric application.
- Icons will be minimalist and functional, following the Shadcn UI philosophy, prioritizing clarity and immediate comprehension for financial data representation and actions.
- The application will feature a clean, card-based layout, providing clear segregation of information on the dashboard and structured forms for expense entry, optimized for responsive viewing across devices.
- Subtle and purposeful micro-interactions, such as fades on data updates or smooth transitions in the chat interface, will enhance the user experience without causing distraction.