const axios = require("axios");
const client = require("../utils/openAiClient");
const openAiRepository = require("../repositories/openAiRepository");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

const createServiceError = (status, message, error) => ({ status, message, error });

const searchPublicInfo = async (candidateName) => {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    return [];
  }

  const query = encodeURIComponent(candidateName);
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${query}`;

  try {
    const res = await axios.get(url);
    return (res.data.items || []).slice(0, 5).map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }));
  } catch {
    return [];
  }
};

const formatEducation = (education) => {
  return education.length
    ? education
        .map(
          (item) =>
            `${item.degree || ""} in ${item.major || ""} from ${item.institution || ""} (${item.year_from || ""}-${item.year_to || ""})`
        )
        .join("; ")
    : "No education records found.";
};

const formatWork = (work) => {
  return work.length
    ? work
        .map(
          (item) =>
            `${item.position || ""} at ${item.company || ""} (${item.year_from || ""}-${item.year_to || ""})`
        )
        .join("; ")
    : "No work experience records found.";
};

const formatTeaching = (teaching) => {
  return teaching.length
    ? teaching
        .map(
          (item) =>
            `${item.position || ""} at ${item.institution || ""} (${item.year_from || ""}-${item.year_to || ""})`
        )
        .join("; ")
    : "No teaching experience records found.";
};

const buildCandidatePrompt = ({ candidateName, jobTitle, analysisLevel, educationText, workText, teachingText, publicLinks }) => {
  let prompt = `You are an HR assistant. Here is the candidate's background for the position "${jobTitle}":

Education: ${educationText}
Work Experience: ${workText}
Teaching Experience: ${teachingText}

Below are real public web search results for this candidate:
${publicLinks.length ? publicLinks.map((link) => `- ${link.title}: ${link.link}`).join("\n") : "No public links found."}

`;

  switch (analysisLevel) {
    case "Basic":
      prompt += "Write a concise background summary (2-3 paragraphs) for this candidate, focusing on their actual education, work, and teaching experience above. If any public links are relevant, mention them and include the URLs.";
      break;
    case "Standard":
      prompt += "Write a comprehensive background profile (4-5 paragraphs) for this candidate, using the actual education, work, and teaching experience above. If any public links are relevant, summarize key findings and include the URLs. Highlight any notable achievements or concerns.";
      break;
    case "Comprehensive":
      prompt += "Write a detailed background analysis (6-8 paragraphs) for this candidate, using the actual education, work, and teaching experience above. Use the public web links to supplement your analysis—summarize any important information from those pages and include the URLs. Assess technical and soft skills, leadership, cultural fit, and give recommendations for hiring.";
      break;
    default:
      prompt += "Write a background summary for this candidate using the information above.";
  }

  return prompt;
};

const analyzeCandidateProfile = async ({ candidateName, jobTitle, userId, analysisLevel = "Basic" }) => {
  if (!candidateName || !jobTitle || !userId) {
    throw createServiceError(400, "candidateName, jobTitle, and userId are required");
  }

  const { education, work, teaching } = await openAiRepository.getCandidateBackgroundByUserId(userId);

  const educationText = formatEducation(education);
  const workText = formatWork(work);
  const teachingText = formatTeaching(teaching);
  const publicLinks = await searchPublicInfo(candidateName);

  const prompt = buildCandidatePrompt({
    candidateName,
    jobTitle,
    analysisLevel,
    educationText,
    workText,
    teachingText,
    publicLinks,
  });

  const response = await client.responses.create({
    model: "gpt-4.1",
    input: prompt,
  });

  return {
    success: true,
    data: {
      analysis: response.output_text,
      candidate: candidateName,
      position: jobTitle,
      analysisLevel,
      publicLinks,
      timestamp: new Date().toISOString(),
    },
  };
};

const assessCandidatesForJob = async ({ jobTitle, jobRequirements, jobResponsibilities, candidates }) => {
  const list = Array.isArray(candidates) ? candidates : [];

  let prompt = `You are an HR expert. Here is a job opening:\n\nTitle: ${jobTitle}\nRequirements: ${jobRequirements}\nResponsibilities: ${jobResponsibilities}\n\nBelow are candidate profiles:\n`;

  list.forEach((candidate, index) => {
    prompt += `\nCandidate ${index + 1}:\nName: ${candidate.name}\nEmail: ${candidate.email}\nEducation: ${candidate.education}\nWork Experience: ${candidate.work}\nTeaching Experience: ${candidate.teaching}\nSkills: ${candidate.skills}\nLanguages: ${candidate.languages}\nQualifications: ${candidate.qualifications}\n`;
  });

  prompt += "\nBased on the job description and candidate profiles above, rank the candidates from most to least suitable for this position. For each candidate, briefly explain your reasoning.";

  try {
    const response = await client.responses.create({
      model: "gpt-4.1",
      input: prompt,
    });

    return {
      success: true,
      analysis: response.output_text,
    };
  } catch (error) {
    throw createServiceError(500, "Failed to assess candidates", error.message);
  }
};

module.exports = {
  analyzeCandidateProfile,
  assessCandidatesForJob,
};
