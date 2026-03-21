// N8N Copilot — Uses Gemini to modify workflows via natural language

const N8N_URL = process.env.N8N_API_URL;
const N8N_KEY = process.env.N8N_API_KEY;
const GEMINI_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `Tu es un expert n8n. L'utilisateur te demande de modifier un workflow n8n.

RÈGLES:
- Tu reçois le workflow actuel en JSON
- Tu retournes UNIQUEMENT le workflow modifié en JSON valide, rien d'autre
- Ne change pas l'ID du workflow ni les credentials
- Conserve les nodes existants sauf si l'utilisateur demande explicitement de les supprimer
- Quand tu ajoutes un node, génère un ID unique (UUID format)
- Positionne les nouveaux nodes visuellement à droite des existants
- Connecte les nodes logiquement via le champ "connections"
- Utilise les types de nodes n8n corrects (ex: n8n-nodes-base.httpRequest, n8n-nodes-base.if, n8n-nodes-base.set, etc.)
- Si la demande est floue, fais au mieux avec les informations disponibles

IMPORTANT: Ta réponse doit être UNIQUEMENT du JSON valide. Pas de markdown, pas de commentaires, pas de texte avant ou après.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!N8N_URL || !N8N_KEY) {
    return res.status(500).json({ error: 'N8N_API_URL or N8N_API_KEY not configured' });
  }
  if (!GEMINI_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  const { action, workflowId, prompt } = req.body;

  try {
    // Action: list workflows
    if (action === 'list') {
      const wfRes = await fetch(`${N8N_URL}/api/v1/workflows?limit=100`, {
        headers: { 'X-N8N-API-KEY': N8N_KEY },
      });
      if (!wfRes.ok) throw new Error(`n8n error: ${wfRes.status}`);
      const data = await wfRes.json();
      const workflows = (data.data || []).map(w => ({
        id: w.id,
        name: w.name,
        active: w.active,
        nodeCount: w.nodes?.length || 0,
      }));
      return res.status(200).json({ workflows });
    }

    // Action: get workflow detail
    if (action === 'get') {
      if (!workflowId) return res.status(400).json({ error: 'Missing workflowId' });
      const wfRes = await fetch(`${N8N_URL}/api/v1/workflows/${workflowId}`, {
        headers: { 'X-N8N-API-KEY': N8N_KEY },
      });
      if (!wfRes.ok) throw new Error(`n8n error: ${wfRes.status}`);
      const workflow = await wfRes.json();
      return res.status(200).json({ workflow });
    }

    // Action: ask Gemini to modify workflow
    if (action === 'modify') {
      if (!workflowId || !prompt) {
        return res.status(400).json({ error: 'Missing workflowId or prompt' });
      }

      // 1. Fetch current workflow
      const wfRes = await fetch(`${N8N_URL}/api/v1/workflows/${workflowId}`, {
        headers: { 'X-N8N-API-KEY': N8N_KEY },
      });
      if (!wfRes.ok) throw new Error(`n8n error: ${wfRes.status}`);
      const currentWorkflow = await wfRes.json();

      // 2. Send to Gemini
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{
              parts: [{
                text: `Workflow actuel:\n${JSON.stringify(currentWorkflow, null, 2)}\n\nDemande de l'utilisateur: ${prompt}`
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        throw new Error(`Gemini error ${geminiRes.status}: ${errText}`);
      }

      const geminiData = await geminiRes.json();
      const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new Error('Empty response from Gemini');
      }

      // 3. Parse the modified workflow
      let modifiedWorkflow;
      try {
        modifiedWorkflow = JSON.parse(responseText);
      } catch {
        throw new Error('Gemini returned invalid JSON');
      }

      // 4. Compute diff summary
      const origNodes = currentWorkflow.nodes?.length || 0;
      const newNodes = modifiedWorkflow.nodes?.length || 0;
      const addedNodes = Math.max(0, newNodes - origNodes);
      const removedNodes = Math.max(0, origNodes - newNodes);

      const origNodeNames = new Set((currentWorkflow.nodes || []).map(n => n.name));
      const newNodeNames = (modifiedWorkflow.nodes || []).map(n => n.name);
      const added = newNodeNames.filter(n => !origNodeNames.has(n));
      const removed = [...origNodeNames].filter(n => !newNodeNames.includes(n));

      return res.status(200).json({
        modifiedWorkflow,
        diff: {
          totalNodesBefore: origNodes,
          totalNodesAfter: newNodes,
          addedNodes: added,
          removedNodes: removed,
        },
      });
    }

    // Action: apply modified workflow to n8n
    if (action === 'apply') {
      if (!workflowId || !req.body.workflow) {
        return res.status(400).json({ error: 'Missing workflowId or workflow' });
      }

      const workflow = req.body.workflow;

      // Clean up fields n8n doesn't accept on update
      delete workflow.id;
      delete workflow.createdAt;
      delete workflow.updatedAt;
      delete workflow.versionId;

      const updateRes = await fetch(`${N8N_URL}/api/v1/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'X-N8N-API-KEY': N8N_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow),
      });

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        throw new Error(`n8n update error ${updateRes.status}: ${errText}`);
      }

      const updated = await updateRes.json();
      return res.status(200).json({ success: true, workflow: updated });
    }

    return res.status(400).json({ error: 'Invalid action. Use: list, get, modify, apply' });
  } catch (error) {
    console.error('N8N Copilot error:', error);
    return res.status(500).json({ error: error.message });
  }
}
