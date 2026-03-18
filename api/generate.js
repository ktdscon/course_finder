export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { keywords, level } = req.body;
  const API_KEY = process.env.GOOGLE_API_KEY;

  if (!API_KEY) return res.status(500).json({ error: "API 키 설정이 필요합니다." });

  // ✅ 가장 안정적인 정식 통로(v1)와 모델명을 사용합니다.
  const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `당신은 대한민국 IT 교육 전문가입니다. 
                   키워드(${keywords})와 수준(${level})에 맞는 교육 과정명 5개를 생성하세요.
                   결과는 반드시 다른 설명 없이 ["과정명1", "과정명2", "과정명3", "과정명4", "과정명5"] 형식의 JSON 배열로만 답변하세요.`
          }]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API 연결 실패");

    // AI 답변에서 리스트만 추출하는 안전한 로직
    let text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\[.*\]/s); 
    if (!jsonMatch) throw new Error("데이터 형식이 올바르지 않습니다.");
    
    const titles = JSON.parse(jsonMatch[0]);
    res.status(200).json({ titles });

  } catch (e) {
    res.status(500).json({ error: "데이터 처리 오류: " + e.message });
  }
}
