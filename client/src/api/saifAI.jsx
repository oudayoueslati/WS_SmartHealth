// Mock AI response function - replace with actual AI service integration
export const getAIResponse = async (message) => {
    try {
      // This is a mock implementation - replace with your actual AI service
      const mockResponses = [
        "Je suis là pour vous aider avec vos habitudes de santé!",
        "Voici quelques conseils pour améliorer vos habitudes...",
        "C'est une excellente habitude à développer!",
        "Je vous recommande de maintenir cette routine."
      ];
      
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return randomResponse;
    } catch (error) {
      console.error('Error getting AI response:', error);
      return "Désolé, je rencontre des difficultés techniques. Veuillez réessayer plus tard.";
    }
  };