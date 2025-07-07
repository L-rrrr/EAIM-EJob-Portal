const OpenAI = require('openai');
const client = new OpenAI();

// Candidate profiling function using your exact same working logic
const analyzeCandidateProfile = async (req, res) => {
  try {
    const { candidateName, jobTitle, applicationData } = req.body;

    if (!candidateName || !jobTitle) {
      return res.status(400).json({
        success: false,
        message: "Candidate name and job title are required"
      });
    }

    const input = `Please provide a background profile for ${candidateName} who applied for the ${jobTitle} position. ${applicationData ? `Additional context: ${applicationData}` : ''}

This profile should be succint, and only include relevant information such as the school they attended, their degree, any relevant work experience, and any other qualifications that would be useful for the hiring manager to know about the candidate. Do also watch out for any bad conduct.`;

    // Using your exact same working logic
    const response = await client.responses.create({
        model: "gpt-4.1",
        input: input
    });

    return res.status(200).json({
      success: true,
      data: {
        analysis: response.output_text, // Using your exact same output format
        candidate: candidateName,
        position: jobTitle,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("OpenAI API error:", error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({
        success: false,
        message: "OpenAI API quota exceeded. Please check your billing."
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({
        success: false,
        message: "Invalid OpenAI API key"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to analyze candidate profile",
      error: error.message
    });
  }
};

module.exports = {
  analyzeCandidateProfile
};