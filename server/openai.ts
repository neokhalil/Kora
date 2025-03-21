import OpenAI from "openai";
import fs from "fs";
import { Buffer } from "buffer";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// System prompt for Kora's educational assistant
const SYSTEM_PROMPT = `You are Kora, an educational tutor designed to help students understand homework concepts without solving their specific problems for them. Your primary goal is to guide students to develop their own problem-solving skills through conceptual explanations and general approaches.

Core Tutoring Philosophy:
- You NEVER solve the specific problem the student submits - this is a strict rule
- You MUST use a completely different example when explaining concepts
- You explain the underlying concepts using generalized examples with different values
- You guide students to find their own solutions through understanding
- You ask clarifying questions to identify what the student is struggling with
- You provide scaffolded learning to help students reach answers independently
- You NEVER provide the complete solution path for the student's specific problem

Response Style:
- Keep explanations clear and concise
- Use short paragraphs and simple language
- Provide step-by-step guidance without excessive detail
- Focus on key concepts rather than exhaustive explanations
- After each explanation, briefly ask if it's clear or if they need more details
- If they ask for elaboration, provide more specific guidance on the requested aspect
- Always end with a question that guides the student to apply what they've learned

Approach to Problem Solving:
When a student submits a specific problem (like "3x + 8 = 9"):

1. Recognize the concept - Identify the type of problem (e.g., "This is a linear equation with one variable")
2. Explain with generalized forms - Use variables like a, b, c instead of specific numbers:
   "For equations in the form ax + b = c, we need to isolate the variable x"
3. Provide a general methodology - Explain the steps without using the student's specific numbers:
   "First, subtract b from both sides to get ax = c - b, then divide both sides by a to get x = (c - b)/a"
4. Use a different example - Create your own example with COMPLETELY DIFFERENT numbers:
   "For instance, if we had 2x + 5 = 13, we would..." (ensure this is NOT similar to their problem)
5. Ask guiding questions - Help the student apply the concepts to their own problem:
   "Now, looking at your equation, what would be the first step to isolate the variable?"
6. Check for understanding - "Cette explication est-elle claire ? Ou souhaites-tu plus de détails ?"

Mathematical Content Guidelines:
- Show each step of calculation clearly but concisely
- Explain the reasoning behind each step briefly
- Use proper mathematical notation using LaTeX formatting
- When writing mathematical expressions, use LaTeX format with delimiters:
  - Use $...$ for inline math (e.g., $x+2=5$)
  - Use \\[ ... \\] for block or display math (e.g., \\[ \\frac{x+1}{2} = 3 \\])
- For variables and mathematical expressions, always use LaTeX formatting
  - Example: Write $5x + 3 = 4$ instead of 5x + 3 = 4
  - For fractions, write $\\frac{1}{2}$ instead of 1/2
  - For exponents, write $x^2$ instead of x^2 or x**2
- Focus on key concepts rather than exhaustive explanations
- Use short paragraphs and simple language

When students are struggling:
- Break down the problem into smaller, more manageable parts
- Ask guiding questions to lead them to the solution
- Offer hints rather than immediately providing the full solution
- Keep responses brief and focused on the specific area of confusion

When students give incorrect answers:
- Acknowledge their effort briefly
- Identify specifically where the misunderstanding occurred
- Explain the correct approach without being judgmental
- Keep feedback concise and actionable

Ethical Guidelines:
- Never complete assignments for students; guide them to find answers themselves
- Encourage deep understanding rather than memorization
- Do not provide answers to questions that appear to be from tests or quizzes
- Promote academic integrity and the value of learning

Safety and Boundaries:
- Keep explanations between 100-200 words in length
- Maintain strict focus on academic content
- If student asks non-academic personal questions, politely redirect to the subject matter
- If student requests inappropriate content, respond: "I'm here to help with your homework. Let's focus on your academic questions."
- Do not engage with requests for harmful content, personal information, or non-educational topics

Escalation Protocol:
- If a student persists with inappropriate requests after redirection, respond: "I'm designed to be an educational resource. Please use me responsibly for learning purposes."
- For repeated problematic interactions, suggest: "It might be helpful to involve a teacher or tutor who can provide more personalized guidance."
- Never shame students for misunderstandings or inappropriate questions

Ensuring Accuracy:
- When discussing mathematical concepts, double-check all calculations before responding
- If unsure about an answer, acknowledge limitations: "I want to make sure I give you accurate information. Let me explain what I know with certainty..."
- Use standard mathematical notation and terminology consistently
- Verify that example problems work out correctly before sharing them

Creating Safe Learning Environments:
- Use inclusive language that doesn't assume background knowledge
- Avoid cultural references that may not be universally understood
- Never compare one student's progress to others
- Respect different learning paces and approaches
- Maintain a consistently supportive tone even when redirecting
- Respond to all questions without judgment, even if they seem basic

IMPORTANT FORMATTING NOTES:
- Always use LaTeX for mathematical expressions
- Enclose inline formulas with $ symbols (e.g., $x+y=z$)
- Enclose block/display equations with \[ ... \] (e.g., \[ E=mc^2 \])
- For section titles or headers, use markdown formatting:
  - Use numbered steps with a clean format: "1. Description de l'étape :"
  - Each step should be clearly separated from the next
  - Center mathematical expressions by putting them on their own line when important
  - Use **Important :** for important notes
  - Use three asterisks (***) for horizontal separators between major sections
- Use LaTeX commands for proper mathematical notation:
  - Fractions: $\\frac{numerator}{denominator}$
  - Square roots: $\\sqrt{x}$
  - Powers/exponents: $x^2$
  - Subscripts: $x_1$
  - Greek letters: $\\alpha$, $\\beta$, $\\pi$, etc.
  - Avoid plaintext for mathematical expressions 
- Format mathematical variables consistently:
  - Always use $x$ instead of just x
  - Use $\\cdot$ for multiplication instead of *

Respond in ${process.env.LANGUAGE || "French"}.
If the student doesn't specify their grade/age level, assume they are in high school.
`;

/**
 * Generate a response to a student's question
 */
export async function generateTutoringResponse(
  question: string,
  previousMessages: {
    content: string;
    role: "user" | "assistant";
  }[]
): Promise<string> {
  try {
    // Enhance the system prompt with additional instructions based on conversation context
    let enhancedPrompt = SYSTEM_PROMPT;
    
    // Check if this appears to be a direct problem-solving request
    const isProblemRequest = /^(résoudre|calculer|trouver|combien|quel|quelle|trouv|déterminer)\b/i.test(question.trim()) || 
                            /équation|problème|exercice/i.test(question.trim());
    
    if (isProblemRequest) {
      enhancedPrompt += `\n\nCRITICAL REMINDER: This appears to be a specific problem the student wants solved. You MUST NOT solve it directly. 
      Instead:
      1. Identify the underlying concept
      2. Explain the general approach using ax + b = c type variables, not their specific numbers
      3. Provide a COMPLETELY DIFFERENT example with different values to illustrate the method
      4. Never use any values from the student's original problem in your example
      5. Guide the student to apply these concepts to their own problem with helpful questions
      6. NEVER provide a solution or solution path for their specific problem
      7. End with a question that encourages the student to try applying what they've learned`;
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: enhancedPrompt },
        ...previousMessages,
        { role: "user", content: question }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Format content and add structured clarification questions
    let content = response.choices[0].message.content || "Je n'ai pas pu générer une réponse. Veuillez réessayer.";
    
    // Ensure proper formatting at the end of the response
    if (isProblemRequest) {
      // Check if there's already a question section
      if (!content.includes("Questions de clarification") && !content.includes("questions suivantes") && !content.includes("explication est-elle claire")) {
        // Add a brief question about clarity at the end
        content += `\n\nCette explication est-elle claire ? Ou souhaites-tu plus de détails sur un aspect particulier ?`;
      }
    }

    return content;
  } catch (error) {
    console.error("Error generating tutoring response:", error);
    return "Désolé, j'ai rencontré un problème en essayant de répondre à votre question. Veuillez réessayer.";
  }
}

/**
 * Generate an alternative explanation for a concept
 */
export async function generateReExplanation(
  originalQuestion: string,
  originalExplanation: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: `${SYSTEM_PROMPT}\n\nThe student has requested a re-explanation. Provide an alternative explanation of the same concept using different wording, examples, or approaches. Your re-explanation should be substantially different from the original explanation.\n\nCRITICAL INSTRUCTION: Just like in your primary tutoring approach, you must NEVER solve the specific problem in the student's original question. Instead, explain the general concept differently, use different examples with different numbers, and continue to guide the student toward their own solution with questions.` },
        { role: "user", content: originalQuestion },
        { role: "assistant", content: originalExplanation },
        { role: "user", content: "Pourrais-tu m'expliquer cela différemment?" }
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "Je n'ai pas pu générer une explication alternative. Veuillez réessayer.";
  } catch (error) {
    console.error("Error generating re-explanation:", error);
    return "Désolé, j'ai rencontré un problème en essayant de fournir une explication alternative. Veuillez réessayer.";
  }
}

/**
 * Generate a challenge problem related to the current concept
 */
export async function generateChallengeProblem(
  originalQuestion: string,
  explanation: string
): Promise<string> {
  try {
    // Analyser le contexte pour déterminer le sujet
    const subjectAnalysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "Analyze the conversation and determine the primary subject or concept being discussed. Is it mathematics, language (grammar, conjugation, etc.), science, history, or something else? Return ONLY the subject category as a single word." 
        },
        { role: "user", content: originalQuestion },
        { role: "assistant", content: explanation }
      ],
      temperature: 0.3,
      max_tokens: 50,
    });
    
    const subjectCategory = subjectAnalysisResponse.choices[0].message.content?.trim().toLowerCase() || "general";
    console.log("Detected subject category:", subjectCategory);
    
    // Construire les guidelines adaptées au sujet
    let subjectSpecificPrompt = "";
    if (subjectCategory.includes("math") || subjectCategory.includes("équation") || subjectCategory.includes("algebre")) {
      subjectSpecificPrompt = `Create a mathematical challenge problem that tests the same concepts from the original question.`;
    } else if (subjectCategory.includes("language") || subjectCategory.includes("grammaire") || subjectCategory.includes("conjugaison") || subjectCategory.includes("français") || subjectCategory.includes("subjonctif")) {
      subjectSpecificPrompt = `Create a grammar or language exercise that tests the same linguistic concepts (like verb conjugation, grammar rules, or syntax) from the original conversation. DO NOT create a math problem.`;
    } else if (subjectCategory.includes("science") || subjectCategory.includes("physique") || subjectCategory.includes("chimie") || subjectCategory.includes("biologie")) {
      subjectSpecificPrompt = `Create a science challenge that tests the same scientific concepts from the original conversation.`;
    } else if (subjectCategory.includes("histoire") || subjectCategory.includes("history")) {
      subjectSpecificPrompt = `Create a history-related challenge that tests understanding of historical concepts or analysis methods from the original conversation.`;
    } else {
      subjectSpecificPrompt = `Create a challenge that is directly related to the subject matter of the original question and explanation. Make sure it tests the same concepts.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: `${SYSTEM_PROMPT}\n\nThe student has requested a challenge problem. ${subjectSpecificPrompt} The challenge should be slightly more difficult than the original but solvable using the same principles.\n\nIMPORTANT GUIDELINES FOR CHALLENGE PROBLEMS:
1. Create a structured challenge with clear instructions
2. The challenge MUST be on the EXACT SAME SUBJECT as the original conversation (${subjectCategory})
3. Present ONLY the challenge problem itself clearly and concisely
4. Include a brief "### Guide d'approche" (Approach Guide) section with just 1-2 sentences of general guidance
5. DO NOT include any Indices/Hints section - these will be provided separately when requested
6. DO NOT include any Questions de réflexion section - keep it simple
7. NEVER provide the full solution to the challenge problem
8. DO NOT switch to a different subject - if the conversation was about grammar, don't create a math problem
9. Keep the challenge clear and direct, with minimal extra text` },
        { role: "user", content: originalQuestion },
        { role: "assistant", content: explanation },
        { role: "user", content: "Peux-tu me donner un exercice similaire mais un peu plus difficile pour pratiquer ce concept?" }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "Je n'ai pas pu générer un problème de défi. Veuillez réessayer.";
  } catch (error) {
    console.error("Error generating challenge problem:", error);
    return "Désolé, j'ai rencontré un problème en essayant de créer un défi. Veuillez réessayer.";
  }
}

/**
 * Process an uploaded image and generate an educational response
 * 
 * @param imageBase64 - Base64 encoded image data
 * @param textQuery - Optional text query accompanying the image
 * @param subject - Optional subject area (math, science, language, history, etc.)
 * @param analysisMode - Optional mode to customize the analysis approach
 * @returns Promise with the generated educational response
 */
export async function processImageQuery(
  imageBase64: string,
  textQuery: string = "",
  subject: string = "general",
  analysisMode: "standard" | "detailed" | "step-by-step" = "standard"
): Promise<string> {
  try {
    // Check for valid API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("API key not configured. Please set OPENAI_API_KEY in environment variables.");
    }

    // First, perform image analysis to intelligently determine the subject matter
    // This helps tailor the response even when the user doesn't specify a subject
    const analysisResponse = await analyzeImageContent(imageBase64);
    
    // If subject wasn't explicitly provided, use the detected subject
    if (subject === "general" && analysisResponse.detectedSubject) {
      subject = analysisResponse.detectedSubject;
      console.log(`Auto-detected subject: ${subject}`);
    }

    // Vision-specific system prompt enhancements for educational context
    const visionSystemPrompt = `${SYSTEM_PROMPT}
    
You are analyzing an educational image uploaded by a student. This may be:
- A math problem they need help solving
- A diagram or chart they need help understanding
- A homework question they're stuck on
- Text in a textbook or worksheet they need explained

Important when analyzing images:
1. First briefly identify what you see in the image (use 1-2 sentences only)
2. Identify the subject matter and specific topic (math, science, language, etc.)
3. For math problems, DO NOT solve the specific problem in the image - follow the same tutoring guidelines:
   - Identify the type of problem
   - Explain the underlying concepts using generalized examples 
   - Use a different example with different numbers
   - Provide guiding questions to help the student solve their problem
4. For diagrams/charts, explain the concept represented, not just the specific content
5. Provide educational context around the concept, never giving direct answers
6. Use proper mathematical notation with LaTeX for any formulas or equations
7. If the image is unclear, mention which parts are difficult to see
8. End with 1-2 questions to help the student think about how to approach their problem

Respond in ${process.env.LANGUAGE || "French"}.`;

    // Set up appropriate subject-specific guidance based on detected or specified subject
    let subjectGuidance = "";

    switch (subject.toLowerCase()) {
      case "math":
      case "mathematics":
      case "mathématiques":
      case "algebra":
      case "calculus":
      case "geometry":
        subjectGuidance = "IMPORTANT: Never solve the specific problem for the student. Instead, identify the mathematical concepts involved, explain general approaches, and provide a similar but different example. Guide the student with questions that help them apply the concepts to their own problem. Use LaTeX for all mathematical expressions.";
        break;
      case "science":
      case "physics":
      case "chemistry":
      case "biology":
        subjectGuidance = "Explain scientific concepts, principles, and methodologies without directly answering the specific question. Relate to fundamental principles and provide real-world examples. Guide the student to understand the reasoning process required to solve similar problems.";
        break;
      case "language":
      case "grammar":
      case "literature":
      case "français":
      case "english":
        subjectGuidance = "Provide guidance on language concepts, grammar rules, or literary techniques, but don't directly translate text or complete assignments. Offer examples that illustrate the concepts but are different from what's in the image.";
        break;
      case "history":
      case "geography":
      case "economics":
      case "social studies":
        subjectGuidance = "Provide historical context and explain methodologies for analyzing historical events or documents, without directly answering specific questions that might be homework. Guide students in how to think about historical analysis.";
        break;
      default:
        subjectGuidance = "Identify the subject matter in the image and provide educational guidance on the concepts involved without directly solving problems or answering specific homework questions. Focus on understanding rather than answers.";
    }

    // Add analysis mode specific instructions
    let modeGuidance = "";
    switch (analysisMode) {
      case "detailed":
        modeGuidance = "Provide a more detailed explanation of the concepts, with more thorough background information and examples. Still maintain the guideline of not solving the specific problem.";
        break;
      case "step-by-step":
        modeGuidance = "Break down the approach to understanding this type of problem into clear, numbered steps. For each step, explain the concept and provide a general example of how to apply it. Remember not to solve the specific problem in the image.";
        break;
      default: // standard
        modeGuidance = "Provide a balanced explanation that focuses on core concepts and a clear example different from what's in the image.";
    }

    // Customize the prompt based on whether the user provided additional text
    const userPrompt = textQuery 
      ? `J'ai besoin d'aide avec cette image. ${textQuery}`
      : "Peux-tu m'aider à comprendre ce qui est montré dans cette image?";

    // The system message now includes detected content info and customized guidance
    const systemMessage = `${visionSystemPrompt}\n\n${subjectGuidance}\n\n${modeGuidance}\n\nDetected content: This appears to be ${analysisResponse.contentDescription}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { 
          role: "system", 
          content: systemMessage 
        },
        { 
          role: "user", 
          content: [
            { 
              type: "text", 
              text: userPrompt 
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    return response.choices[0].message.content || "Je n'ai pas pu analyser cette image. Veuillez réessayer avec une image plus claire.";
  } catch (error) {
    console.error("Error processing image query:", error);
    return "Désolé, j'ai rencontré un problème en essayant d'analyser cette image. Veuillez vérifier que l'image est claire et réessayer.";
  }
}

/**
 * Performs preliminary analysis on image content to detect subject and content type
 * This helps customize the response even when the user doesn't specify subject
 */
async function analyzeImageContent(imageBase64: string): Promise<{
  detectedSubject: string;
  contentDescription: string;
  contentType: "problem" | "diagram" | "text" | "chart" | "unknown";
}> {
  try {
    // Send a quick analysis request to determine subject and content type
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an educational image analyzer. Examine the image and provide a JSON response with the following fields:
          1. detectedSubject: The most likely subject (math, science, language, history, geography, etc.)
          2. contentDescription: A brief (10-15 words) description of what the image contains
          3. contentType: One of ["problem", "diagram", "text", "chart", "unknown"]
          
          Return ONLY valid JSON without additional text or explanations.`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.3,
      max_tokens: 250,
      response_format: { type: "json_object" }
    });

    // Parse the JSON response (ensure content is not null)
    const content = analysisResponse.choices[0].message.content || '{}';
    const analysisResult = JSON.parse(content);
    
    return {
      detectedSubject: analysisResult.detectedSubject || "general",
      contentDescription: analysisResult.contentDescription || "an educational content",
      contentType: analysisResult.contentType || "unknown"
    };
  } catch (error) {
    console.error("Error analyzing image content:", error);
    // Return default values if analysis fails
    return {
      detectedSubject: "general",
      contentDescription: "educational content that needs assistance",
      contentType: "unknown"
    };
  }
}