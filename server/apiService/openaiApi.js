const db = require("../dbConn");
const axios = require("axios");
const OpenAI = require('openai');
const client = new OpenAI();

// Google Custom Search API setup (add your keys to .env)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

async function searchPublicInfo(candidateName) {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) return [];
  const query = encodeURIComponent(candidateName);
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${query}`;
  try {
    const res = await axios.get(url);
    return (res.data.items || []).slice(0, 5).map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }));
  } catch {
    return [];
  }
}

const analyzeCandidateProfile = async (req, res) => {
  try {
    const { candidateName, jobTitle, userId, analysisLevel = "Basic" } = req.body;

    if (!candidateName || !jobTitle || !userId) {
      return res.status(400).json({
        success: false,
        message: "candidateName, jobTitle, and userId are required"
      });
    }

    // Fetch education, work, and teaching experience from DB
    const [education, work, teaching] = await Promise.all([
      db.executeQuery("SELECT * FROM tbl_education_background WHERE user_id = ?", [userId]),
      db.executeQuery("SELECT * FROM tbl_work_experience WHERE user_id = ?", [userId]),
      db.executeQuery("SELECT * FROM tbl_teaching_experience WHERE user_id = ?", [userId])
    ]);

    // Format education
    const educationText = education.length
      ? education.map(e =>
          `${e.degree || ""} in ${e.major || ""} from ${e.institution || ""} (${e.year_from || ""}-${e.year_to || ""})`
        ).join("; ")
      : "No education records found.";

    // Format work experience
    const workText = work.length
      ? work.map(w =>
          `${w.position || ""} at ${w.company || ""} (${w.year_from || ""}-${w.year_to || ""})`
        ).join("; ")
      : "No work experience records found.";

    // Format teaching experience
    const teachingText = teaching.length
      ? teaching.map(t =>
          `${t.position || ""} at ${t.institution || ""} (${t.year_from || ""}-${t.year_to || ""})`
        ).join("; ")
      : "No teaching experience records found.";

    // Search Google for public info
    const publicLinks = await searchPublicInfo(candidateName);

    // Compose prompt for OpenAI
    let prompt = `You are an HR assistant. Here is the candidate's background for the position "${jobTitle}":

    Education: ${educationText}
    Work Experience: ${workText}
    Teaching Experience: ${teachingText}

    Below are real public web search results for this candidate:
    ${publicLinks.length ? publicLinks.map(l => `- ${l.title}: ${l.link}`).join('\n') : "No public links found."}

    `;

    switch (analysisLevel) {
      case "Basic":
        prompt += `Write a concise background summary (2-3 paragraphs) for this candidate, focusing on their actual education, work, and teaching experience above. If any public links are relevant, mention them and include the URLs.`;
        break;
      case "Standard":
        prompt += `Write a comprehensive background profile (4-5 paragraphs) for this candidate, using the actual education, work, and teaching experience above. If any public links are relevant, summarize key findings and include the URLs. Highlight any notable achievements or concerns.`;
        break;
      case "Comprehensive":
        prompt += `Write a detailed background analysis (6-8 paragraphs) for this candidate, using the actual education, work, and teaching experience above. Use the public web links to supplement your analysis—summarize any important information from those pages and include the URLs. Assess technical and soft skills, leadership, cultural fit, and give recommendations for hiring.`;
        break;
      default:
        prompt += `Write a background summary for this candidate using the information above.`;
    }

    const response = await client.responses.create({
      model: "gpt-4.1",
      input: prompt
    });

    return res.status(200).json({
      success: true,
      data: {
        analysis: response.output_text,
        candidate: candidateName,
        position: jobTitle,
        analysisLevel,
        publicLinks,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to analyze candidate profile",
      error: error.message
    });
  }
};

const assessCandidatesForJob = async (req, res) => {
  try {
    const { jobTitle, jobRequirements, jobResponsibilities, candidates } = req.body;

    // Compose prompt for OpenAI
    let prompt = `You are an HR expert. Here is a job opening:\n\nTitle: ${jobTitle}\nRequirements: ${jobRequirements}\nResponsibilities: ${jobResponsibilities}\n\nBelow are candidate profiles:\n`;

    candidates.forEach((c, i) => {
      prompt += `\nCandidate ${i + 1}:\nName: ${c.name}\nEmail: ${c.email}\nEducation: ${c.education}\nWork Experience: ${c.work}\nTeaching Experience: ${c.teaching}\nSkills: ${c.skills}\nLanguages: ${c.languages}\nQualifications: ${c.qualifications}\n`;
    });

    prompt += `\nBased on the job description and candidate profiles above, rank the candidates from most to least suitable for this position. For each candidate, briefly explain your reasoning.`;

    // Call OpenAI API
    const response = await client.responses.create({
      model: "gpt-4.1",
      input: prompt
    });

    return res.status(200).json({
      success: true,
      analysis: response.output_text
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to assess candidates",
      error: error.message
    });
  }
};


module.exports = {
  analyzeCandidateProfile,
  assessCandidatesForJob
};