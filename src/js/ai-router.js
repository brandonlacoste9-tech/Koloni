/**
 * AI Router - Routes AI generation requests to appropriate endpoints
 */

class AIRouter {
  constructor() {
    this.baseUrl = "/.netlify/functions";
    this.userId = this.getUserId();
  }

  getHeaders() {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Get or create user ID
   * Uses cryptographically secure crypto.randomUUID() when available
   */
  getUserId() {
    let userId = localStorage.getItem("koloni_userId");
    if (!userId) {
      // Use crypto.randomUUID for cryptographically secure random ID (modern browsers)
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        userId = "user_" + crypto.randomUUID();
      } else {
        // Fallback for older browsers - less secure but acceptable for demo purposes
        // Note: For production, consider requiring modern browsers with crypto.randomUUID
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 11);
        userId = "user_" + timestamp + "_" + randomStr;
      }
      localStorage.setItem("koloni_userId", userId);
    }
    return userId;
  }

  /**
   * Check token balance
   */
  async checkTokens(cost) {
    try {
      const response = await fetch(`${this.baseUrl}/token-manager`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          action: "check",
          userId: this.userId,
          cost: cost,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check token balance");
      }

      return await response.json();
    } catch (error) {
      console.error("Error checking tokens:", error);
      throw error;
    }
  }

  /**
   * Get token balance
   */
  async getBalance() {
    try {
      const response = await fetch(`${this.baseUrl}/token-manager`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          action: "balance",
          userId: this.userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get balance");
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting balance:", error);
      throw error;
    }
  }

  /**
   * Generate LongCat content
   */
  async generateLongCat(params) {
    try {
      const response = await fetch(`${this.baseUrl}/generate-longcat`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...params,
          userId: this.userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      return data;
    } catch (error) {
      console.error("Error generating LongCat:", error);
      throw error;
    }
  }

  /**
   * Generate Emu content
   */
  async generateEmu(params) {
    try {
      const response = await fetch(`${this.baseUrl}/generate-emu`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...params,
          userId: this.userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      return data;
    } catch (error) {
      console.error("Error generating Emu:", error);
      throw error;
    }
  }

  /**
   * Export to Instagram
   */
  async exportInstagram(content, format) {
    try {
      const response = await fetch(`${this.baseUrl}/export-instagram`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          content,
          format,
          userId: this.userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Export failed");
      }

      return data;
    } catch (error) {
      console.error("Error exporting to Instagram:", error);
      throw error;
    }
  }

  /**
   * Export to YouTube
   */
  async exportYouTube(content, format) {
    try {
      const response = await fetch(`${this.baseUrl}/export-youtube`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          content,
          format,
          userId: this.userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Export failed");
      }

      return data;
    } catch (error) {
      console.error("Error exporting to YouTube:", error);
      throw error;
    }
  }

  /**
   * Generate video content
   */
  async generateVideo(params) {
    try {
      const response = await fetch(`${this.baseUrl}/generate-video`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...params,
          userId: this.userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Video generation failed");
      }

      return data;
    } catch (error) {
      console.error("Error generating video:", error);
      throw error;
    }
  }

  /**
   * Route generation request based on format
   */
  async generate(format, params) {
    switch (format) {
      case "longcat":
        return await this.generateLongCat(params);
      case "emu":
        return await this.generateEmu(params);
      case "video":
        return await this.generateVideo(params);
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }

  /**
   * Route export request based on platform
   */
  async export(platform, content, format) {
    switch (platform) {
      case "instagram":
        return await this.exportInstagram(content, format);
      case "youtube":
        return await this.exportYouTube(content, format);
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }
}

// Export for use in other scripts
window.AIRouter = AIRouter;
