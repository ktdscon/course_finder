export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { keywords, level } = req.body;
  const API_KEY = process.env.GOOGLE_API_KEY;

  if (!API_KEY) return res.status(500).json({ error: "API 키 설정이 필요합니다." });

  // ✅ 2026년 현재 가장 안정적인 최신 무료 모델과 경로입니다.
  const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=" + API_KEY;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `당신은 대한민국 IT 교육 기획 전문가입니다. 
                   키워드(${keywords})와 수준(${level})에 맞는 매력적인 교육 과정명 5개를 생성하세요.
                   결과는 다른 설명 없이 ["과정명1", "과정명2", "과정명3", "과정명4", "과정명5"] 형식의 JSON 배열로만 답변하세요.`
          }]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API 연결 실패");

    // AI 답변에서 리스트만 쏙 뽑아내기
    let text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\[.*\]/s); 
    if (!jsonMatch) throw new Error("데이터 형식이 올바르지 않습니다.");
    
    const titles = JSON.parse(jsonMatch[0]);
    res.status(200).json({ titles });

  } catch (e) {
    res.status(500).json({ error: "데이터 처리 오류: " + e.message });
  }
}
