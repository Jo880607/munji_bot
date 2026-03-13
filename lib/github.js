// GitHub API를 통한 코드 자동 push
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'Jo880607';

/**
 * GitHub 레포에 파일 생성/업데이트
 */
async function pushFile(repo, path, content, message) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/contents/${path}`;

  // 기존 파일 확인 (업데이트 시 sha 필요)
  let sha = null;
  try {
    const existing = await fetch(url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });
    if (existing.ok) {
      const data = await existing.json();
      sha = data.sha;
    }
  } catch (e) {}

  const body = {
    message,
    content: Buffer.from(content).toString('base64'),
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return res.json();
}

/**
 * GitHub 레포 자동 생성 (없으면)
 */
async function createRepoIfNotExists(repoName, description = '') {
  // 레포 존재 확인
  const checkRes = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${repoName}`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
  );

  if (checkRes.ok) {
    return { exists: true, url: `https://github.com/${GITHUB_OWNER}/${repoName}` };
  }

  // 새 레포 생성
  const createRes = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: repoName,
      description,
      private: false,
      auto_init: true,
    }),
  });

  const data = await createRes.json();
  return { exists: false, created: true, url: data.html_url };
}

/**
 * 여러 파일을 한번에 push
 */
async function pushMultipleFiles(repo, files, commitMessage) {
  const results = [];
  for (const file of files) {
    const result = await pushFile(repo, file.path, file.content, commitMessage);
    results.push({ path: file.path, success: !!result.content });
  }
  return results;
}

/**
 * 에이전트 산출물에서 코드 블록 추출
 */
function extractCodeFiles(output, agentId) {
  const files = [];
  // ```파일경로 또는 ```language 패턴 매칭
  const codeBlockRegex = /(?:#{1,3}\s*)?(?:`([^`\n]+)`|(\S+\.\w+))\s*\n```[\w]*\n([\s\S]*?)```/g;

  let match;
  while ((match = codeBlockRegex.exec(output)) !== null) {
    const filePath = (match[1] || match[2] || '').trim();
    const content = match[3].trim();
    if (filePath && content && filePath.includes('.')) {
      files.push({ path: filePath.replace(/^\/+/, ''), content });
    }
  }

  // 코드 블록이 없으면 전체 출력을 문서로 저장
  if (files.length === 0 && output.length > 100) {
    const docName = agentId === 'mungmung' ? 'docs/PRD.md'
      : agentId === 'chichi' ? 'docs/marketing-strategy.md'
      : agentId === 'coco' ? 'docs/qa-report.md'
      : `docs/${agentId}-output.md`;

    files.push({ path: docName, content: output });
  }

  return files;
}

export { pushFile, createRepoIfNotExists, pushMultipleFiles, extractCodeFiles };
