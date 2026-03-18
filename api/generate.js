export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { keywords, level } = req.body;
  if (!keywords?.trim()) return res.status(400).json({ error: "키워드를 입력해주세요." });

  const API_KEY = process.env.GOOGLE_API_KEY;
  
  // ✅ 오류 해결을 위해 정식 버전(v1) 경로를 사용합니다.
  const MODEL_NAME = "gemini-1.5-flash"; 

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `당신은 대한민국 IT 교육 과정 기획 전문가입니다. 
                     KT DS 컨소시엄 수요조사용 교육 과정명 5개를 생성해주세요.

                     키워드: ${keywords}
                     수준: ${level}

                     조건:
                     - 실무에서 바로 쓸 수 있는 세련된 과정명
                     - 수준(${level})이 자연스럽게 반영될 것
                     - 번호 없이 과정명만 줄바꿈으로 5개 출력할 것
                     - JSON 배열 형식으로만 응답: ["과정명1","과정명2","과정명3","과정명4","과정명5"]`
            }]
          }]
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API 오류");

    // 제미나이 응답에서 텍스트 추출
    let text = data.candidates[0].content.parts[0].text;
    
    // AI가 마크다운 형식을 섞어줄 경우를 대비한 정제
    text = text.replace(/```json|```/g, "").trim();
    const titles = JSON.parse(text);

    res.status(200).json({ titles });

  } catch (e) {
    res.status(500).json({ error: "생성 실패: " + e.message });
  }
}
