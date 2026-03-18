export default async function handler(req, res) {
  // CORS 설정 (기존 유지)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { keywords, level } = req.body;
  const API_KEY = process.env.GOOGLE_API_KEY;

  if (!API_KEY) return res.status(500).json({ error: "API 키 설정 필요" });

  // 정식 버전(v1) 경로 사용
  const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `당신은 IT 교육 기획 전문가입니다. 
                   키워드(${keywords})와 수준(${level})에 맞는 세련된 교육 과정명 5개를 생성하세요.
                   결과는 반드시 다른 설명 없이 ["과정명1", "과정명2", "과정명3", "과정명4", "과정명5"] 형식의 JSON 배열로만 답변하세요.`
          }]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API 호출 실패");

    // 💡 에러의 원인이었던 기호 제거 로직을 더 안전하게 수정했습니다.
    let text = data.candidates[0].content.parts[0].text;
    
    // AI가 마크다운(```json)을 붙여주든 아니든 무조건 JSON만 추출합니다.
    const jsonMatch = text.match(/\[.*\]/s); 
    if (!jsonMatch) throw new Error("결과 형식이 올바르지 않습니다.");
    
    const titles = JSON.parse(jsonMatch[0]);
    res.status(200).json({ titles });

  } catch (e) {
    console.error("Server Error:", e.message);
    res.status(500).json({ error: "데이터 처리 오류: " + e.message });
  }
}
