import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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
- Use LaTeX commands for proper mathematical notation:
  - Fractions: $\\frac{numerator}{denominator}$
  - Square roots: $\\sqrt{x}$
  - Powers/exponents: $x^2$
  - Subscripts: $x_1$
  - Greek letters: $\\alpha$, $\\beta$, $\\pi$, etc.
  - Avoid plaintext for mathematical expressions

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
      model: "gpt-4o",
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
      model: "gpt-4o",
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
      model: "gpt-4o",
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