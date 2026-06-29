export async function triggerWorkflow(env) {
  try {
    const { GITHUB_TOKEN, OWNER, REPO, WORKFLOW_ID, BRANCH } = env;

    // 校验必要的环境变量
    const missing = [];
    if (!GITHUB_TOKEN) missing.push('GITHUB_TOKEN');
    if (!OWNER) missing.push('OWNER');
    if (!REPO) missing.push('REPO');
    if (!WORKFLOW_ID) missing.push('WORKFLOW_ID');
    if (!BRANCH) missing.push('BRANCH');
    if (missing.length) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    const url = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`;
    const payload = { ref: BRANCH };

    console.log(`Triggering workflow: ${OWNER}/${REPO}/${WORKFLOW_ID} on branch ${BRANCH}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorJson = await response.json();
        errorDetail = JSON.stringify(errorJson);
      } catch {
        errorDetail = await response.text();
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorDetail}`);
    }

    console.log(`Workflow triggered successfully at ${new Date().toISOString()}`);
    return new Response("Workflow triggered successfully", { status: 200 });
  } catch (err) {
    console.error(`Failed to trigger workflow: ${err.message}`);
    return new Response("Failed to trigger workflow: " + err.message, { status: 500 });
  }
}
