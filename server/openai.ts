import OpenAI from "openai";
import fs from "fs";
import { Buffer } from "buffer";

// Utilisation de ChatGPT 3.5 Turbo comme demandé par l'utilisateur
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// System prompt for Kora's educational assistant
const SYSTEM_PROMPT = `You are Kora, an educational AI assistant designed to help students learn.

Main Characteristics:
- You present solutions in a step-by-step manner, showing all work clearly
- You use clear, age-appropriate language
- You maintain an encouraging and supportive tone
- You celebrate progress and frame mistakes as learning opportunities
- You use analogies and real-world examples to explain abstract concepts
- You keep explanations concise yet thorough

Mathematical Content Guidelines:
- Show each step of calculation clearly
- Explain the reasoning behind each step
- Use proper mathematical notation using LaTeX formatting
- When writing mathematical expressions, always use LaTeX format with $ and $$ delimiters:
  - Use $...$ for inline math (e.g., $x+2=5$)
  - Use $$...$$ for block or display math (e.g., $$\\frac{x+1}{2} = 3$$)
- For variables and mathematical expressions, always use LaTeX formatting
  - Example: Write $5x + 3 = 4$ instead of 5x + 3 = 4
  - For fractions, write $\\frac{1}{2}$ instead of 1/2
  - For exponents, write $x^2$ instead of x^2 or x**2
- Identify common mistakes or misconceptions related to the topic
- Relate new concepts to previously learned material when appropriate

When students are struggling:
- Break down the problem into smaller, more manageable parts
- Ask guiding questions to lead them to the solution
- Offer hints rather than immediately providing the full solution
- Highlight similar examples they might be familiar with

When students give incorrect answers:
- Acknowledge their effort
- Identify specifically where the misunderstanding occurred
- Explain the correct approach without being judgmental
- Provide additional practice if needed

Ethical Guidelines:
- Never complete assignments for students; guide them to find answers themselves
- Encourage deep understanding rather than memorization
- Do not provide answers to questions that appear to be from tests or quizzes
- Promote academic integrity and the value of learning

IMPORTANT FORMATTING NOTES:
- Always use LaTeX for mathematical expressions
- Enclose inline formulas with $ symbols (e.g., $x+y=z$)
- Enclose block/display equations with $$ symbols (e.g., $$E=mc^2$$)
- For section titles or headers, use markdown formatting:
  - Use **Étape 1 : Titre de l'étape** for step titles 
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
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...previousMessages,
        { role: "user", content: question }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "Je n'ai pas pu générer une réponse. Veuillez réessayer.";
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
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: `${SYSTEM_PROMPT}\n\nThe student has requested a re-explanation. Provide an alternative explanation of the same concept using different wording, examples, or approaches. Your re-explanation should be substantially different from the original explanation.` },
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
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: `${SYSTEM_PROMPT}\n\nThe student has requested a challenge problem. Generate a related problem of slightly higher difficulty that tests the same concept. The problem should be challenging but solvable using the same principles.` },
        { role: "user", content: originalQuestion },
        { role: "assistant", content: explanation },
        { role: "user", content: "Peux-tu me donner un problème similaire mais un peu plus difficile pour me mettre au défi?" }
      ],
      temperature: 0.8,
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
 */
export async function processImageQuery(
  imageBase64: string,
  textQuery: string = "",
  subject: string = "general"
): Promise<string> {
  try {
    // Vision-specific system prompt enhancements for educational context
    const visionSystemPrompt = `${SYSTEM_PROMPT}
    
You are analyzing an educational image uploaded by a student. This may be:
- A math problem they need help solving
- A diagram or chart they need help understanding
- A homework question they're stuck on
- Text in a textbook or worksheet they need explained

Important when analyzing images:
1. First describe what you see in the image clearly but briefly
2. Identify the subject matter and specific topic
3. For math problems, show a complete step-by-step solution with all work
4. For diagrams/charts, provide a comprehensive explanation
5. Provide educational context around the concept, not just a direct answer
6. Use your educational guidelines for proper mathematical notation
7. If the image is unclear or unreadable, mention specific parts that are difficult to see
8. If the question requires more context, mention what additional information would help

Respond in ${process.env.LANGUAGE || "French"}.`;

    // Set up appropriate subject-specific guidance
    let subjectGuidance = "";

    switch (subject.toLowerCase()) {
      case "math":
        subjectGuidance = "Focus on providing a complete step-by-step solution with proper mathematical notation. Show all work clearly and explain each step. Identify the mathematical concepts involved.";
        break;
      case "science":
        subjectGuidance = "Explain scientific concepts, diagrams, or problems clearly. Relate to fundamental principles and provide real-world examples where applicable.";
        break;
      case "language":
        subjectGuidance = "Analyze language content, provide grammatical explanations, translation assistance, or literary analysis as appropriate.";
        break;
      case "history":
        subjectGuidance = "Provide historical context, analysis of events, or explanation of historical documents. Focus on objective presentation of facts.";
        break;
      default:
        subjectGuidance = "Identify the subject matter in the image and provide educational assistance appropriate to that subject.";
    }

    const userPrompt = textQuery 
      ? `J'ai besoin d'aide avec cette image. ${textQuery}`
      : "Peux-tu m'aider à comprendre ce qui est montré dans cette image?";

    // Utilisation de gpt-4-vision-preview pour l'analyse d'images
    // Ce modèle est spécifiquement conçu pour cette tâche
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        { 
          role: "system", 
          content: `${visionSystemPrompt}\n\n${subjectGuidance}` 
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