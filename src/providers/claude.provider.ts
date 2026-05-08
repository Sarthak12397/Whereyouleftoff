import { AIProvider } from "./provider.interface";

export class ClaudeProvider implements AIProvider {
  name = "Claude";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(prompt: string): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json() as {
      content?: { text: string }[];
      error?: { message: string };
    };

    if (!response.ok) {
      throw new Error(`Claude error: ${data.error?.message ?? "Unknown"}`);
    }

    return data.content?.[0]?.text ?? "";
  }
}