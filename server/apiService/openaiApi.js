const OpenAI = require('openai');
const client = new OpenAI();

const analyzeCandidateProfile = async (req, res) => {
  try {
    const { candidateName, jobTitle, applicationData, analysisLevel = "Basic" } = req.body;

    if (!candidateName || !jobTitle) {
      return res.status(400).json({
        success: false,
        message: "Candidate name and job title are required"
      });
    }

    // Generate different prompts based on analysis level
    let input;
    
    switch (analysisLevel) {
      case "Basic":
        input = `Please provide a brief background profile for ${candidateName} who applied for the ${jobTitle} position. ${applicationData ? `Additional context: ${applicationData}` : ''}

Focus on: educational background, current role, and basic qualifications. Keep it concise (2-3 paragraphs).`;
        break;
        
      case "Standard":
        input = `Please provide a comprehensive background profile for ${candidateName} who applied for the ${jobTitle} position. ${applicationData ? `Additional context: ${applicationData}` : ''}

Include: educational background, work experience, key skills, relevant achievements, and cultural fit assessment. Provide moderate detail (4-5 paragraphs).`;
        break;
        
      case "Comprehensive":
        input = `Please provide a detailed background analysis for ${candidateName} who applied for the ${jobTitle} position. ${applicationData ? `Additional context: ${applicationData}` : ''}

Conduct a thorough analysis including: educational background, complete work history, technical and soft skills assessment, leadership experience, cultural fit, potential red flags, growth potential, salary expectations, and specific recommendations for the hiring decision. Provide extensive detail (6-8 paragraphs with structured sections).`;
        break;
        
      default:
        input = `Please provide a background profile for ${candidateName} who applied for the ${jobTitle} position. ${applicationData ? `Additional context: ${applicationData}` : ''}`;
    }

    const response = await client.responses.create({
        model: "gpt-4.1",
        input: input
    });

    return res.status(200).json({
      success: true,
      data: {
        analysis: response.output_text,
        candidate: candidateName,
        position: jobTitle,
        analysisLevel: analysisLevel,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    // Error handling remains the same
  }
};

module.exports = {
  analyzeCandidateProfile
};