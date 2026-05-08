import { AIProvider } from "./provider.interface";

export class OpenAIProvider implements AIProvider {
  name = "OpenAI";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(prompt: string): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
      }),
    });

    const data = await response.json() as {
      choices?: { message: { content: string } }[];
      error?: { message: string };
    };

    if (!response.ok) {
      throw new Error(`OpenAI error: ${data.error?.message ?? "Unknown"}`);
    }

    return data.choices?.[0]?.message?.content ?? "";
  }
}