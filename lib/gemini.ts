import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("Gemini API key is required. Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash-exp",
});

export interface AIAnalysis {
  summary: string;
  suggestedSteps: string[];
  estimatedTime: string;
  difficulty: "Easy" | "Medium" | "Hard";
  resources: {
    title: string;
    url: string;
    type: "article" | "video" | "documentation" | "course";
  }[];
  tips: string[];
  contextualActions?: {
    type: string;
    label: string;
    description: string;
    url?: string;
  }[];
}

export async function analyzeTask(taskText: string, priority: string): Promise<AIAnalysis> {
  try {
    const prompt = `
    Analyze this study/work task and provide helpful suggestions:
    
    Task: "${taskText}"
    Priority: ${priority}
    
    IMPORTANT: Return ONLY a valid JSON object with no additional text, markdown formatting, or code blocks.
    
    Provide a comprehensive analysis in this exact JSON format:
    {
      "summary": "Brief analysis of what this task involves",
      "suggestedSteps": ["Step 1", "Step 2", "Step 3"],
      "estimatedTime": "Realistic time estimate (e.g., '2-3 hours', '30 minutes', '1 week')",
      "difficulty": "Easy",
      "resources": [
        {
          "title": "Resource name",
          "url": "https://example.com",
          "type": "article"
        }
      ],
      "tips": ["Helpful tip 1", "Helpful tip 2"],
      "contextualActions": [
        {
          "type": "productivity",
          "label": "Create template",
          "description": "Create a template for similar tasks",
          "url": "https://docs.google.com/document/create"
        }
      ]
    }
    
    Requirements:
    - Provide 3-5 realistic and actionable steps
    - Include 2-4 relevant online resources with real URLs (prefer educational sites like Khan Academy, Coursera, MDN, etc.)
    - Give 3-5 practical tips for completing the task efficiently
    - Set difficulty as "Easy", "Medium", or "Hard"
    - Consider the priority level when suggesting approaches
    - Resource types must be: "article", "video", "documentation", or "course"
    - Include 1-3 contextual actions that could help with this specific task (e.g., creating templates, setting reminders, opening relevant tools)
    - For contextual actions, suggest practical digital tools or services that would be helpful
    
    Return only the JSON object, no other text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Raw AI response:", text); // Debug logging
    
    // Extract JSON from markdown code blocks if present
    let jsonText = text.trim();
    
    // Remove markdown code block formatting if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Clean up any remaining formatting
    jsonText = jsonText.trim();
    
    console.log("Cleaned JSON text:", jsonText); // Debug logging
    
    // Parse the JSON response
    const analysis: AIAnalysis = JSON.parse(jsonText);
    
    // Validate the response structure
    if (!analysis.summary || !analysis.suggestedSteps || !analysis.estimatedTime || !analysis.difficulty) {
      throw new Error("Invalid response structure from AI");
    }
    
    return analysis;
  } catch (error) {
    console.error("Error analyzing task with Gemini:", error);
    
    // If it's a JSON parse error, we'll also try to log what we were trying to parse
    if (error instanceof SyntaxError) {
      console.error("Failed to parse JSON. This might help debug the issue.");
    }
    
    // Return a fallback analysis
    return {
      summary: "Unable to analyze task at the moment. Please try again later.",
      suggestedSteps: [
        "Break down the task into smaller, manageable parts",
        "Set a specific time and place to work on it", 
        "Gather all necessary resources and materials",
        "Create a simple plan or checklist",
        "Start with the easiest part to build momentum"
      ],
      estimatedTime: "Varies based on complexity",
      difficulty: "Medium",
      resources: [
        {
          title: "Effective Study Strategies - Coursera",
          url: "https://www.coursera.org/articles/study-tips",
          type: "article"
        },
        {
          title: "Time Management Techniques",
          url: "https://www.khanacademy.org/college-careers-more/career-content/productivity-and-time-management",
          type: "course"
        }
      ],
      tips: [
        "Take regular breaks using the Pomodoro Technique (25 min work, 5 min break)",
        "Stay organized with a clear workspace and materials",
        "Set realistic goals and celebrate small wins",
        "Ask for help when you get stuck",
        "Review and reflect on your progress regularly"
      ],
      contextualActions: [
        {
          type: "productivity",
          label: "Create a checklist",
          description: "Use a task management tool to organize your work",
          url: "https://docs.google.com/document/create"
        },
        {
          type: "time-management",
          label: "Set a timer",
          description: "Use Pomodoro technique for focused work sessions",
          url: "https://pomofocus.io"
        }
      ]
    };
  }
}
