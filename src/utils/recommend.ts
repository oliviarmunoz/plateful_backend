/**
 * Recommend Concept - AI Augmented Version
 */

import { GeminiLLM } from "./gemini-llm.ts";
import FeedbackConcept from "../concepts/Feedback/FeedbackConcept.ts";

export interface Candidate {
  name: string;
}

export class Recommend {
  private policy: Record<string, number> = {};
  private candidates: Candidate[] = [];
  private recommendation: Candidate = { name: "" };
  private feedbackConcept?: FeedbackConcept;
  private userId?: string;

  addPolicy(food: string, rating: number): void {
    this.policy[food] = rating;
  }

  /**
   * Set up the feedback concept and user ID for rating-based recommendations
   */
  setFeedbackConcept(feedbackConcept: FeedbackConcept, userId: string): void {
    this.feedbackConcept = feedbackConcept;
    this.userId = userId;
  }

  /**
   * Load user ratings from the Feedback concept and add them to the policy
   */
  async loadUserRatings(): Promise<void> {
    if (!this.feedbackConcept || !this.userId) {
      throw new Error(
        "Feedback concept and user ID must be set before loading ratings",
      );
    }

    try {
      const ratings = await this.feedbackConcept._getAllUserRatings({
        author: this.userId,
      });

      // Clear existing policy and add ratings
      this.policy = {};

      for (const { feedback } of ratings) {
        // Convert 0-5 rating to 1-5 scale for consistency with existing policy
        const normalizedRating = Math.max(1, feedback.rating);
        this.policy[feedback.target] = normalizedRating;
      }

      console.log(
        `📊 Loaded ${ratings.length} user ratings for recommendations`,
      );
    } catch (error) {
      console.error("❌ Error loading user ratings:", (error as Error).message);
      throw error;
    }
  }

  addCandidate(name: string): void {
    const candidate: Candidate = {
      name,
    };
    this.candidates.push(candidate);
  }

  updateCandidates(newCandidates: Candidate[]): void {
    if (!newCandidates.length) {
      throw new Error("Candidate list cannot be empty.");
    }
    this.candidates = newCandidates;
  }

  async recommend(llm: GeminiLLM, variantPrompt?: string): Promise<Candidate> {
    try {
      if (!this.candidates.length) {
        throw new Error("No candidates were provided.");
      }

      // Load user ratings if feedback concept is available
      if (this.feedbackConcept && this.userId) {
        await this.loadUserRatings();
      }

      if (Object.keys(this.policy).length === 0) {
        throw new Error("No user policy was provided.");
      }

      console.log("🤖 Requesting recommendation from Gemini AI...");

      const prompt = variantPrompt + this.createRecommendationPrompt();
      const text = await llm.executeLLM(prompt);

      console.log("\n✅ Received response from Gemini AI!");
      console.log("\n🤖 RAW GEMINI RESPONSE");
      console.log("======================");
      console.log(text);
      console.log("======================\n");

      // Parse and apply the recommendation
      this.parseLLMResponse(text);
      this.runValidation();
      return this.recommendation;
    } catch (error) {
      console.error("❌ Error calling Gemini API:", (error as Error).message);
      throw error;
    }
  }

  getRecommendation(): Candidate | null {
    return this.recommendation.name ? this.recommendation : null;
  }

  getPolicy(): Record<string, number> {
    return this.policy;
  }

  getCandidates(): Candidate[] {
    return this.candidates;
  }

  /**
   * Create the prompt for Gemini with weighted preferences based on user ratings
   */
  private createRecommendationPrompt(): string {
    return `
Select one dish recommendation from a restaurant menu based on the user's weighted preferences.

USER RATINGS (dish: rating 1–5, where higher ratings indicate stronger preference):
${this.getReadablePolicy()}

RESTAURANT MENU (choose only from these dishes):
${this.getReadableCandidates()}

IMPORTANT: Weight your recommendation heavily based on the user's ratings. 
- Dishes with rating 5 should be strongly preferred
- Dishes with rating 4 should be moderately preferred  
- Dishes with rating 3 should be considered neutral
- Dishes with rating 2 should be avoided
- Dishes with rating 1 should be strongly avoided

If a menu item is similar to a highly-rated dish (rating 4-5), prioritize it.
If a menu item is similar to a low-rated dish (rating 1-2), avoid it.

Return your response **only** as a valid JSON object with this structure:
{
  "recommendation": { "dishName": "exact dish title from the list above" },
  "explanation": {"explanation": "reasoning based on user ratings"}
}
`;
  }

  /**
   * Parse the LLM response
   */
  private parseLLMResponse(responseText: string): void {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const response = JSON.parse(jsonMatch[0]);

      if (!response.recommendation || !response.recommendation.dishName) {
        throw new Error("Invalid response format");
      }
      const rec = response["recommendation"]["dishName"];
      this.recommendation = { name: rec };
    } catch (error) {
      console.error("❌ Error parsing LLM response:", (error as Error).message);
      console.log("Response was:", responseText);
      throw error;
    }
  }

  /**
   * Returns a readable string of the policy
   */
  getReadablePolicy(): string {
    if (!Object.keys(this.policy).length) return "No preferences set.";
    return Object.entries(this.policy)
      .map(([food, rating]) => `- ${food}: ${rating}/5`)
      .join("\n");
  }

  /**
   * Returns a readable string of all candidates
   */
  getReadableCandidates(): string {
    if (!this.candidates.length) return "No candidates available.";
    return this.candidates.map((c) => `- ${c.name}`).join("\n");
  }

  /**
   * Display the preferences of the user in a readable format
   */
  displayPreferences(): void {
    if (!Object.keys(this.policy).length) {
      console.log("No preferences set.");
      return;
    }

    Object.entries(this.policy).forEach(([food, rating]) => {
      console.log(`  Food: ${food}, Rating: ${rating}`);
    });
  }

  /**
   * Display the candidates in a readable format
   */
  displayCandidates(): void {
    this.candidates.forEach((candidate, _) => {
      console.log(`  Dish: ${candidate.name}`);
    });
  }

  /**
   * Display the recommendation of the user
   */
  displayRecommendation(): void {
    console.log(this.recommendation.name);
  }

  /**
   * VALIDATION FUNCTIONS
   */
  validateRecommendationInCandidates(): void {
    if (!this.recommendation) throw new Error("No recommendation generated.");
    const exists = this.candidates.some(
      (c) => c.name.toLowerCase() === this.recommendation.name.toLowerCase(),
    );
    if (!exists) {
      throw new Error(
        `Invalid recommendation: "${this.recommendation.name}" is not in the candidate list.`,
      );
    }
  }
  validateRecommendationIsSpecific(): void {
    if (
      !this.recommendation.name ||
      this.recommendation.name.trim().length === 0 ||
      /(any|none|all|either|maybe)/i.test(this.recommendation.name)
    ) {
      throw new Error(
        `Ambiguous or empty recommendation: "${this.recommendation.name}".`,
      );
    }
  }
  validatePolicyConsistency(): void {
    for (const [food, rating] of Object.entries(this.policy)) {
      if (rating < 1 || rating > 5) {
        throw new Error(
          `Invalid rating ${rating} for "${food}". Ratings must be between 1 and 5.`,
        );
      }
    }
  }

  runValidation(): void {
    this.validateRecommendationInCandidates();
    this.validateRecommendationIsSpecific();
    this.validatePolicyConsistency();
  }
}
